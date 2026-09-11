import { describe, it, expect } from 'vitest';
import {
  comboVariantKey,
  computeComboStock,
  computeComboWeight,
} from '../../workers/api/src/services/stock';
import {
  comboVariantKey as serverComboVariantKey,
  computeComboStock as serverComputeComboStock,
  computeComboWeight as serverComputeComboWeight,
} from '../../server/src/services/stock';
import { expandComboCartItem, type Product } from '../data/products';

const toMap = (rows: { id: string; stock: number; weight: number; variant_stock_json?: string }[]) =>
  new Map(rows.map((r) => [r.id, r]));

describe('comboVariantKey', () => {
  it('combina variante + color con el separador |||', () => {
    expect(comboVariantKey('1 Plaza', 'Blanco')).toBe('1 Plaza|||Blanco');
    expect(comboVariantKey('King', undefined)).toBe('King');
    expect(comboVariantKey(undefined, 'Gris')).toBe('Gris');
    expect(comboVariantKey()).toBe('__default__');
  });

  it('espeja la implementación del server', () => {
    expect(comboVariantKey('1 Plaza', 'Blanco')).toBe(serverComboVariantKey('1 Plaza', 'Blanco'));
    expect(comboVariantKey('King')).toBe(serverComboVariantKey('King'));
    expect(comboVariantKey(undefined, 'Gris')).toBe(serverComboVariantKey(undefined, 'Gris'));
    expect(comboVariantKey()).toBe(serverComboVariantKey());
  });
});

describe('computeComboStock', () => {
  const products = toMap([
    { id: 'p1', stock: 10, weight: 2 },
    { id: 'p2', stock: 5, weight: 1 },
    { id: 'p3', stock: 6, weight: 1, variant_stock_json: JSON.stringify({ 'King|||Blanco': 7, 'Gris': 3 }) },
  ]);

  it('usa stock global cuando el componente no tiene variante/color', () => {
    expect(computeComboStock([{ productId: 'p1', quantity: 2 }], products)).toBe(5); // floor(10/2)
  });

  it('usa json_extract del variant_stock_json cuando el componente es variantizado', () => {
    expect(computeComboStock([{ productId: 'p3', variant: 'King', color: 'Blanco', quantity: 2 }], products)).toBe(3);
    expect(computeComboStock([{ productId: 'p3', color: 'Gris', quantity: 1 }], products)).toBe(3);
  });

  it('toma el mínimo entre componentes (stock de combo = MIN(floor(stock/qty)))', () => {
    const components = [
      { productId: 'p1', quantity: 3 }, // floor(10/3)=3
      { productId: 'p2', quantity: 1 }, // 5
    ];
    expect(computeComboStock(components, products)).toBe(3);
  });

  it('es 0 si falta un producto o si algún componente no tiene stock', () => {
    expect(computeComboStock([{ productId: 'nope', quantity: 1 }], products)).toBe(0);
    const pSinStock = toMap([{ id: 'p4', stock: 0, weight: 1 }]);
    expect(computeComboStock([{ productId: 'p4', quantity: 1 }], pSinStock)).toBe(0);
    const pSinVariant = toMap([{ id: 'p5', stock: 4, weight: 1, variant_stock_json: '{}' }]);
    expect(computeComboStock([{ productId: 'p5', variant: 'King', quantity: 1 }], pSinVariant)).toBe(0);
  });

  it('espeja el cálculo del server', () => {
    const components = [
      { productId: 'p1', quantity: 3 },
      { productId: 'p3', variant: 'King', color: 'Blanco', quantity: 2 },
    ];
    expect(computeComboStock(components, products)).toBe(
      serverComputeComboStock(components, products)
    );
  });
});

describe('computeComboWeight', () => {
  const products = toMap([
    { id: 'p1', stock: 10, weight: 2.5 },
    { id: 'p2', stock: 5, weight: 1 },
  ]);

  it('suma weight*qty por componente', () => {
    expect(computeComboWeight([
      { productId: 'p1', quantity: 2 },
      { productId: 'p2', quantity: 1 },
    ], products)).toBe(6); // 2*2.5 + 1
  });

  it('no falla con productos faltantes', () => {
    expect(computeComboWeight([{ productId: 'nope', quantity: 1 }], products)).toBe(0);
  });
});

describe('expandComboCartItem', () => {
  const combo: Product = {
    id: 'combo1',
    name: 'Combo Refugio',
    description: '',
    brand: 'Aiken Blanco',
    category: 'Combos',
    price: 35000,
    stock: 3,
    image: '',
    active: true,
    isCombo: true,
    comboItems: [
      { productId: 'p1', productName: 'Sábanas King', variant: 'King', color: 'Blanco', quantity: 1 },
      { productId: 'p2', productName: 'Toallón 600g', color: 'Gris', quantity: 2 },
      { productId: 'p3', productName: 'Funda Simple', variant: '1 Plaza', quantity: 1 },
      { productId: 'p4', productName: 'Almohada', quantity: 1 },
    ],
  };

  it('expande cada componente en un item de orden con price 0 y qty = componente * cantidad de combos', () => {
    const items = expandComboCartItem(combo, 2);
    expect(items).toHaveLength(4);
    expect(items.map((i) => i.quantity)).toEqual([2, 4, 2, 2]);
    expect(items.every((i) => i.price === 0)).toBe(true);
    expect(items.every((i) => i.comboId === 'combo1' && i.comboName === 'Combo Refugio')).toBe(true);
  });

  it('arma el variant como key combinada variante|||color (o undefined si es base)', () => {
    const items = expandComboCartItem(combo, 1);
    expect(items[0].variant).toBe('King|||Blanco');
    expect(items[1].variant).toBe('Gris');
    expect(items[2].variant).toBe('1 Plaza');
    expect(items[3].variant).toBeUndefined();
  });

  it('prefija el productName con el nombre del combo para contexto en emails/admin', () => {
    const items = expandComboCartItem(combo, 1);
    expect(items[0].productName).toBe('Combo Refugio › Sábanas King');
  });

  it('devuelve [] para un producto sin comboItems', () => {
    const plain: Product = {
      id: 'x', name: 'Producto', description: '', brand: '', category: '',
      price: 100, stock: 5, image: '', active: true,
    };
    expect(expandComboCartItem(plain, 1)).toEqual([]);
  });
});