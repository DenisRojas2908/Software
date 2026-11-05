// D-30 / CU-03 paso 6: la compra la habilitó la asesoría si hay una solicitud CERRADA con resultado ACEPTA
// o un descuento NEGOCIADO aceptado para ESE plan. Única fuente de la regla (la usan la orden y el canal).
export const RESULTADO_ACEPTA = 'ACEPTA'; // D-31

export function habilitadaPorAsesoria(
  solicitudes: { estado: string; resultado: string | null }[],
  descuentos: { tipo: string; aceptado: boolean; planId: string }[],
  planId: string,
): boolean {
  return (
    solicitudes.some((s) => s.estado === 'CERRADA' && s.resultado === RESULTADO_ACEPTA) ||
    descuentos.some((d) => d.tipo === 'NEGOCIADO' && d.aceptado && d.planId === planId)
  );
}
