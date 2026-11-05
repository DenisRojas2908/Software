import { calcularCronograma, CuotasInvalidasError } from './cuotas';

describe('calcularCronograma (RN-14, D-40)', () => {
  it('RN-14: 1377.50 en 6 cuotas → 5 de 229.58 y la última 229.60 (suma exacta)', () => {
    const c = calcularCronograma(1377.5, 6, 12);
    expect(c).toEqual([229.58, 229.58, 229.58, 229.58, 229.58, 229.6]);
    expect(c.reduce((a, b) => a + b, 0)).toBeCloseTo(1377.5, 2);
  });
  it('RN-14: no se puede pasar el máximo de cuotas (13 con máximo 12)', () => {
    expect(() => calcularCronograma(1000, 13, 12)).toThrow(CuotasInvalidasError);
  });
  it('RN-14: en cuotas se exige al menos 2', () => {
    expect(() => calcularCronograma(1000, 1, 12)).toThrow(CuotasInvalidasError);
  });
});
