import {
  calcularPrimaFinal,
  DescuentoExcedeMaximoError,
  resolverDescuento,
  validarDescuentoNegociado,
} from './descuentos';

describe('Descuentos (RN-07, RN-08, RN-09)', () => {
  it('RN-07: rechaza un descuento negociado de 12 % cuando el máximo es 10 %', () => {
    expect(() => validarDescuentoNegociado(12, 10)).toThrow(DescuentoExcedeMaximoError);
  });
  it('RN-07: acepta 8 % y exactamente el máximo (10 %)', () => {
    expect(() => validarDescuentoNegociado(8, 10)).not.toThrow();
    expect(() => validarDescuentoNegociado(10, 10)).not.toThrow();
  });
  it('RN-08: solo primera compra → 5 %', () => {
    expect(resolverDescuento({ primeraCompra: 5, negociado: null }, 10)).toEqual({
      tipo: 'PRIMERA_COMPRA',
      porcentaje: 5,
    });
  });
  it('RN-08: sin primera compra ni negociado → 0 %', () => {
    expect(resolverDescuento({ primeraCompra: null, negociado: null }, 10)).toEqual({
      tipo: null,
      porcentaje: 0,
    });
  });
  it('RN-09: no se acumulan; con 5 % y 8 % se aplica 8 % (no 13 %)', () => {
    expect(resolverDescuento({ primeraCompra: 5, negociado: 8 }, 10)).toEqual({
      tipo: 'NEGOCIADO',
      porcentaje: 8,
    });
  });
  it('RN-09: si el negociado es menor que el de primera compra, se aplica primera compra', () => {
    expect(resolverDescuento({ primeraCompra: 5, negociado: 3 }, 10)).toEqual({
      tipo: 'PRIMERA_COMPRA',
      porcentaje: 5,
    });
  });
  it('RN-09: el mayor nunca pasa el máximo (primera compra configurada en 12 %, máximo 10 %)', () => {
    expect(resolverDescuento({ primeraCompra: 12, negociado: null }, 10).porcentaje).toBe(10);
  });
  it('02 §6: prima final con 5 % sobre 1450 → 1377.50; con 8 % sobre 1957.50 → 1800.90', () => {
    expect(calcularPrimaFinal(1450, 5)).toBe(1377.5);
    expect(calcularPrimaFinal(1957.5, 8)).toBe(1800.9);
    expect(calcularPrimaFinal(1087.5, 0)).toBe(1087.5);
  });
});

describe('descuentoRegistrado (RF-20)', () => {
  it('RF-20: una compra ya hecha conserva el descuento registrado del plan (8 % negociado sobre 5 % primera compra)', () => {
    const { descuentoRegistrado } = jest.requireActual('./descuentos');
    const filas = [
      { tipo: 'PRIMERA_COMPRA', aceptado: true, planId: 'p1', porcentaje: 5 },
      { tipo: 'NEGOCIADO', aceptado: true, planId: 'p1', porcentaje: 8 },
      { tipo: 'NEGOCIADO', aceptado: true, planId: 'p2', porcentaje: 9 },
    ];
    expect(descuentoRegistrado(filas, 'p1')).toEqual({ tipo: 'NEGOCIADO', porcentaje: 8 });
    expect(descuentoRegistrado([], 'p1')).toEqual({ tipo: null, porcentaje: 0 });
  });
});
