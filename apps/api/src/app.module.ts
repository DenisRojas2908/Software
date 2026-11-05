import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ComunModule } from './comun/comun.module';
import { PersistenciaModule } from './persistencia/persistencia.module';
import { SeguridadModule } from './seguridad/seguridad.module';
import { AdministracionModule } from './administracion/administracion.module';
import { DominioCompartidoModule } from './dominio-compartido/dominio-compartido.module';
import { CotizacionModule } from './cotizacion/cotizacion.module';
import { IntegracionModule } from './integracion/integracion.module';
import { CompraModule } from './compra/compra.module';
import { PolizasModule } from './polizas/polizas.module';

// D-01: en producción Nest sirve también el build de la SPA → un proceso, una URL.
const rutaWeb = join(__dirname, '..', '..', 'web', 'dist');
const servirWeb = existsSync(rutaWeb)
  ? [ServeStaticModule.forRoot({ rootPath: rutaWeb, exclude: ['/api/{*ruta}'] })]
  : [];

@Module({
  imports: [
    ...servirWeb,
    PersistenciaModule,
    ComunModule,
    SeguridadModule,
    DominioCompartidoModule,
    IntegracionModule,
    CotizacionModule,
    CompraModule,
    PolizasModule,
    AdministracionModule,
  ],
})
export class AppModule {}
