import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/persistencia/prisma.service';
import { crearAppPrueba, tokensDemo } from './soporte/app-prueba';
import { datosAuto } from './soporte/datos';
import { cotizarComoInvitado, planDe, registrarCliente } from './soporte/flujos';

type Campo = { nombre: string; obligatorio: boolean };

describe('CU-05 Gestionar catálogo, parámetros y reportes (F7)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: string;
  let asesor: string;
  const http = () => request(app.getHttpServer());
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

  beforeAll(async () => {
    app = await crearAppPrueba();
    prisma = app.get(PrismaService);
    const t = await tokensDemo(app);
    admin = t.ADMINISTRADOR;
    asesor = t.ASESOR;
  });
  afterAll(() => app.close());

  it('RF-27 / RN-16 / RNF-13: el admin desactiva Quálitas y el formulario y el comparativo cambian sin reiniciar; lo antiguo se conserva', async () => {
    const antigua = await cotizarComoInvitado(app);
    const lista = (await http().get('/api/admin/aseguradoras').set(auth(admin)).expect(200)).body;
    const qualitas = lista.find((a: { nombre: string }) => a.nombre === 'Quálitas');
    try {
      await http()
        .patch(`/api/admin/aseguradoras/${qualitas.id}`)
        .set(auth(admin))
        .send({ activa: false })
        .expect(200);
      const form = (await http().get('/api/catalogo/formulario').expect(200)).body;
      expect(form.aseguradoras).not.toContain('Quálitas');
      const nueva = await cotizarComoInvitado(app);
      expect(nueva.aseguradoras.map((a: { nombre: string }) => a.nombre)).not.toContain('Quálitas');
      const vieja = (await http().get(`/api/cotizaciones/${antigua.id}`).expect(200)).body;
      expect(vieja.aseguradoras.map((a: { nombre: string }) => a.nombre)).toContain('Quálitas');
      // RNF-12: el cambio queda en la actividad
      expect(
        await prisma.registroActividad.count({
          where: { accion: 'DESACTIVAR_ASEGURADORA', entidad: `Aseguradora#${qualitas.id}` },
        }),
      ).toBeGreaterThan(0);
    } finally {
      await http()
        .patch(`/api/admin/aseguradoras/${qualitas.id}`)
        .set(auth(admin))
        .send({ activa: true })
        .expect(200);
    }
  });

  it('RF-28 / RNF-13: volver opcional y luego obligatorio un campo cambia el formulario en vivo', async () => {
    const campos = (await http().get('/api/admin/campos').set(auth(admin)).expect(200)).body;
    const distritos = campos.filter((c: Campo) => c.nombre === 'distrito');
    try {
      for (const c of distritos)
        await http()
          .patch(`/api/admin/campos/${c.id}`)
          .set(auth(admin))
          .send({ obligatorio: false })
          .expect(200);
      let form = (await http().get('/api/catalogo/formulario').expect(200)).body;
      expect(form.campos.find((c: Campo) => c.nombre === 'distrito').obligatorio).toBe(false);
      await http()
        .patch(`/api/admin/campos/${distritos[0].id}`)
        .set(auth(admin))
        .send({ obligatorio: true })
        .expect(200);
      form = (await http().get('/api/catalogo/formulario').expect(200)).body;
      expect(form.campos.find((c: Campo) => c.nombre === 'distrito').obligatorio).toBe(true); // RN-17: basta una aseguradora
    } finally {
      for (const c of distritos)
        await http().patch(`/api/admin/campos/${c.id}`).set(auth(admin)).send({ obligatorio: true });
    }
  });

  it('RF-28 / D-11: un campo nuevo ("color") aparece en el formulario y su valor se guarda en datos_adicionales', async () => {
    const rimac = (await http().get('/api/admin/aseguradoras').set(auth(admin))).body.find(
      (a: { nombre: string }) => a.nombre === 'Rímac',
    );
    const creado = await http()
      .post('/api/admin/campos')
      .set(auth(admin))
      .send({
        aseguradoraId: rimac.id,
        nombre: 'color',
        tipo: 'LISTA',
        obligatorio: false,
        valores: ['Rojo', 'Negro'],
      })
      .expect(201);
    try {
      const form = (await http().get('/api/catalogo/formulario').expect(200)).body;
      expect(form.campos.find((c: Campo) => c.nombre === 'color')).toMatchObject({
        tipo: 'LISTA',
        valores: ['Negro', 'Rojo'],
      });
      const cot = await cotizarComoInvitado(app, datosAuto({ color: 'Rojo' }));
      const fila = await prisma.cotizacion.findUniqueOrThrow({
        where: { id: cot.id },
        include: { vehiculo: true },
      });
      expect(fila.vehiculo.datosAdicionales).toEqual({ color: 'Rojo' });
      // valor fuera de la lista → error por campo (RF-03)
      const mal = await http()
        .post('/api/cotizaciones')
        .send({
          contacto: { nombres: 'Ana', telefono: '911111111', canalPreferido: 'LLAMADA' },
          datos: datosAuto({ color: 'Verde' }),
        })
        .expect(400);
      expect(mal.body.errores.color).toBeDefined();
    } finally {
      await http()
        .patch(`/api/admin/campos/${creado.body.id}`)
        .set(auth(admin))
        .send({ activo: false })
        .expect(200); // desactivar, no borrar
    }
  });

  it('RF-28: un campo LISTA nuevo sin valores se rechaza', async () => {
    const rimac = (await http().get('/api/admin/aseguradoras').set(auth(admin))).body.find(
      (a: { nombre: string }) => a.nombre === 'Rímac',
    );
    const r = await http()
      .post('/api/admin/campos')
      .set(auth(admin))
      .send({ aseguradoraId: rimac.id, nombre: 'gps', tipo: 'LISTA', obligatorio: true, valores: [] })
      .expect(400);
    expect(r.body.errores.valores).toBeDefined();
  });

  it('RF-31: el admin no puede desactivarse a sí mismo (quedaría el sistema sin administración)', async () => {
    const yo = (await http().get('/api/auth/yo').set(auth(admin)).expect(200)).body;
    await http().patch(`/api/admin/usuarios/${yo.id}`).set(auth(admin)).send({ activo: false }).expect(409);
  });

  it('RN-25 / RF-29: el admin quita la inspección de Mapfre para taxis y Mapfre pasa a permitir la Opción 1', async () => {
    const mapfre = (await http().get('/api/admin/aseguradoras').set(auth(admin))).body.find(
      (a: { nombre: string }) => a.nombre === 'Mapfre',
    );
    try {
      await http()
        .put('/api/admin/reglas-inspeccion')
        .set(auth(admin))
        .send({ aseguradoraId: mapfre.id, uso: 'TRANSPORTE_PASAJEROS', requiereInspeccion: false })
        .expect(200);
      const cot = await cotizarComoInvitado(app, datosAuto({ uso: 'TRANSPORTE_PASAJEROS' }));
      expect(planDe(cot, 'Mapfre', 'Básico')).toMatchObject({ compraInmediata: true });
      expect(planDe(cot, 'Rímac', 'Básico')).toMatchObject({
        compraInmediata: false,
        motivoBloqueo: 'INSPECCION',
      });
      expect(cot.motivoDerivacion).toBeNull();
    } finally {
      await http()
        .put('/api/admin/reglas-inspeccion')
        .set(auth(admin))
        .send({ aseguradoraId: mapfre.id, uso: 'TRANSPORTE_PASAJEROS', requiereInspeccion: true })
        .expect(200);
    }
  });

  it('RF-29 / RN-07: subir el descuento máximo a 15 % permite que el asesor registre 12 %', async () => {
    const original = (await http().get('/api/admin/parametros').set(auth(admin)).expect(200)).body;
    expect(original).toMatchObject({
      descuentoPrimeraCompra: 5,
      descuentoMaximo: 10,
      maxIntentos: 4,
      diasSeguimiento: 7,
      maxCuotas: 12,
      vigenciaEnlaceDias: 7,
    });
    const datos = {
      descuentoPrimeraCompra: 5,
      descuentoMaximo: 15,
      maxIntentos: 4,
      diasSeguimiento: 7,
      maxCuotas: 12,
      vigenciaEnlaceDias: 7,
    };
    try {
      await http().put('/api/admin/parametros').set(auth(admin)).send(datos).expect(200);
      const cliente = await registrarCliente(app);
      const cot = await cotizarComoInvitado(app);
      const sol = await http()
        .post('/api/asesoria/solicitudes')
        .set(auth(cliente))
        .send({ cotizacionId: cot.id, motivo: 'DESCUENTO', canal: 'WHATSAPP' })
        .expect(201);
      await http().post(`/api/asesor/solicitudes/${sol.body.id}/tomar`).set(auth(asesor)).expect(201);
      const planId = (
        await prisma.primaCotizada.findUniqueOrThrow({
          where: { id: planDe(cot, 'Rímac', 'Full').primaCotizadaId },
        })
      ).planId;
      await http()
        .post(`/api/asesor/solicitudes/${sol.body.id}/descuento`)
        .set(auth(asesor))
        .send({ planId, porcentaje: 12 })
        .expect(201);
    } finally {
      await http()
        .put('/api/admin/parametros')
        .set(auth(admin))
        .send({ ...datos, descuentoMaximo: 10 })
        .expect(200);
    }
  });

  it('RF-29: parámetros inválidos → 400 con errores por campo', async () => {
    const r = await http()
      .put('/api/admin/parametros')
      .set(auth(admin))
      .send({
        descuentoPrimeraCompra: 5,
        descuentoMaximo: 150,
        maxIntentos: 0,
        diasSeguimiento: 7,
        maxCuotas: 12,
        vigenciaEnlaceDias: 7,
      })
      .expect(400);
    expect(Object.keys(r.body.errores).sort()).toEqual(['descuentoMaximo', 'maxIntentos']);
  });

  it('RF-30: reporte de ventas por canal en el periodo (historial del seed: 80 pólizas en 90 días)', async () => {
    const r = (
      await http()
        .get('/api/admin/reportes/ventas?desde=2026-08-01&hasta=2026-11-04&agrupar=canal')
        .set(auth(admin))
        .expect(200)
    ).body;
    expect(r.filas.map((f: { grupo: string }) => f.grupo).sort()).toEqual([
      'ASESORIA',
      'AUTONOMO',
      'TELEMARKETING',
    ]);
    // 02 §10: el seed (sembrado con fecha 2026-11-05) trae exactamente 80 pólizas en los 90 días anteriores
    expect(r.total.polizas).toBe(80);
    const suma = await prisma.ordenCompra.aggregate({
      _sum: { primaFinal: true },
      where: { poliza: { numero: { contains: '-H' } } },
    });
    expect(r.total.primaTotal).toBe(Number(suma._sum.primaFinal));
    const porAseguradora = (
      await http().get('/api/admin/reportes/ventas?agrupar=aseguradora').set(auth(admin)).expect(200)
    ).body;
    expect(porAseguradora.filas).toHaveLength(5);
    await http().get('/api/admin/reportes/ventas?agrupar=color').set(auth(admin)).expect(400);
  });

  it('RNF-12: la actividad reciente muestra los cambios con usuario y fecha', async () => {
    const a = (await http().get('/api/admin/actividad').set(auth(admin)).expect(200)).body;
    expect(a.length).toBeGreaterThan(0);
    expect(a[0]).toMatchObject({
      accion: expect.any(String),
      entidad: expect.any(String),
      fecha: expect.any(String),
    });
  });

  it('RF-32: un ASESOR no puede tocar /api/admin/*', async () => {
    await http().get('/api/admin/parametros').set(auth(asesor)).expect(403);
    await http().put('/api/admin/parametros').set(auth(asesor)).send({}).expect(403);
  });
});
