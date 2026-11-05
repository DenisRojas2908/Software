import { CanalVenta } from '@prisma/client';

// RN-27 (+ D-29, D-30): canal de la venta. Prioridad TELEMARKETING > ASESORIA > AUTONOMO.
// El servicio calcula las banderas leyendo la BD; esta función solo decide (pura, sin BD).
export interface OrigenCompra {
  desdeEnlaceRetoma: boolean; // la compra empezó desde el enlace de retoma (RN-12)
  aceptoEnSeguimiento: boolean; // hay un IntentoContacto ACEPTA en su seguimiento (D-29)
  habilitadaPorAsesoria: boolean; // SolicitudAsesoria cerrada con ACEPTA o descuento NEGOCIADO aceptado (D-30)
}

export function atribuirCanal(origen: OrigenCompra): CanalVenta {
  // La asesoría no cerró la venta si después se recuperó por seguimiento (caso mixto → TELEMARKETING)
  if (origen.desdeEnlaceRetoma || origen.aceptoEnSeguimiento) return 'TELEMARKETING';
  if (origen.habilitadaPorAsesoria) return 'ASESORIA';
  return 'AUTONOMO';
}
