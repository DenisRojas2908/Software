import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DynamicModule, Module } from '@nestjs/common';
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
import { AsesoriaRetencionModule } from './asesoria-retencion/asesoria-retencion.module';
import { DemoModule } from './demo/demo.module';

// D-01: en producción Nest sirve también el build de la SPA → un proceso, una URL.
function servirWeb() {
  const rutaWeb = join(__dirname, '..', '..', 'web', 'dist');
  return existsSync(rutaWeb) ? [ServeStaticModule.forRoot({ rootPath: rutaWeb, exclude: ['/api/{*ruta}'] })] : [];
}

// AppModule.forRoot() arma la app leyendo el entorno EN ESE MOMENTO:
// el módulo de demo (F8) solo se registra con DEMO_MODE=true; si no, sus rutas no existen (404).
@Module({})
export class AppModule {
  static forRoot(): DynamicModule {
    const demo = process.env.DEMO_MODE === 'true';
    return {
      module: AppModule,
      imports: [
        ...servirWeb(),
        PersistenciaModule,
        ComunModule,
        SeguridadModule,
        DominioCompartidoModule,
        IntegracionModule,
        CotizacionModule,
        CompraModule,
        PolizasModule,
        AsesoriaRetencionModule,
        AdministracionModule,
        ...(demo ? [DemoModule] : []),
      ],
    };
  }
}
