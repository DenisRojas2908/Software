import { Controller, Get } from '@nestjs/common';

// GET /api/salud: comprueba que la API está viva. La web lo usa para saber si el modo demo está activo.
@Controller('salud')
export class SaludController {
  @Get()
  salud() {
    return { estado: 'ok', simulacion: true, demoHabilitado: process.env.DEMO_MODE === 'true' };
  }
}
