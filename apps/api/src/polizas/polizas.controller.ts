import { createReadStream } from 'node:fs';
import { Controller, Get, Param, ParseUUIDPipe, StreamableFile } from '@nestjs/common';
import { Roles, UsuarioActual, UsuarioSesion } from '../seguridad/decoradores';
import { PolizaService } from './poliza.service';

@Roles('CLIENTE')
@Controller('polizas')
export class PolizasController {
  constructor(private readonly polizas: PolizaService) {}

  // RF-26: estado de solicitudes, pagos y pólizas del cliente
  @Get('mias')
  mias(@UsuarioActual() u: UsuarioSesion) {
    return this.polizas.misTramites(u);
  }

  // RF-25: descarga del PDF (solo el dueño)
  @Get(':id/pdf')
  async pdf(@Param('id', ParseUUIDPipe) id: string, @UsuarioActual() u: UsuarioSesion) {
    const { ruta, nombre } = await this.polizas.rutaPdf(id, u);
    return new StreamableFile(createReadStream(ruta), {
      type: 'application/pdf',
      disposition: `attachment; filename="${nombre}"`,
    });
  }
}
