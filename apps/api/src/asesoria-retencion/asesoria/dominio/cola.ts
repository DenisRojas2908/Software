import { OrigenCaso } from '@prisma/client';

// RN-13: primero los casos derivados por el sistema (RN-03 inspección, RN-04 no asegurable),
// luego los que pidió el cliente; dentro de cada grupo, por orden de llegada.
export interface CasoEnCola {
  origen: OrigenCaso;
  fechaCreacion: Date;
}

export function ordenarCola<T extends CasoEnCola>(casos: T[]): T[] {
  const prioridad = (o: OrigenCaso) => (o === 'SISTEMA' ? 0 : 1);
  return [...casos].sort(
    (a, b) =>
      prioridad(a.origen) - prioridad(b.origen) || a.fechaCreacion.getTime() - b.fechaCreacion.getTime(),
  );
}

// D-31: valores controlados del resultado de una asesoría (CU-03 pasos 6, 6a, 6b)
export const RESULTADOS_ASESORIA = ['ACEPTA', 'NO_ACEPTA', 'NO_RESPONDE'] as const;
export type ResultadoAsesoria = (typeof RESULTADOS_ASESORIA)[number];
