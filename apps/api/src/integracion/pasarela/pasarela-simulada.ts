import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ModoPago } from '@prisma/client';
import { SimuladorFallos } from '../simulacion/simulador-fallos';
import { PasarelaPago, ResultadoCobro } from './pasarela-pago';

// Implementación simulada (RN-26): aprueba siempre, salvo que la demo fuerce el rechazo.
@Injectable()
export class PasarelaSimulada implements PasarelaPago {
  readonly anulados: string[] = [];

  constructor(private readonly fallos: SimuladorFallos) {}

  async cobrar(_p: { monto: number; modo: ModoPago; ordenId: string }): Promise<ResultadoCobro> {
    const referencia = `SIM-${randomUUID().slice(0, 8).toUpperCase()}`;
    if (this.fallos.pagoRechazado)
      return { aprobado: false, referencia, motivo: 'Pago rechazado por la entidad (simulado)' };
    return { aprobado: true, referencia };
  }

  async anular(referencia: string): Promise<void> {
    this.anulados.push(referencia);
  }
}
