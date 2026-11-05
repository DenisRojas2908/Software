// CU-02 paso 1 / alt. 1a: ¿se puede comprar este plan?
// - Debe tener prima (RN-04: si no cotiza, solo el asesor puede fijar una prima, D-32).
// - Si la Opción 1 está bloqueada por inspección (RN-03, RF-10), solo se compra cuando la asesoría lo habilitó (CU-03 paso 6).
export class CompraNoHabilitadaError extends Error {}

export function verificarCompraHabilitada(p: {
  prima: number | null;
  motivoBloqueo: 'NO_COTIZA' | 'INSPECCION' | null;
  habilitadaPorAsesoria: boolean;
}): void {
  if (p.prima === null)
    throw new CompraNoHabilitadaError('Este plan no tiene prima en línea: solicita asesoría.');
  if (p.motivoBloqueo === 'INSPECCION' && !p.habilitadaPorAsesoria) {
    throw new CompraNoHabilitadaError(
      'Este plan requiere inspección: solo puede comprarse con asesoría (Opción 2).',
    );
  }
}
