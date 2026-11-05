import { CanalContacto } from '@prisma/client';

// Puerto del notificador (D-06, RNF-15): llamada / WhatsApp / mensaje final con enlace de retoma.
export const NOTIFICADOR = Symbol('NOTIFICADOR');

export class EnvioFallidoError extends Error {}

export interface MensajeCliente {
  canal: CanalContacto;
  telefono: string;
  tipo: 'ENLACE_RETOMA' | 'MENSAJE_FINAL';
  texto: string;
}

export interface Notificador {
  enviar(m: MensajeCliente): Promise<void>;
}
