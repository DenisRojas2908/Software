import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { z } from 'zod';
import { validar } from '../comun/validacion';
import { Roles, UsuarioActual, UsuarioSesion } from '../seguridad/decoradores';
import { AdministracionService } from './administracion.service';

const esquemaActivo = z.object({ activa: z.boolean('Indica true/false') });
const esquemaPlan = z.object({
  activo: z.boolean().optional(),
  descripcion: z.string().trim().min(3).optional(),
});
const esquemaCampoNuevo = z.object({
  aseguradoraId: z.uuid('Elige la aseguradora'),
  nombre: z
    .string()
    .trim()
    .regex(/^[a-z][a-z0-9_]*$/, 'Solo minúsculas, números y _ (p. ej. color)'),
  tipo: z.enum(['TEXTO', 'NUMERO', 'LISTA'], 'Elige el tipo'),
  obligatorio: z.boolean(),
  valores: z.array(z.string().trim().min(1)).default([]),
});
const esquemaCampo = z.object({
  obligatorio: z.boolean().optional(),
  activo: z.boolean().optional(),
  valores: z.array(z.string().trim().min(1)).optional(),
});
const esquemaInspeccion = z.object({
  aseguradoraId: z.uuid(),
  uso: z.enum(['PARTICULAR', 'COMERCIAL_LIGERO', 'TRANSPORTE_PASAJEROS']),
  requiereInspeccion: z.boolean(),
});
const esquemaParametros = z.object({
  descuentoPrimeraCompra: z.coerce.number(),
  descuentoMaximo: z.coerce.number(),
  maxIntentos: z.coerce.number(),
  diasSeguimiento: z.coerce.number(),
  maxCuotas: z.coerce.number(),
  vigenciaEnlaceDias: z.coerce.number(),
});

// CU-05: todo el panel de administración es solo para ADMINISTRADOR (RF-32).
@Roles('ADMINISTRADOR')
@Controller('admin')
export class AdministracionController {
  constructor(private readonly admin: AdministracionService) {}

  @Get('aseguradoras')
  aseguradoras() {
    return this.admin.catalogo();
  }

  @Patch('aseguradoras/:id')
  aseguradora(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.admin.activarAseguradora(id, validar(esquemaActivo, body).activa, u.id);
  }

  @Patch('planes/:id')
  plan(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @UsuarioActual() u: UsuarioSesion) {
    return this.admin.actualizarPlan(id, validar(esquemaPlan, body), u.id);
  }

  @Get('campos')
  campos() {
    return this.admin.campos();
  }

  @Post('campos')
  crearCampo(@Body() body: unknown, @UsuarioActual() u: UsuarioSesion) {
    return this.admin.crearCampo(validar(esquemaCampoNuevo, body), u.id);
  }

  @Patch('campos/:id')
  campo(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @UsuarioActual() u: UsuarioSesion) {
    return this.admin.actualizarCampo(id, validar(esquemaCampo, body), u.id);
  }

  @Get('reglas-inspeccion')
  reglas() {
    return this.admin.reglasInspeccion();
  }

  @Put('reglas-inspeccion')
  regla(@Body() body: unknown, @UsuarioActual() u: UsuarioSesion) {
    return this.admin.fijarInspeccion(validar(esquemaInspeccion, body), u.id);
  }

  @Get('parametros')
  parametros() {
    return this.admin.parametros();
  }

  @Put('parametros')
  actualizarParametros(@Body() body: unknown, @UsuarioActual() u: UsuarioSesion) {
    return this.admin.actualizarParametros(validar(esquemaParametros, body), u.id);
  }

  @Get('actividad')
  actividad() {
    return this.admin.actividadReciente();
  }

  // RF-30: GET /api/admin/reportes/ventas?desde=2026-08-01&hasta=2026-11-30&agrupar=canal
  @Get('reportes/ventas')
  reporte(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('agrupar') agrupar = 'canal',
  ) {
    if (!['canal', 'aseguradora', 'plan'].includes(agrupar)) {
      throw new BadRequestException({
        mensaje: 'agrupar: canal, aseguradora o plan',
        errores: { agrupar: 'Valor inválido' },
      });
    }
    const d = desde ? new Date(`${desde}T00:00:00-05:00`) : new Date(0);
    const h = hasta ? new Date(`${hasta}T23:59:59.999-05:00`) : new Date(8.64e15);
    if (Number.isNaN(d.getTime()) || Number.isNaN(h.getTime())) {
      throw new BadRequestException({
        mensaje: 'Fechas con formato AAAA-MM-DD',
        errores: { desde: 'Fecha inválida' },
      });
    }
    return this.admin.reporteVentas(d, h, agrupar as 'canal' | 'aseguradora' | 'plan');
  }
}
