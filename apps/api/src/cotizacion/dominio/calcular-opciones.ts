import { OpcionVenta } from '@prisma/client';

// Reglas de derivación (RF-08, RF-10). Función pura: no toca la BD.
// RN-01, RN-02, RN-24: Opción 1 (COMPRA_INMEDIATA) si el plan cotiza y su aseguradora no exige inspección para ese uso.
// RN-03, RN-25: inspección por (aseguradora, uso) → ese plan solo con Opción 2.
// RN-04: ninguna prima disponible → solo Opción 2, derivación NO_ASEGURABLE.
// RF-08: la Opción 2 (ASESORIA) siempre está visible. D-17: la unión se guarda en cotizacion_opcion.
export interface PrimaPlan {
  aseguradoraId: string;
  planId: string;
  prima: number | null;
}

export type MotivoBloqueo = 'NO_COTIZA' | 'INSPECCION';

export interface OpcionesPlan {
  planId: string;
  compraInmediata: boolean;
  asesoria: true;
  motivoBloqueo: MotivoBloqueo | null;
}

export interface ResultadoOpciones {
  porPlan: OpcionesPlan[];
  opciones: OpcionVenta[];
  motivoDerivacion: 'INSPECCION' | 'NO_ASEGURABLE' | null;
}

export function calcularOpciones(
  primas: PrimaPlan[],
  aseguradorasConInspeccion: ReadonlySet<string>,
): ResultadoOpciones {
  const porPlan: OpcionesPlan[] = primas.map((p) => {
    let motivoBloqueo: MotivoBloqueo | null = null;
    if (p.prima === null) motivoBloqueo = 'NO_COTIZA';
    else if (aseguradorasConInspeccion.has(p.aseguradoraId)) motivoBloqueo = 'INSPECCION';
    return { planId: p.planId, compraInmediata: motivoBloqueo === null, asesoria: true, motivoBloqueo };
  });

  const hayDisponible = primas.some((p) => p.prima !== null);
  const hayCompraInmediata = porPlan.some((p) => p.compraInmediata);

  let motivoDerivacion: ResultadoOpciones['motivoDerivacion'] = null;
  if (!hayDisponible)
    motivoDerivacion = 'NO_ASEGURABLE'; // RN-04 (02 §5 paso 5)
  else if (!hayCompraInmediata) motivoDerivacion = 'INSPECCION'; // RN-03 (02 §5 paso 7)

  const opciones: OpcionVenta[] = hayCompraInmediata ? ['COMPRA_INMEDIATA', 'ASESORIA'] : ['ASESORIA'];
  return { porPlan, opciones, motivoDerivacion };
}
