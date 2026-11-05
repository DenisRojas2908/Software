import { validarParametros } from './parametros';

const OK = {
  descuentoPrimeraCompra: 5,
  descuentoMaximo: 10,
  maxIntentos: 4,
  diasSeguimiento: 7,
  maxCuotas: 12,
  vigenciaEnlaceDias: 7,
};

describe('validarParametros (RF-29)', () => {
  it('RF-29: los valores iniciales de 02 §10 son válidos', () => {
    expect(validarParametros(OK)).toEqual({});
  });
  it('RF-29: porcentajes fuera de 0–100 y enteros no positivos se rechazan por campo', () => {
    expect(validarParametros({ ...OK, descuentoMaximo: 120, maxIntentos: 0, diasSeguimiento: 2.5 })).toEqual({
      descuentoMaximo: 'Debe estar entre 0 y 100 %',
      maxIntentos: 'Debe ser un entero mayor que 0',
      diasSeguimiento: 'Debe ser un entero mayor que 0',
    });
  });
  it('RN-14: el máximo de cuotas debe permitir al menos 2', () => {
    expect(validarParametros({ ...OK, maxCuotas: 1 })).toEqual({
      maxCuotas: 'Para pagar en cuotas se necesitan al menos 2',
    });
  });
});
