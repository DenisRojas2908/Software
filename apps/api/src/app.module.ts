import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ComunModule } from './comun/comun.module';

// D-01: en producción Nest sirve también el build de la SPA → un proceso, una URL.
const rutaWeb = join(__dirname, '..', '..', 'web', 'dist');
const servirWeb = existsSync(rutaWeb)
  ? [ServeStaticModule.forRoot({ rootPath: rutaWeb, exclude: ['/api/{*ruta}'] })]
  : [];

@Module({
  imports: [...servirWeb, ComunModule],
})
export class AppModule {}
