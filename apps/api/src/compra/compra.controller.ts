import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { z } from 'zod';
import { validar } from '../comun/validacion';
import { Roles, UsuarioActual, UsuarioSesion } from '../seguridad/decoradores';
import { CompraService } from './compra.service';

const esquemaOrden = z.object({
  cotizacionId: z.uuid('Cotización inválida'),
  primaCotizadaId: z.uuid('Plan inválido'),
  tokenRetoma: z.string().optional(),
});
const esquemaDatos = z.object({
  numeroDocumento: z.string().regex(/^\d{8}$/, 'DNI de 8 dígitos'),
  apellidos: z.string().trim().min(2, 'Ingresa tus apellidos'),
});
const esquemaModo = {
  modo: z.enum(['UNICO', 'CUOTAS'], 'Elige pago único o en cuotas'),
  numeroCuotas: z.coerce.number().int().optional(),
};
const esquemaConfirmar = z.object({ aceptaCondiciones: z.boolean(), firma: z.boolean(), ...esquemaModo });
const esquemaPagar = z.object(esquemaModo);

// CU-02: solo un CLIENTE autenticado compra (registro mínimo en el paso 2). Propiedad verificada en el servicio.
@Roles('CLIENTE')
@Controller('compras')
export class CompraController {
  constructor(private readonly compras: CompraService) {}

  @Post()
  crear(@Body() body: unknown, @UsuarioActual() u: UsuarioSesion) {
    const d = validar(esquemaOrden, body);
    return this.compras.crearOrden(u, d.cotizacionId, d.primaCotizadaId, d.tokenRetoma);
  }

  @Get(':id')
  resumen(@Param('id', ParseUUIDPipe) id: string, @UsuarioActual() u: UsuarioSesion) {
    return this.compras.resumen(id, u);
  }

  @Patch(':id/datos')
  datos(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @UsuarioActual() u: UsuarioSesion) {
    return this.compras.completarDatos(id, u, validar(esquemaDatos, body));
  }

  @Post(':id/confirmar')
  confirmar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.compras.confirmar(id, u, validar(esquemaConfirmar, body));
  }

  @Post(':id/pagar')
  pagar(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @UsuarioActual() u: UsuarioSesion) {
    return this.compras.pagar(id, u, validar(esquemaPagar, body));
  }
}
