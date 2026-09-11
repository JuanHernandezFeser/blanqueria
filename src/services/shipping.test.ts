import { describe, it, expect } from 'vitest';
import { combinePackages as workerCombinePackages } from '../../workers/api/src/routes/shipping';
import { combinePackages as serverCombinePackages } from '../../server/src/routes/shipping';

const implementations = {
  worker: workerCombinePackages,
  server: serverCombinePackages,
} as const;

type CombinePackages = typeof workerCombinePackages;
type Packages = Parameters<CombinePackages>[0];

describe('combinePackages', () => {
  describe.each(Object.entries(implementations))('%s', (_name, combine) => {
    it('redondea dimensiones decimales hacia arriba y el peso a gramos enteros', () => {
      expect(combine([{ weight: 1.6, height: 8, width: 31, length: 51.97, quantity: 1 }])).toEqual({
        totalWeightGrams: 1600,
        maxHeight: 8,
        maxWidth: 31,
        maxLength: 52,
      });
    });

    it('toma el máximo de cada eje entre paquetes y redondea hacia arriba', () => {
      expect(
        combine([
          { weight: 2, height: 30, width: 30, length: 30, quantity: 2 },
          { weight: 0.75, height: 25.4, width: 30.96, length: 40, quantity: 1 },
        ])
      ).toEqual({
        totalWeightGrams: 4750,
        maxHeight: 30,
        maxWidth: 31,
        maxLength: 40,
      });
    });

    it('usa defaults (1kg y 20cm) cuando faltan dimensiones', () => {
      const packages = [{}] as unknown as Packages;
      expect(combine(packages)).toEqual({
        totalWeightGrams: 1000,
        maxHeight: 20,
        maxWidth: 20,
        maxLength: 20,
      });
    });

    it('multiplica el peso por la cantidad de cada paquete', () => {
      expect(combine([{ weight: 1, height: 10, width: 10, length: 10, quantity: 3 }])).toEqual({
        totalWeightGrams: 3000,
        maxHeight: 10,
        maxWidth: 10,
        maxLength: 10,
      });
    });
  });

  it('espeja el resultado entre worker y server', () => {
    const cases: Packages[] = [
      [{ weight: 1.6, height: 8, width: 31, length: 51.97, quantity: 1 }],
      [
        { weight: 2, height: 30, width: 30, length: 30, quantity: 2 },
        { weight: 0.75, height: 25.4, width: 30.96, length: 40, quantity: 1 },
      ],
    ];
    for (const packages of cases) {
      expect(workerCombinePackages(packages)).toEqual(serverCombinePackages(packages));
    }
  });
});