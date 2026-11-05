import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Configuración común a main.ts y a las pruebas e2e: así los tests ven la misma API que producción.
export function configurarApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('api');
  return app;
}

export async function crearApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule.forRoot());
  return configurarApp(app);
}
