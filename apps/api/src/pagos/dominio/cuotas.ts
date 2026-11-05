import { redondear2 } from '../../comun/dinero';

export class CuotasInvalidasError extends Error {}

// RN-14 + D-13 + D-40: cuotas iguales sin recargo; el residuo del redondeo va en la última.
export function calcularCronograma(total: number, numeroCuotas: number, maxCuotas: number): number[] {
  if (!Number.isInteger(numeroCuotas) || numeroCuotas < 2)
    throw new CuotasInvalidasError('Elige al menos 2 cuotas');
  if (numeroCuotas > maxCuotas) throw new CuotasInvalidasError(`El máximo es ${maxCuotas} cuotas`);
  const centimos = Math.round(total * 100);
  const base = Math.floor(centimos / numeroCuotas);
  const montos = Array.from({ length: numeroCuotas }, () => base / 100);
  montos[numeroCuotas - 1] = redondear2((centimos - base * (numeroCuotas - 1)) / 100);
  return montos;
}
