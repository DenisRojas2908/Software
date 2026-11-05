import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { z } from 'zod';
import { validar } from '../comun/validacion';
import { Roles } from '../seguridad/decoradores';
import { DemoService } from './demo.service';

const esquemaReloj = z.object({ dias: z.coerce.number().int().min(1, 'Al menos 1 día').max(60, 'Máximo 60 días') });
const esquemaFallos = z.object({
  pagoRechazado: z.boolean().optional(),
  emisionFallida: z.boolean().optional(),
  envioMensajeFallido: z.boolean().optional(),
  aseguradoraCaida: z.string().nullable().optional(),
});

// F8 · Herramientas de simulación. Este módulo SOLO se registra con DEMO_MODE=true (si no, las rutas no existen → 404)
// y además exige rol ADMINISTRADOR (RNF-10).
@Roles('ADMINISTRADOR')
@Controller('demo')
export class DemoController {
  constructor(private readonly demo: DemoService) {}

  @Get('estado')
  estado() {
    return this.demo.estado();
  }

  @Post('reloj')
  @HttpCode(200)
  reloj(@Body() body: unknown) {
    return this.demo.adelantar(validar(esquemaReloj, body).dias);
  }

  @Post('reloj/reiniciar')
  @HttpCode(200)
  reiniciarReloj() {
    return this.demo.reiniciarReloj();
  }

  @Post('fallos')
  @HttpCode(200)
  fallos(@Body() body: unknown) {
    return this.demo.fijarFallos(validar(esquemaFallos, body));
  }

  @Get('buzon')
  buzon() {
    return this.demo.buzon();
  }

  @Post('procesar-abandonos')
  @HttpCode(200)
  procesar() {
    return this.demo.procesarAbandonos();
  }

  @Post('reset')
  @HttpCode(200)
  reset() {
    return this.demo.reiniciarBd();
  }
}
