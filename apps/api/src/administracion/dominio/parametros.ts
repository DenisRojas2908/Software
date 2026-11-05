// RF-29: validación de los parámetros comerciales que edita el administrador (además de los CHECK de la BD).
export interface ParametrosEditables {
  descuentoPrimeraCompra: number;
  descuentoMaximo: number;
  maxIntentos: number;
  diasSeguimiento: number;
  maxCuotas: number;
  vigenciaEnlaceDias: number;
}

export function validarParametros(p: ParametrosEditables): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const k of ['descuentoPrimeraCompra', 'descuentoMaximo'] as const) {
    if (!(p[k] >= 0 && p[k] <= 100)) errores[k] = 'Debe estar entre 0 y 100 %';
  }
  for (const k of ['maxIntentos', 'diasSeguimiento', 'maxCuotas', 'vigenciaEnlaceDias'] as const) {
    if (!Number.isInteger(p[k]) || p[k] < 1) errores[k] = 'Debe ser un entero mayor que 0';
  }
  if (p.maxCuotas < 2 && !errores.maxCuotas)
    errores.maxCuotas = 'Para pagar en cuotas se necesitan al menos 2';
  return errores;
}
