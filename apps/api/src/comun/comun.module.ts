import { Global, Module } from '@nestjs/common';
import { RegistroActividadService } from './registro-actividad.service';
import { RELOJ, RelojSistema } from './reloj';
import { SaludController } from './salud.controller';

// Servicios transversales disponibles en toda la app (@Global): Reloj y RegistroActividad.
@Global()
@Module({
  controllers: [SaludController],
  providers: [{ provide: RELOJ, useValue: new RelojSistema() }, RegistroActividadService],
  exports: [RELOJ, RegistroActividadService],
})
export class ComunModule {}
