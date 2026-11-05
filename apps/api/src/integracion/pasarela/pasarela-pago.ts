import { ModoPago } from '@prisma/client';

// Puerto de la pasarela de pago (RF-23, RNF-15). Nunca recibe datos de tarjeta (D-08).
export const PASARELA_PAGO = Symbol('PASARELA_PAGO');

export interface ResultadoCobro {
  aprobado: boolean;
  referencia: string;
  motivo?: string;
}

export interface PasarelaPago {
  // En CUOTAS cobra la primera cuota (D-13); en UNICO, el total.
  cobrar(p: { monto: number; modo: ModoPago; ordenId: string }): Promise<ResultadoCobro>;
  // Anula un cobro aprobado (se usa si la emisión falla: RNF-05).
  anular(referencia: string): Promise<void>;
}
