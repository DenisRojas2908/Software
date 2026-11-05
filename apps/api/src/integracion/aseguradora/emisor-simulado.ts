import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { SimuladorFallos } from '../simulacion/simulador-fallos';
import { EmisionFallidaError, EmisorAseguradora } from './emisor-aseguradora';

// RN-26: devuelve un número de póliza de PRUEBA. La demo puede forzar una falla para mostrar el rollback.
@Injectable()
export class EmisorSimulado implements EmisorAseguradora {
  constructor(private readonly fallos: SimuladorFallos) {}

  async emitir(p: { codigoAseguradora: string; ordenId: string; fecha: Date }) {
    if (this.fallos.emisionFallida)
      throw new EmisionFallidaError('La aseguradora no respondió a la emisión (simulado)');
    const dia = p.fecha.toISOString().slice(0, 10).replace(/-/g, '');
    return { numeroPoliza: `SVAS-${p.codigoAseguradora}-${dia}-${randomUUID().slice(0, 6).toUpperCase()}` };
  }
}
