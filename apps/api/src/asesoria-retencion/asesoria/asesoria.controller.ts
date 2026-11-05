import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { z } from 'zod';
import { validar } from '../../comun/validacion';
import { Roles, UsuarioActual, UsuarioSesion } from '../../seguridad/decoradores';
import { AsesoriaService } from './asesoria.service';
import { RESULTADOS_ASESORIA } from './dominio/cola';

const esquemaSolicitud = z.object({
  cotizacionId: z.uuid('Cotización inválida'),
  motivo: z.enum(['DUDA', 'NEGOCIACION', 'DESCUENTO'], 'Elige el motivo'),
  canal: z.enum(['LLAMADA', 'WHATSAPP'], 'Elige el canal de contacto'),
});
const esquemaDescuento = z.object({
  planId: z.uuid('Elige el plan'),
  porcentaje: z.coerce.number('Ingresa un porcentaje'),
});
const esquemaPrima = z.object({
  primaCotizadaId: z.uuid('Elige el plan'),
  prima: z.coerce.number().positive('La prima debe ser mayor que 0'),
});
const esquemaResultado = z.object({
  resultado: z.enum(RESULTADOS_ASESORIA, 'Resultado ACEPTA, NO_ACEPTA o NO_RESPONDE'),
});

// CU-03 (lado cliente): pedir asesoría con motivo y canal (RF-11, RF-12).
@Roles('CLIENTE')
@Controller('asesoria')
export class SolicitudAsesoriaController {
  constructor(private readonly asesoria: AsesoriaService) {}

  @Post('solicitudes')
  solicitar(@Body() body: unknown, @UsuarioActual() u: UsuarioSesion) {
    return this.asesoria.solicitar(u, validar(esquemaSolicitud, body));
  }
}

// CU-03 (lado asesor): cola, tomar, prima manual, descuento y resultado (RF-13, RF-14, RF-15).
@Roles('ASESOR')
@Controller('asesor')
export class ColaAsesoriaController {
  constructor(private readonly asesoria: AsesoriaService) {}

  @Get('cola')
  cola() {
    return this.asesoria.cola();
  }

  @Get('solicitudes/:id')
  detalle(@Param('id', ParseUUIDPipe) id: string, @UsuarioActual() u: UsuarioSesion) {
    return this.asesoria.detalle(id, u);
  }

  @Post('solicitudes/:id/tomar')
  tomar(@Param('id', ParseUUIDPipe) id: string, @UsuarioActual() u: UsuarioSesion) {
    return this.asesoria.tomar(id, u);
  }

  @Post('solicitudes/:id/prima')
  prima(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @UsuarioActual() u: UsuarioSesion) {
    return this.asesoria.registrarPrima(id, u, validar(esquemaPrima, body));
  }

  @Post('solicitudes/:id/descuento')
  descuento(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.asesoria.registrarDescuento(id, u, validar(esquemaDescuento, body));
  }

  @Post('solicitudes/:id/resultado')
  resultado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.asesoria.registrarResultado(id, u, validar(esquemaResultado, body).resultado);
  }
}
