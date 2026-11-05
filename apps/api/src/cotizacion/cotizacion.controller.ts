import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { z } from 'zod';
import { validar } from '../comun/validacion';
import { Publico, UsuarioActual, UsuarioSesion } from '../seguridad/decoradores';
import { CotizacionService } from './cotizacion.service';

// RF-01: contacto + canal preferido. D-15: correo opcional al cotizar (RN-04).
const esquemaContacto = z.object({
  nombres: z.string().trim().min(2, 'Ingresa tus nombres'),
  telefono: z.string().regex(/^9\d{8}$/, 'Celular de 9 dígitos que empieza en 9'),
  email: z.union([z.literal(''), z.email('Correo inválido')]).optional(),
  canalPreferido: z.enum(['LLAMADA', 'WHATSAPP'], 'Elige LLAMADA o WHATSAPP'),
});
const esquemaCotizacion = z.object({
  contacto: esquemaContacto,
  datos: z.record(z.string(), z.union([z.string(), z.number()])),
});

@Controller('cotizaciones')
export class CotizacionController {
  constructor(private readonly servicio: CotizacionService) {}

  // CU-01: se cotiza sin cuenta. Si hay sesión de cliente, la cotización queda a su nombre.
  @Publico()
  @Post()
  async crear(@Body() body: unknown, @UsuarioActual() usuario?: UsuarioSesion) {
    const entrada = validar(esquemaCotizacion, body);
    const r = await this.servicio.cotizar(entrada.contacto, entrada.datos, usuario);
    if (r.fueraDeNicho) return r;
    return { fueraDeNicho: false, cotizacion: await this.servicio.detalle(r.id, usuario) };
  }

  @Publico()
  @Get(':id')
  detalle(@Param('id', ParseUUIDPipe) id: string, @UsuarioActual() usuario?: UsuarioSesion) {
    return this.servicio.detalle(id, usuario);
  }
}
