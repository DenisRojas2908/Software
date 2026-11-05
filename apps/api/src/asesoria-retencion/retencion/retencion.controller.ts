import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { z } from 'zod';
import { validar } from '../../comun/validacion';
import { Publico, Roles, UsuarioActual, UsuarioSesion } from '../../seguridad/decoradores';
import { RetencionService } from './retencion.service';

const esquemaIntento = z.object({
  canal: z.enum(['LLAMADA', 'WHATSAPP'], 'Elige el canal'),
  resultado: z.enum(['CONTACTADO', 'NO_RESPONDE', 'RECHAZA', 'ACEPTA'], 'Elige el resultado'),
});
const esquemaCierre = z.object({
  motivo: z
    .enum(
      ['PRECIO', 'YA_CONTRATO', 'NO_RESPONDE', 'SIN_INTERES', 'OTRO'],
      'El motivo de cierre es obligatorio',
    )
    .optional(),
});

// CU-04 (asesor): cola de seguimiento, intentos, aceptación, cierre con motivo y reenvío del mensaje final.
@Roles('ASESOR')
@Controller('asesor/seguimientos')
export class SeguimientoController {
  constructor(private readonly retencion: RetencionService) {}

  @Get()
  cola() {
    return this.retencion.cola();
  }

  @Get(':id')
  detalle(@Param('id', ParseUUIDPipe) id: string) {
    return this.retencion.detalle(id);
  }

  @Post(':id/intentos')
  intento(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @UsuarioActual() u: UsuarioSesion) {
    const d = validar(esquemaIntento, body);
    return this.retencion.registrarIntento(id, u, d.canal, d.resultado);
  }

  // CU-04 paso 5: atajo para registrar que el cliente ACEPTA (por su canal preferido)
  @Post(':id/aceptar')
  async aceptar(@Param('id', ParseUUIDPipe) id: string, @UsuarioActual() u: UsuarioSesion) {
    const s = await this.retencion.detalle(id);
    return this.retencion.registrarIntento(id, u, s.canalPreferido, 'ACEPTA');
  }

  @Post(':id/cerrar')
  cerrar(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @UsuarioActual() u: UsuarioSesion) {
    return this.retencion.cerrar(id, u, validar(esquemaCierre, body).motivo);
  }

  @Post(':id/reenviar-mensaje')
  reenviar(@Param('id', ParseUUIDPipe) id: string, @UsuarioActual() u: UsuarioSesion) {
    return this.retencion.reenviarMensaje(id, u);
  }
}

// RN-12: el enlace de retoma es público (el token aleatorio es la credencial).
@Controller('retoma')
export class RetomaController {
  constructor(private readonly retencion: RetencionService) {}

  @Publico()
  @Get(':token')
  retoma(@Param('token') token: string) {
    return this.retencion.retoma(token);
  }
}
