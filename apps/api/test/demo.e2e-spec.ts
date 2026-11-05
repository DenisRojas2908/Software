// F8 · Modo simulación. Requisito de Denis (y RNF-10 / RF-32):
// - DEMO_MODE=false → cada /api/demo/* responde 404, incluso como ADMINISTRADOR (el módulo no se registra).
// - DEMO_MODE=true  → sin token 401; CLIENTE y ASESOR 403; ADMINISTRADOR 2xx.
import { INestApplication } from '@nestjs/common';
import { Rol } from '@prisma/client';
import request from 'supertest';
import { RetencionService } from '../src/asesoria-retencion/retencion/retencion.service';
import { SimuladorFallos } from '../src/integracion/simulacion/simulador-fallos';
import { PrismaService } from '../src/persistencia/prisma.service';
import { crearAppPrueba, tokensDemo } from './soporte/app-prueba';
import { cotizarComoInvitado } from './soporte/flujos';

const ENDPOINTS_DEMO: { metodo: 'get' | 'post'; ruta: string; cuerpo?: object }[] = [
  { metodo: 'get', ruta: '/api/demo/estado' },
  { metodo: 'post', ruta: '/api/demo/reloj', cuerpo: { dias: 1 } },
  { metodo: 'post', ruta: '/api/demo/reloj/reiniciar' },
  { metodo: 'post', ruta: '/api/demo/fallos', cuerpo: { pagoRechazado: false } },
  { metodo: 'get', ruta: '/api/demo/buzon' },
  { metodo: 'post', ruta: '/api/demo/procesar-abandonos' },
  { metodo: 'post', ruta: '/api/demo/reset' },
];

describe('F8 · /api/demo/* con DEMO_MODE=false', () => {
  let app: INestApplication;
  let tokens: Record<Rol, string>;
  const previo = process.env.DEMO_MODE;

  beforeAll(async () => {
    process.env.DEMO_MODE = 'false';
    app = await crearAppPrueba();
    tokens = await tokensDemo(app);
  });
  afterAll(async () => {
    process.env.DEMO_MODE = previo;
    await app.close();
  });

  it.each(ENDPOINTS_DEMO)(
    'RNF-10: $metodo $ruta → 404 (incluso como ADMINISTRADOR y sin token)',
    async ({ metodo, ruta, cuerpo }) => {
      await request(app.getHttpServer())
        [metodo](ruta)
        .set('Authorization', `Bearer ${tokens.ADMINISTRADOR}`)
        .send(cuerpo ?? {})
        .expect(404);
      await request(app.getHttpServer())
        [metodo](ruta)
        .send(cuerpo ?? {})
        .expect(404);
    },
  );

  it('F8: /api/salud informa demoHabilitado=false (la web oculta el menú Demo)', async () => {
    const r = await request(app.getHttpServer()).get('/api/salud').expect(200);
    expect(r.body.demoHabilitado).toBe(false);
  });
});

describe('F8 · /api/demo/* con DEMO_MODE=true', () => {
  let app: INestApplication;
  let tokens: Record<Rol, string>;
  const previo = process.env.DEMO_MODE;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    process.env.DEMO_MODE = 'true';
    app = await crearAppPrueba();
    tokens = await tokensDemo(app);
  });
  afterAll(async () => {
    app.get(SimuladorFallos).reiniciar();
    process.env.DEMO_MODE = previo;
    await app.close();
  });

  it.each(ENDPOINTS_DEMO)(
    'RNF-10: $metodo $ruta → 401 sin token y 403 para CLIENTE y ASESOR',
    async ({ metodo, ruta, cuerpo }) => {
      await http()
        [metodo](ruta)
        .send(cuerpo ?? {})
        .expect(401);
      for (const rol of ['CLIENTE', 'ASESOR'] as const) {
        await http()
          [metodo](ruta)
          .set('Authorization', `Bearer ${tokens[rol]}`)
          .send(cuerpo ?? {})
          .expect(403);
      }
    },
  );

  it('D-07: el admin adelanta el reloj y vuelve a hoy', async () => {
    const auth = { Authorization: `Bearer ${tokens.ADMINISTRADOR}` };
    const r = await http().post('/api/demo/reloj').set(auth).send({ dias: 8 }).expect(200);
    expect(r.body.diasAdelantados).toBe(8);
    const h = await http().post('/api/demo/reloj/reiniciar').set(auth).expect(200);
    expect(h.body.diasAdelantados).toBe(0);
  });

  it('CU-02 5a: el admin fuerza el pago rechazado desde la demo', async () => {
    const r = await http()
      .post('/api/demo/fallos')
      .set('Authorization', `Bearer ${tokens.ADMINISTRADOR}`)
      .send({ pagoRechazado: true })
      .expect(200);
    expect(r.body.fallos.pagoRechazado).toBe(true);
    expect(app.get(SimuladorFallos).pagoRechazado).toBe(true);
    await http()
      .post('/api/demo/fallos')
      .set('Authorization', `Bearer ${tokens.ADMINISTRADOR}`)
      .send({ pagoRechazado: false })
      .expect(200);
  });

  it('D-12: "procesar abandonos" lleva a seguimiento una cotización vieja; el buzón muestra el mensaje final al cerrarla', async () => {
    const auth = { Authorization: `Bearer ${tokens.ADMINISTRADOR}` };
    const cot = await cotizarComoInvitado(app);
    await http().post('/api/demo/reloj').set(auth).send({ dias: 1 }).expect(200);
    const r = await http().post('/api/demo/procesar-abandonos').set(auth).expect(200);
    expect(r.body.abandonos).toBeGreaterThan(0);
    const prisma = app.get(PrismaService);
    const seg = await prisma.seguimiento.findUniqueOrThrow({ where: { cotizacionId: cot.id } });
    await http()
      .post(`/api/asesor/seguimientos/${seg.id}/cerrar`)
      .set('Authorization', `Bearer ${tokens.ASESOR}`)
      .send({ motivo: 'PRECIO' })
      .expect(201);
    const buzon = (await http().get('/api/demo/buzon').set(auth).expect(200)).body;
    expect(buzon[0]).toMatchObject({
      tipo: 'MENSAJE_FINAL',
      resultado: 'ENVIADO',
      vigente: true,
      enlace: expect.stringMatching(/^\/retomar\//),
    });
    expect(app.get(RetencionService)).toBeDefined();
  });

  it('F8: reiniciar la BD deja el seed de demo (5 aseguradoras, parámetros iniciales)', async () => {
    await http().post('/api/demo/reset').set('Authorization', `Bearer ${tokens.ADMINISTRADOR}`).expect(200);
    const prisma = app.get(PrismaService);
    expect(await prisma.aseguradora.count()).toBe(5);
    expect(await prisma.poliza.count()).toBe(80);
    expect(Number((await prisma.parametrosComerciales.findFirstOrThrow()).descuentoMaximo)).toBe(10);
  });
});
