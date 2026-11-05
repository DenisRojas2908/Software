import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configurarApp } from '../../src/app';
import { AppModule } from '../../src/app.module';
import { USUARIOS_DEMO } from '../../prisma/seed';

// Levanta la API completa (igual que producción) para pruebas HTTP con Supertest.
export async function crearAppPrueba(ajustar?: (m: ReturnType<typeof Test.createTestingModule>) => void) {
  const builder = Test.createTestingModule({ imports: [AppModule] });
  ajustar?.(builder);
  const modulo = await builder.compile();
  const app = configurarApp(modulo.createNestApplication());
  await app.init();
  return app;
}

export async function tokenDe(app: INestApplication, email: string, contrasena: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, contrasena })
    .expect(200);
  return res.body.token;
}

export async function tokensDemo(app: INestApplication) {
  return {
    ADMINISTRADOR: await tokenDe(app, USUARIOS_DEMO.admin.email, USUARIOS_DEMO.admin.clave),
    ASESOR: await tokenDe(app, USUARIOS_DEMO.asesor1.email, USUARIOS_DEMO.asesor1.clave),
    CLIENTE: await tokenDe(app, USUARIOS_DEMO.cliente.email, USUARIOS_DEMO.cliente.clave),
  };
}
