import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test';
import { computeShipment, parseOcaQuote } from '../src/routes/shipping';
import shipping from '../src/routes/shipping';

const originalFetch = globalThis.fetch;

const OCA_SUCCESS_XML = `<?xml version="1.0" encoding="utf-8"?>
<DataSet xmlns="#Oca_e_Pak">
  <diffgr:diffgram xmlns:msdata="urn:schemas-microsoft-com:xml-msdata" xmlns:diffgr="urn:schemas-microsoft-com:xml-diffgram-v1">
    <NewDataSet xmlns="">
      <Table diffgr:id="Table1" msdata:rowOrder="0">
        <Tarifador>24</Tarifador>
        <Precio>400.0000</Precio>
        <idTiposervicio>5</idTiposervicio>
        <Ambito>Principales</Ambito>
        <PlazoEntrega>2</PlazoEntrega>
        <Adicional>0.0000</Adicional>
        <Total>400.0000</Total>
      </Table>
      <Table diffgr:id="Table2" msdata:rowOrder="1">
        <Tarifador>25</Tarifador>
        <Precio>287.1800</Precio>
        <idTiposervicio>5</idTiposervicio>
        <Ambito>Principales</Ambito>
        <PlazoEntrega>1</PlazoEntrega>
        <Adicional>0.0000</Adicional>
        <Total>287.1800</Total>
      </Table>
    </NewDataSet>
  </diffgr:diffgram>
</DataSet>`;

const OCA_ERROR_XML = `<?xml version="1.0" encoding="utf-8"?>
<DataSet xmlns="#Oca_e_Pak">
  <diffgr:diffgram xmlns:msdata="urn:schemas-microsoft-com:xml-msdata" xmlns:diffgr="urn:schemas-microsoft-com:xml-diffgram-v1">
    <NewDataSet xmlns="">
      <Table1 diffgr:id="Table11" msdata:rowOrder="0" diffgr:hasChanges="inserted">
        <Error>No existe un servicio habilitado para el ámbito y operativas elegidos</Error>
      </Table1>
    </NewDataSet>
  </diffgr:diffgram>
</DataSet>`;

const PACKAGES = [
  { weight: 1, height: 20, width: 20, length: 20, quantity: 2 },
  { weight: 2, height: 10, width: 30, length: 40, quantity: 1 },
];

const fetchMock = mock(async (_url: string | URL | Request, _init?: RequestInit) => {
  return new Response(OCA_SUCCESS_XML, { status: 200, headers: { 'Content-Type': 'application/xml' } });
});

function postQuote(payload: unknown) {
  return shipping.request('/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

beforeAll(() => {
  globalThis.fetch = fetchMock;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

describe('computeShipment', () => {
  test('suma peso, volumen y cantidad de paquetes', () => {
    const { totalWeightKg, totalVolumeM3, packageCount } = computeShipment(PACKAGES);
    expect(totalWeightKg).toBe(4);
    expect(totalVolumeM3).toBeCloseTo((20 * 20 * 20 * 2 + 10 * 30 * 40) / 1_000_000, 6);
    expect(packageCount).toBe(3);
  });

  test('aplica defaults (1 kg, 20x20x20 cm) cuando faltan datos', () => {
    const { totalWeightKg, totalVolumeM3, packageCount } = computeShipment([{ quantity: 1 } as never]);
    expect(totalWeightKg).toBe(1);
    expect(totalVolumeM3).toBeCloseTo(0.008, 6);
    expect(packageCount).toBe(1);
  });
});

describe('parseOcaQuote', () => {
  test('devuelve la cotización más barata de un XML de éxito', () => {
    const quote = parseOcaQuote(OCA_SUCCESS_XML);
    expect(quote).not.toBeNull();
    expect(quote!.cost).toBe(287.18);
    expect(quote!.days).toBe(1);
    expect(quote!.ambito).toBe('Principales');
  });

  test('devuelve null ante un XML de error (<Table1><Error>)', () => {
    expect(parseOcaQuote(OCA_ERROR_XML)).toBeNull();
  });

  test('devuelve null ante XML inválido', () => {
    expect(parseOcaQuote('<garbage>')).toBeNull();
  });
});

describe('POST /quote con OCA', () => {
  test('usa el envío personal local (override) con prioridad absoluta y no llama a OCA', async () => {
    fetchMock.mockClear();
    const res = await postQuote({ postalCode: '8000', packages: PACKAGES, cartSubtotal: 50000 });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('manual_override');
    expect(body.method).toBe('Envío personal');
    expect(body.cost).toBe(5000);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('aplica free shipping del override cuando el subtotal alcanza el umbral', async () => {
    const res = await postQuote({ postalCode: '8000', packages: PACKAGES, cartSubtotal: 60000 });
    const body = await res.json();
    expect(body.source).toBe('manual_override');
    expect(body.cost).toBe(0);
  });

  test('cotiza por OCA y redondea el costo', async () => {
    fetchMock.mockClear();
    const res = await postQuote({ postalCode: '1426', packages: PACKAGES, cartSubtotal: 150 });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('oca');
    expect(body.method).toBe('Envío a domicilio (OCA)');
    expect(body.cost).toBe(287);
    expect(body.days).toBe('1 día hábil');
    expect(fetchMock).toHaveBeenCalled();
  });

  test('cae al fallback si OCA falla', async () => {
    fetchMock.mockImplementation(async () => { throw new Error('network down'); });
    const res = await postQuote({ postalCode: '1426', packages: PACKAGES, cartSubtotal: 150 });
    const body = await res.json();
    expect(body.source).toBe('fallback');
    expect(body.cost).toBeGreaterThan(0);
    fetchMock.mockImplementation(async () => new Response(OCA_SUCCESS_XML, { status: 200 }));
  });

  test('rechaza CPs de menos de 4 dígitos', async () => {
    const res = await postQuote({ postalCode: '12', packages: PACKAGES, cartSubtotal: 150 });
    expect(res.status).toBe(400);
  });
});
