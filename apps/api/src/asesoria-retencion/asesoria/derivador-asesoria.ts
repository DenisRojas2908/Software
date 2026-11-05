import { Inject, Injectable } from '@nestjs/common';
import { CanalContacto, Prisma } from '@prisma/client';
import { RegistroActividadService } from '../../comun/registro-actividad.service';
import { RELOJ, Reloj } from '../../comun/reloj';
import { DerivadorCasos, MotivoDerivacion } from '../../cotizacion/derivador-casos';

// Implementación REAL del puerto DerivadorCasos (definido en cotizacion): crea la SolicitudAsesoria
// con origen SISTEMA y estado PENDIENTE (RF-06, RN-03, RN-04). La dependencia va asesoría → cotización.
@Injectable()
export class DerivadorCasosAsesoria implements DerivadorCasos {
  constructor(
    private readonly actividad: RegistroActividadService,
    @Inject(RELOJ) private readonly reloj: Reloj,
  ) {}

  async derivar(
    cotizacionId: string,
    motivo: MotivoDerivacion,
    canal: CanalContacto,
    tx: Prisma.TransactionClient,
  ) {
    const s = await tx.solicitudAsesoria.create({
      data: {
        cotizacionId,
        motivo,
        canal,
        origen: 'SISTEMA',
        estado: 'PENDIENTE',
        fechaCreacion: this.reloj.ahora(),
      },
    });
    await this.actividad.registrar(`DERIVAR_${motivo}`, `SolicitudAsesoria#${s.id}`, null, tx);
  }
}
