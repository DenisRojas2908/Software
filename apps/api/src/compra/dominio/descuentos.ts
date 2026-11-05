import { TipoDescuento } from '@prisma/client';
import { redondear2 } from '../../comun/dinero';

export class DescuentoExcedeMaximoError extends Error {
  constructor(porcentaje: number, maximo: number) {
    super(`El descuento de ${porcentaje} % supera el máximo permitido de ${maximo} %`);
  }
}

// RN-07: al REGISTRAR un descuento negociado se rechaza si supera el máximo (no se topa en silencio).
export function validarDescuentoNegociado(porcentaje: number, maximo: number): void {
  if (!(porcentaje > 0)) throw new RangeError('El descuento debe ser mayor que 0 %');
  if (porcentaje > maximo) throw new DescuentoExcedeMaximoError(porcentaje, maximo);
}

export interface DescuentoResuelto {
  tipo: TipoDescuento | null;
  porcentaje: number;
}

// RN-08 + RN-09 (+ tope de RN-07): primera compra y negociado NO se acumulan; se aplica el mayor, sin pasar el máximo.
// `null` = no aplica (no es primera compra / no hay negociado aceptado).
export function resolverDescuento(
  candidatos: { primeraCompra: number | null; negociado: number | null },
  maximo: number,
): DescuentoResuelto {
  const { primeraCompra, negociado } = candidatos;
  if (primeraCompra === null && negociado === null) return { tipo: null, porcentaje: 0 };
  const tipo: TipoDescuento = (negociado ?? -1) >= (primeraCompra ?? -1) ? 'NEGOCIADO' : 'PRIMERA_COMPRA';
  const mayor = Math.max(primeraCompra ?? 0, negociado ?? 0);
  return { tipo, porcentaje: Math.min(mayor, maximo) };
}

// 02 §6: primaFinal = round(prima × (1 − porcentaje/100), 2)
export function calcularPrimaFinal(prima: number, porcentaje: number): number {
  return redondear2(prima * (1 - porcentaje / 100));
}
