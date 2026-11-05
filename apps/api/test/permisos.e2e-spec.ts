// RNF-10 / RF-32: el 100 % de los endpoints protegidos rechaza a los roles que no corresponden.
// Tabla única: cada fase agrega aquí sus endpoints. Sin token → 401; rol no permitido → 403.
import { INestApplication } from '@nestjs/common';
import { Rol } from '@prisma/client';
import request from 'supertest';
import { crearAppPrueba, tokensDemo } from './soporte/app-prueba';
import { ENDPOINTS_PROTEGIDOS } from './soporte/endpoints';

const ROLES: Rol[] = ['CLIENTE', 'ASESOR', 'ADMINISTRADOR'];

describe('RNF-10: endpoints × roles', () => {
  let app: INestApplication;
  let tokens: Record<Rol, string>;

  beforeAll(async () => {
    app = await crearAppPrueba();
    tokens = await tokensDemo(app);
  });
  afterAll(() => app.close());

  const casos = ENDPOINTS_PROTEGIDOS.flatMap((e) => [
    { ...e, rol: null as Rol | null },
    ...ROLES.map((rol) => ({ ...e, rol })),
  ]);

  it.each(casos)('RNF-10: $metodo $ruta como $rol', async ({ metodo, ruta, permitidos, rol }) => {
    let req = request(app.getHttpServer())[metodo](ruta);
    if (rol) req = req.set('Authorization', `Bearer ${tokens[rol]}`);
    const res = await req.send({});
    if (!rol) expect(res.status).toBe(401);
    else if (!permitidos.includes(rol)) expect(res.status).toBe(403);
    else expect([401, 403]).not.toContain(res.status);
  });
});
