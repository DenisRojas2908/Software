// Dinero en soles con 2 decimales. `toPrecision(12)` corrige errores de coma flotante
// (p. ej. 1112.625 que en binario es 1112.62499999…) antes de redondear.
export function redondear2(x: number): number {
  return Math.round(Number((x * 100).toPrecision(12))) / 100;
}
