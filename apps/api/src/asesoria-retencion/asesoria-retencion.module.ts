import { Global, Module } from '@nestjs/common';
import { CompraModule } from '../compra/compra.module';
import { CotizacionModule } from '../cotizacion/cotizacion.module';
import { DERIVADOR_CASOS } from '../cotizacion/derivador-casos';
import { ColaAsesoriaController, SolicitudAsesoriaController } from './asesoria/asesoria.controller';
import { AsesoriaService } from './asesoria/asesoria.service';
import { DerivadorCasosAsesoria } from './asesoria/derivador-asesoria';

// Asesoría y retención. Implementa el puerto DerivadorCasos que define cotización (inversión de dependencias):
// @Global + export del token → CotizacionService lo recibe sin importar este módulo.
@Global()
@Module({
  imports: [CotizacionModule, CompraModule],
  controllers: [SolicitudAsesoriaController, ColaAsesoriaController],
  providers: [AsesoriaService, { provide: DERIVADOR_CASOS, useClass: DerivadorCasosAsesoria }],
  exports: [DERIVADOR_CASOS],
})
export class AsesoriaRetencionModule {}
