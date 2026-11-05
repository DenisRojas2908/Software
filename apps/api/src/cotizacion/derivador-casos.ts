import { CanalContacto, Prisma } from '@prisma/client';

// Puerto DerivadorCasos (inversión de dependencias): `cotizacion` NO importa `asesoria-retencion`.
// Cotización solo conoce esta interfaz; el módulo de asesoría la implementa y la registra con el token.
export const DERIVADOR_CASOS = Symbol('DERIVADOR_CASOS');

export type MotivoDerivacion = 'INSPECCION' | 'NO_ASEGURABLE';

export interface DerivadorCasos {
  // RF-06 / RN-03 / RN-04: crea el caso en la cola de asesoría con los datos ya capturados (sin pedir correo).
  derivar(
    cotizacionId: string,
    motivo: MotivoDerivacion,
    canal: CanalContacto,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
}
