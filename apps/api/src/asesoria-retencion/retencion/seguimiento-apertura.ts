import { Prisma } from '@prisma/client';

// CU-03 6a/6b y RF-16: una cotización no concretada entra a la cola de seguimiento (EN_SEGUIMIENTO).
// Si ya tenía un seguimiento, no se duplica (cotizacion_id es UNIQUE en seguimiento).
export async function abrirSeguimiento(tx: Prisma.TransactionClient, cotizacionId: string, ahora: Date) {
  await tx.cotizacion.update({ where: { id: cotizacionId }, data: { estado: 'NO_CONCRETADA' } });
  const existente = await tx.seguimiento.findUnique({ where: { cotizacionId } });
  if (existente?.estado === 'EN_SEGUIMIENTO') return existente;
  if (existente) {
    // vuelve a la cola con una nueva ventana de intentos y días (RF-16)
    return tx.seguimiento.update({
      where: { id: existente.id },
      data: {
        estado: 'EN_SEGUIMIENTO',
        intentos: 0,
        fechaApertura: ahora,
        fechaCierre: null,
        motivoCierre: null,
      },
    });
  }
  return tx.seguimiento.create({ data: { cotizacionId, fechaApertura: ahora } });
}
