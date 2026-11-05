import { Controller, Get } from '@nestjs/common';
import { Publico } from '../seguridad/decoradores';

// GET /api/salud: comprueba que la API está viva. La web lo usa para saber si el modo demo está activo.
@Controller('salud')
export class SaludController {
  @Publico()
  @Get()
  salud() {
    return { estado: 'ok', simulacion: true, demoHabilitado: process.env.DEMO_MODE === 'true' };
  }
}
