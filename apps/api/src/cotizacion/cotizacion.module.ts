import { Module } from '@nestjs/common';
import { CotizacionController } from './cotizacion.controller';
import { CotizacionService } from './cotizacion.service';
import { ESTRATEGIAS, EstrategiaCotizacion } from './estrategia/estrategia-cotizacion';
import { CLASES_ESTRATEGIA } from './estrategia/estrategias';

@Module({
  controllers: [CotizacionController],
  providers: [
    ...CLASES_ESTRATEGIA,
    // Todas las estrategias se inyectan juntas como arreglo (patrón Strategy + registro)
    {
      provide: ESTRATEGIAS,
      useFactory: (...estrategias: EstrategiaCotizacion[]) => estrategias,
      inject: CLASES_ESTRATEGIA,
    },
    // DERIVADOR_CASOS lo provee el módulo asesoria-retencion (@Global): inversión de dependencias
    CotizacionService,
  ],
  exports: [CotizacionService],
})
export class CotizacionModule {}
