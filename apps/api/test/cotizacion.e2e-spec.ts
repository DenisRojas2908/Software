import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { crearAppPrueba, tokensDemo } from './soporte/app-prueba';
import { contactoUnico, datosAuto } from './soporte/datos';

type Plan = { prima: number | null; compraInmediata: boolean; motivoBloqueo: string | null };
type Aseg = { nombre: string; cotiza: boolean; planes: Plan[] };

describe('CU-01 Cotizar y comparar (F3)', () => {
  let app: INestApplication;
  const http = () => request(app.getHttpServer());
  const cotizar = (datos: Record<string, unknown>, token?: string) => {
    const r = http().post('/api/cotizaciones');
    if (token) r.set('Authorization', `Bearer ${token}`);
    return r.send({ contacto: contactoUnico(), datos });
  };

  beforeAll(async () => {
    app = await crearAppPrueba();
  });
  afterAll(() => app.close());

  it('RF-02 / RN-17: el formulario es la unión de los campos de las 5 aseguradoras activas', async () => {
    const res = await http().get('/api/catalogo/formulario').expect(200);
    expect(res.body.campos.map((c: { nombre: string }) => c.nombre)).toEqual([
      'uso',
      'marca',
      'modelo',
      'anio',
      'clase',
      'tipo',
      'departamento',
      'provincia',
      'distrito',
    ]);
    expect(res.body.aseguradoras).toHaveLength(5);
  });

  it('RF-03: datos inválidos → 400 con errores por campo', async () => {
    const res = await cotizar({ uso: 'PARTICULAR', marca: 'Toyota', anio: 'abc' }).expect(400);
    expect(res.body.errores).toMatchObject({
      modelo: expect.any(String),
      anio: expect.any(String),
      clase: expect.any(String),
    });
  });

  it('RF-05 / RN-01: auto 2022 → 5 aseguradoras × 3 planes, todas con Opción 1', async () => {
    const res = await cotizar(datosAuto()).expect(201);
    const c = res.body.cotizacion;
    expect(c.aseguradoras).toHaveLength(5);
    const planes = c.aseguradoras.flatMap((a: Aseg) => a.planes);
    expect(planes).toHaveLength(15);
    expect(planes.every((p: Plan) => p.compraInmediata)).toBe(true);
    expect(c.opciones).toEqual(['COMPRA_INMEDIATA', 'ASESORIA']);
    expect(c.motivoDerivacion).toBeNull();
    const rimac = c.aseguradoras.find((a: Aseg) => a.nombre === 'Rímac');
    expect(rimac.planes.find((p: Plan & { nombre: string }) => p.nombre === 'Intermedio').prima).toBe(1450); // 02 §10
  });

  it('CU-01 4a: auto 2009 → Rímac y La Positiva no cotizan; las demás sí', async () => {
    const res = await cotizar(datosAuto({ anio: 2009 })).expect(201);
    const sinCotizar = res.body.cotizacion.aseguradoras
      .filter((a: Aseg) => !a.cotiza)
      .map((a: Aseg) => a.nombre);
    expect(sinCotizar.sort()).toEqual(['La Positiva', 'Rímac']);
    expect(res.body.cotizacion.opciones).toContain('COMPRA_INMEDIATA');
  });

  it('RN-04 / RF-06: auto 2003 → no asegurable, solo Opción 2, derivado sin pedir correo', async () => {
    const res = await cotizar(datosAuto({ anio: 2003 })).expect(201);
    expect(res.body.cotizacion.motivoDerivacion).toBe('NO_ASEGURABLE');
    expect(res.body.cotizacion.opciones).toEqual(['ASESORIA']);
    // el caso se deriva por el puerto DerivadorCasos (02 §5 paso 5)
    const prisma = app.get((await import('../src/persistencia/prisma.service')).PrismaService);
    expect(
      await prisma.registroActividad.count({ where: { accion: 'DERIVAR_NO_ASEGURABLE' } }),
    ).toBeGreaterThan(0);
  });

  it('RN-03 / RN-25: taxi → todas exigen inspección: solo Opción 2 y derivación INSPECCION', async () => {
    const res = await cotizar(datosAuto({ uso: 'TRANSPORTE_PASAJEROS' })).expect(201);
    const c = res.body.cotizacion;
    expect(c.motivoDerivacion).toBe('INSPECCION');
    expect(c.opciones).toEqual(['ASESORIA']);
    const planes = c.aseguradoras.flatMap((a: Aseg) => a.planes);
    expect(planes.every((p: Plan) => p.motivoBloqueo === 'INSPECCION' && p.prima !== null)).toBe(true);
  });

  it('RN-24: Mapfre admite Opción 1 y Opción 2 con las reglas RN-01…RN-04 (particular 2022)', async () => {
    const res = await cotizar(datosAuto()).expect(201);
    const mapfre = res.body.cotizacion.aseguradoras.find((a: Aseg) => a.nombre === 'Mapfre');
    expect(mapfre.planes.every((p: Plan & { asesoria: boolean }) => p.compraInmediata && p.asesoria)).toBe(
      true,
    );
  });

  it('RN-23: Mapfre y Quálitas (sin campo diferenciador) usan el conjunto común', async () => {
    const prisma = app.get((await import('../src/persistencia/prisma.service')).PrismaService);
    for (const codigo of ['MAPFRE', 'QUALITAS']) {
      const campos = await prisma.campoRequerido.findMany({
        where: { aseguradora: { codigoEstrategia: codigo } },
      });
      expect(campos.map((c) => c.nombre).sort()).toEqual([
        'anio',
        'departamento',
        'distrito',
        'marca',
        'modelo',
        'provincia',
        'uso',
      ]);
    }
  });

  it('RN-16: una aseguradora o un plan desactivados no aparecen en nuevas cotizaciones; lo registrado se conserva', async () => {
    const prisma = app.get((await import('../src/persistencia/prisma.service')).PrismaService);
    const antigua = await cotizar(datosAuto()).expect(201);
    const qualitas = await prisma.aseguradora.findUniqueOrThrow({ where: { codigoEstrategia: 'QUALITAS' } });
    const fullRimac = await prisma.plan.findFirstOrThrow({
      where: { nombre: 'Full', aseguradora: { codigoEstrategia: 'RIMAC' } },
    });
    try {
      await prisma.aseguradora.update({ where: { id: qualitas.id }, data: { activa: false } });
      await prisma.plan.update({ where: { id: fullRimac.id }, data: { activo: false } });
      const nueva = (await cotizar(datosAuto()).expect(201)).body.cotizacion;
      expect(nueva.aseguradoras.map((a: Aseg) => a.nombre)).not.toContain('Quálitas');
      expect(
        nueva.aseguradoras
          .find((a: Aseg) => a.nombre === 'Rímac')
          .planes.map((p: { nombre: string }) => p.nombre),
      ).toEqual(['Básico', 'Intermedio']);
      const vieja = await http().get(`/api/cotizaciones/${antigua.body.cotizacion.id}`).expect(200);
      expect(vieja.body.aseguradoras.map((a: Aseg) => a.nombre)).toContain('Quálitas');
    } finally {
      await prisma.aseguradora.update({ where: { id: qualitas.id }, data: { activa: true } });
      await prisma.plan.update({ where: { id: fullRimac.id }, data: { activo: true } });
    }
  });

  it('RN-05: camión → fuera de nicho, sin cotización ni solicitud', async () => {
    const res = await cotizar(datosAuto({ uso: 'COMERCIAL_LIGERO', clase: 'CAMION' })).expect(201);
    expect(res.body).toEqual({ fueraDeNicho: true, mensaje: expect.stringMatching(/pesados/) });
  });

  it('RF-07: el mismo contacto y vehículo reutilizan el registro único de cliente y vehículo', async () => {
    const contacto = contactoUnico();
    const a = await http().post('/api/cotizaciones').send({ contacto, datos: datosAuto() }).expect(201);
    const b = await http().post('/api/cotizaciones').send({ contacto, datos: datosAuto() }).expect(201);
    expect(a.body.cotizacion.id).not.toBe(b.body.cotizacion.id);
    const prisma = app.get((await import('../src/persistencia/prisma.service')).PrismaService);
    const [ca, cb] = await Promise.all(
      [a.body.cotizacion.id, b.body.cotizacion.id].map((id: string) =>
        prisma.cotizacion.findUniqueOrThrow({ where: { id } }),
      ),
    );
    expect(ca.vehiculoId).toBe(cb.vehiculoId);
  });

  it('RN-05: un particular no puede registrar un 3.er vehículo particular', async () => {
    const contacto = contactoUnico();
    for (const modelo of ['Yaris', 'Corolla']) {
      await http()
        .post('/api/cotizaciones')
        .send({ contacto, datos: datosAuto({ modelo }) })
        .expect(201);
    }
    const res = await http()
      .post('/api/cotizaciones')
      .send({ contacto, datos: datosAuto({ modelo: 'Hilux' }) })
      .expect(201);
    expect(res.body.fueraDeNicho).toBe(true);
  });

  it('RF-32 / D-36: la cotización de un cliente con sesión no la ve otro cliente (403) ni un invitado', async () => {
    const tokens = await tokensDemo(app);
    const propia = await cotizar(datosAuto(), tokens.CLIENTE).expect(201);
    const id = propia.body.cotizacion.id;
    await http().get(`/api/cotizaciones/${id}`).set('Authorization', `Bearer ${tokens.CLIENTE}`).expect(200);
    const otro = await http()
      .post('/api/auth/registro')
      .send({
        email: `otro${Date.now()}@prueba.pe`,
        contrasena: 'Secreta123',
        nombres: 'Otro',
        telefono: '955555555',
        canalPreferido: 'LLAMADA',
      })
      .expect(201);
    await http().get(`/api/cotizaciones/${id}`).set('Authorization', `Bearer ${otro.body.token}`).expect(403);
    await http().get(`/api/cotizaciones/${id}`).expect(403);
  });

  it('D-36: una cotización de invitado se consulta por su uuid', async () => {
    const res = await cotizar(datosAuto()).expect(201);
    await http().get(`/api/cotizaciones/${res.body.cotizacion.id}`).expect(200);
  });

  it('RNF-12: cada cotización queda en el registro de actividad', async () => {
    const res = await cotizar(datosAuto()).expect(201);
    const prisma = app.get((await import('../src/persistencia/prisma.service')).PrismaService);
    const n = await prisma.registroActividad.count({
      where: { accion: 'COTIZAR', entidad: `Cotizacion#${res.body.cotizacion.id}` },
    });
    expect(n).toBe(1);
  });
});
