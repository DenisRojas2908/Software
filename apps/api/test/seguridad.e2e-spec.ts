import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { USUARIOS_DEMO } from '../prisma/seed';
import { crearAppPrueba, tokensDemo } from './soporte/app-prueba';

describe('Seguridad (F2)', () => {
  let app: INestApplication;
  let tokens: Awaited<ReturnType<typeof tokensDemo>>;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await crearAppPrueba();
    tokens = await tokensDemo(app);
  });
  afterAll(() => app.close());

  it('RF-31: login con credenciales válidas devuelve token y rol', async () => {
    const res = await http()
      .post('/api/auth/login')
      .send({ email: USUARIOS_DEMO.asesor1.email, contrasena: USUARIOS_DEMO.asesor1.clave })
      .expect(200);
    expect(res.body.usuario.rol).toBe('ASESOR');
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('RF-31: credenciales inválidas → 401', async () => {
    await http()
      .post('/api/auth/login')
      .send({ email: USUARIOS_DEMO.admin.email, contrasena: 'mala' })
      .expect(401);
  });

  it('RNF-09: la contraseña se guarda con bcrypt, nunca en claro', async () => {
    const email = `hash${Date.now()}@prueba.pe`;
    await http()
      .post('/api/auth/registro')
      .send({
        email,
        contrasena: 'Secreta123',
        nombres: 'Ana',
        telefono: '987654321',
        canalPreferido: 'WHATSAPP',
      })
      .expect(201);
    const admin = tokens.ADMINISTRADOR;
    const lista = await http().get('/api/admin/usuarios').set('Authorization', `Bearer ${admin}`).expect(200);
    const u = lista.body.find((x: { email: string }) => x.email === email);
    expect(u).toBeDefined();
    expect(u.hashContrasena).toBeUndefined(); // el listado no expone el hash
  });

  it('RF-11: registro mínimo crea un CLIENTE y devuelve sesión; errores por campo', async () => {
    const email = `cliente${Date.now()}@prueba.pe`;
    const ok = await http()
      .post('/api/auth/registro')
      .send({
        email,
        contrasena: 'Secreta123',
        nombres: 'Luis',
        telefono: '912345678',
        canalPreferido: 'LLAMADA',
      })
      .expect(201);
    expect(ok.body.usuario.rol).toBe('CLIENTE');
    const yo = await http().get('/api/auth/yo').set('Authorization', `Bearer ${ok.body.token}`).expect(200);
    expect(yo.body.cliente.nombres).toBe('Luis');

    const mal = await http()
      .post('/api/auth/registro')
      .send({ email: 'x', contrasena: '1', telefono: '1' })
      .expect(400);
    expect(Object.keys(mal.body.errores)).toEqual(
      expect.arrayContaining(['email', 'contrasena', 'nombres', 'telefono', 'canalPreferido']),
    );
  });

  it('RF-11: no se puede registrar dos veces el mismo correo', async () => {
    await http()
      .post('/api/auth/registro')
      .send({
        email: USUARIOS_DEMO.cliente.email,
        contrasena: 'Secreta123',
        nombres: 'Xavier',
        telefono: '912345678',
        canalPreferido: 'LLAMADA',
      })
      .expect(409);
  });

  it('RF-31: token alterado → 401 en ruta protegida', async () => {
    await http().get('/api/auth/yo').set('Authorization', `Bearer ${tokens.CLIENTE}x`).expect(401);
  });

  it('RF-31: el admin crea un asesor; un usuario desactivado ya no puede iniciar sesión', async () => {
    const email = `asesor${Date.now()}@svas.demo`;
    const creado = await http()
      .post('/api/admin/usuarios')
      .set('Authorization', `Bearer ${tokens.ADMINISTRADOR}`)
      .send({ email, contrasena: 'Asesor123!', rol: 'ASESOR' })
      .expect(201);
    await http().post('/api/auth/login').send({ email, contrasena: 'Asesor123!' }).expect(200);
    await http()
      .patch(`/api/admin/usuarios/${creado.body.id}`)
      .set('Authorization', `Bearer ${tokens.ADMINISTRADOR}`)
      .send({ activo: false })
      .expect(200);
    await http().post('/api/auth/login').send({ email, contrasena: 'Asesor123!' }).expect(401);
  });
});
