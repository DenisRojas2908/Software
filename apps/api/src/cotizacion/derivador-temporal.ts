import { Injectable } from '@nestjs/common';
import { CanalContacto, Prisma } from '@prisma/client';
import { RegistroActividadService } from '../comun/registro-actividad.service';
import { DerivadorCasos, MotivoDerivacion } from './derivador-casos';

// F3: implementación temporal del puerto (solo deja registro). En F5 la reemplaza la de asesoría.
@Injectable()
export class DerivadorCasosTemporal implements DerivadorCasos {
  constructor(private readonly actividad: RegistroActividadService) {}

  async derivar(
    cotizacionId: string,
    motivo: MotivoDerivacion,
    _canal: CanalContacto,
    tx: Prisma.TransactionClient,
  ) {
    await this.actividad.registrar(`DERIVAR_${motivo}`, `Cotizacion#${cotizacionId}`, null, tx);
  }
}
