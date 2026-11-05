// Puerto de emisión de la aseguradora (RF-22, RNF-15).
export const EMISOR_ASEGURADORA = Symbol('EMISOR_ASEGURADORA');

export class EmisionFallidaError extends Error {}

export interface EmisorAseguradora {
  emitir(p: { codigoAseguradora: string; ordenId: string; fecha: Date }): Promise<{ numeroPoliza: string }>;
}
