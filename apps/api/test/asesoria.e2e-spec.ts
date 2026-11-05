import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/persistencia/prisma.service';
import { crearAppPrueba, tokensDemo } from './soporte/app-prueba';
import { datosAuto } from './soporte/datos';
import { cotizarComoInvitado, dniUnico, planDe, registrarCliente } from './soporte/flujos';

describe('CU-03 Solicitar asesoría / descuento (F5)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let asesor: string;
  const http = () => request(app.getHttpServer());
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

  beforeAll(async () => {
    app = await crearAppPrueba();
    prisma = app.get(PrismaService);
    asesor = (await tokensDemo(app)).ASESOR;
  });
  afterAll(() => app.close());

  async function comprar(token: string, cotizacionId: string, primaCotizadaId: string) {
    const o = await http()
      .post('/api/compras')
      .set(auth(token))
      .send({ cotizacionId, primaCotizadaId })
      .expect(201);
    await http()
      .patch(`/api/compras/${o.body.id}/datos`)
      .set(auth(token))
      .send({ numeroDocumento: dniUnico(), apellidos: 'Ficticio' })
      .expect(200);
    await http()
      .post(`/api/compras/${o.body.id}/confirmar`)
      .set(auth(token))
      .send({ aceptaCondiciones: true, firma: true, modo: 'UNICO' })
      .expect(201);
    return (
      await http()
        .post(`/api/compras/${o.body.id}/pagar`)
        .set(auth(token))
        .send({ modo: 'UNICO' })
        .expect(201)
    ).body;
  }

  it('RF-06 / RN-13: un taxi se deriva solo (origen SISTEMA) y aparece antes que una solicitud de cliente más antigua', async () => {
    const cliente = await registrarCliente(app);
    const cot = await cotizarComoInvitado(app);
    const pedida = await http()
      .post('/api/asesoria/solicitudes')
      .set(auth(cliente))
      .send({ cotizacionId: cot.id, motivo: 'DUDA', canal: 'WHATSAPP' })
      .expect(201);
    const taxi = await cotizarComoInvitado(app, datosAuto({ uso: 'TRANSPORTE_PASAJEROS' }));

    const cola = (await http().get('/api/asesor/cola').set(auth(asesor)).expect(200)).body;
    const ids = cola.map((s: { id: string }) => s.id);
    const solicitudTaxi = await prisma.solicitudAsesoria.findFirstOrThrow({
      where: { cotizacionId: taxi.id },
    });
    expect(solicitudTaxi).toMatchObject({ origen: 'SISTEMA', motivo: 'INSPECCION', estado: 'PENDIENTE' });
    expect(ids.indexOf(solicitudTaxi.id)).toBeLessThan(ids.indexOf(pedida.body.id));
    expect(cola[0].origen).toBe('SISTEMA');
  });

  it('RF-12: la solicitud del cliente queda PENDIENTE y responde con tiempo estimado; no se duplica', async () => {
    const cliente = await registrarCliente(app);
    const cot = await cotizarComoInvitado(app);
    const a = await http()
      .post('/api/asesoria/solicitudes')
      .set(auth(cliente))
      .send({ cotizacionId: cot.id, motivo: 'NEGOCIACION', canal: 'LLAMADA' })
      .expect(201);
    expect(a.body).toMatchObject({ estado: 'PENDIENTE', minutosEstimados: 30 });
    const b = await http()
      .post('/api/asesoria/solicitudes')
      .set(auth(cliente))
      .send({ cotizacionId: cot.id, motivo: 'NEGOCIACION', canal: 'LLAMADA' })
      .expect(201);
    expect(b.body.id).toBe(a.body.id);
  });

  it('CU-03 2a: sin canal ni motivo → errores por campo', async () => {
    const cliente = await registrarCliente(app);
    const cot = await cotizarComoInvitado(app);
    const r = await http()
      .post('/api/asesoria/solicitudes')
      .set(auth(cliente))
      .send({ cotizacionId: cot.id })
      .expect(400);
    expect(Object.keys(r.body.errores).sort()).toEqual(['canal', 'motivo']);
  });

  it('CU-03 completo: el asesor intenta 12 % (rechazado, RN-07), ofrece 8 %, el cliente acepta y compra con canal ASESORIA (RN-09: 8 % y no 5 %)', async () => {
    const cliente = await registrarCliente(app);
    const cot = await cotizarComoInvitado(app);
    const plan = planDe(cot, 'Rímac', 'Full');
    const sol = await http()
      .post('/api/asesoria/solicitudes')
      .set(auth(cliente))
      .send({ cotizacionId: cot.id, motivo: 'NEGOCIACION', canal: 'WHATSAPP' })
      .expect(201);
    const id = sol.body.id;
    const planId = (await prisma.primaCotizada.findUniqueOrThrow({ where: { id: plan.primaCotizadaId } }))
      .planId;

    await http()
      .post(`/api/asesor/solicitudes/${id}/descuento`)
      .set(auth(asesor))
      .send({ planId, porcentaje: 8 })
      .expect(409); // aún no la toma
    const tomada = await http().post(`/api/asesor/solicitudes/${id}/tomar`).set(auth(asesor)).expect(201);
    expect(tomada.body.estado).toBe('EN_ATENCION');
    expect(tomada.body.cliente.telefono).toMatch(/^9\d{8}$/); // ve los datos capturados sin pedirlos

    const rechazo = await http()
      .post(`/api/asesor/solicitudes/${id}/descuento`)
      .set(auth(asesor))
      .send({ planId, porcentaje: 12 })
      .expect(422);
    expect(rechazo.body.errores.porcentaje).toMatch(/máximo permitido de 10/);
    await http()
      .post(`/api/asesor/solicitudes/${id}/descuento`)
      .set(auth(asesor))
      .send({ planId, porcentaje: 8 })
      .expect(201);
    await http()
      .post(`/api/asesor/solicitudes/${id}/resultado`)
      .set(auth(asesor))
      .send({ resultado: 'ACEPTA' })
      .expect(201);

    const pago = await comprar(cliente, cot.id, plan.primaCotizadaId);
    expect(pago.canalVenta).toBe('ASESORIA'); // RN-27
    expect(pago.descuento).toEqual({ tipo: 'NEGOCIADO', porcentaje: 8 }); // RN-09: no se acumula con el 5 %
    expect(plan.prima).toBe(1957.5); // 02 §10: Rímac Full 2022
    expect(pago.primaFinal).toBe(1800.9); // 1957.50 × 0,92
    const desc = await prisma.descuento.findFirstOrThrow({
      where: { cotizacionId: cot.id, tipo: 'NEGOCIADO' },
    });
    expect(desc).toMatchObject({ aceptado: true, planId }); // RF-14: queda registrado con asesor y plan
    expect(desc.asesorId).not.toBeNull();
  });

  it('D-30: taxi derivado por inspección, asesoría ACEPTA sin descuento → compra habilitada con canal ASESORIA', async () => {
    const cliente = await registrarCliente(app);
    const cot = await cotizarComoInvitado(app, datosAuto({ uso: 'TRANSPORTE_PASAJEROS' }));
    const plan = planDe(cot, 'Mapfre', 'Básico');
    // el cliente reclama su cotización (registro mínimo) pidiendo asesoría: se reutiliza la solicitud derivada
    const sol = await http()
      .post('/api/asesoria/solicitudes')
      .set(auth(cliente))
      .send({ cotizacionId: cot.id, motivo: 'DUDA', canal: 'WHATSAPP' })
      .expect(201);
    await http().post(`/api/asesor/solicitudes/${sol.body.id}/tomar`).set(auth(asesor)).expect(201);
    await http()
      .post(`/api/asesor/solicitudes/${sol.body.id}/resultado`)
      .set(auth(asesor))
      .send({ resultado: 'ACEPTA' })
      .expect(201);
    const pago = await comprar(cliente, cot.id, plan.primaCotizadaId);
    expect(pago.canalVenta).toBe('ASESORIA');
  });

  it('CU-03 1a / D-32: en un no asegurable el asesor registra la prima manual y el cliente puede comprar', async () => {
    const cliente = await registrarCliente(app);
    const cot = await cotizarComoInvitado(app, datosAuto({ anio: 2003 }));
    const plan = planDe(cot, 'Pacífico', 'Básico');
    expect(plan.prima).toBeNull();
    const sol = await http()
      .post('/api/asesoria/solicitudes')
      .set(auth(cliente))
      .send({ cotizacionId: cot.id, motivo: 'DUDA', canal: 'WHATSAPP' })
      .expect(201);
    await http().post(`/api/asesor/solicitudes/${sol.body.id}/tomar`).set(auth(asesor)).expect(201);
    await http()
      .post(`/api/asesor/solicitudes/${sol.body.id}/prima`)
      .set(auth(asesor))
      .send({ primaCotizadaId: plan.primaCotizadaId, prima: 980 })
      .expect(201);
    await http()
      .post(`/api/asesor/solicitudes/${sol.body.id}/resultado`)
      .set(auth(asesor))
      .send({ resultado: 'ACEPTA' })
      .expect(201);
    const pago = await comprar(cliente, cot.id, plan.primaCotizadaId);
    expect(pago.prima).toBe(980);
    expect(pago.canalVenta).toBe('ASESORIA');
  });

  it('CU-03 6a: si el cliente no acepta, la cotización queda NO_CONCRETADA y entra a seguimiento', async () => {
    const cliente = await registrarCliente(app);
    const cot = await cotizarComoInvitado(app);
    const sol = await http()
      .post('/api/asesoria/solicitudes')
      .set(auth(cliente))
      .send({ cotizacionId: cot.id, motivo: 'DESCUENTO', canal: 'LLAMADA' })
      .expect(201);
    await http().post(`/api/asesor/solicitudes/${sol.body.id}/tomar`).set(auth(asesor)).expect(201);
    await http()
      .post(`/api/asesor/solicitudes/${sol.body.id}/resultado`)
      .set(auth(asesor))
      .send({ resultado: 'NO_ACEPTA' })
      .expect(201);
    expect((await prisma.cotizacion.findUniqueOrThrow({ where: { id: cot.id } })).estado).toBe(
      'NO_CONCRETADA',
    );
    expect(await prisma.seguimiento.findUniqueOrThrow({ where: { cotizacionId: cot.id } })).toMatchObject({
      estado: 'EN_SEGUIMIENTO',
      intentos: 0,
    });
  });

  it('D-52 / RN-06: no se puede reescribir una prima publicada ni registrar prima manual en un caso pedido por el cliente', async () => {
    const cliente = await registrarCliente(app);
    const cot = await cotizarComoInvitado(app);
    const sol = await http()
      .post('/api/asesoria/solicitudes')
      .set(auth(cliente))
      .send({ cotizacionId: cot.id, motivo: 'DUDA', canal: 'WHATSAPP' })
      .expect(201);
    await http().post(`/api/asesor/solicitudes/${sol.body.id}/tomar`).set(auth(asesor)).expect(201);
    const plan = planDe(cot, 'Rímac', 'Full');
    const r = await http()
      .post(`/api/asesor/solicitudes/${sol.body.id}/prima`)
      .set(auth(asesor))
      .send({ primaCotizadaId: plan.primaCotizadaId, prima: 1000 })
      .expect(422);
    expect(r.body.errores.prima).toBeDefined();
    expect(
      Number((await prisma.primaCotizada.findUniqueOrThrow({ where: { id: plan.primaCotizadaId } })).prima),
    ).toBe(1957.5);
  });

  it('02 §7: dos asesores no pueden tomar el mismo caso (el segundo recibe 409)', async () => {
    const cliente = await registrarCliente(app);
    const cot = await cotizarComoInvitado(app);
    const sol = await http()
      .post('/api/asesoria/solicitudes')
      .set(auth(cliente))
      .send({ cotizacionId: cot.id, motivo: 'DUDA', canal: 'LLAMADA' })
      .expect(201);
    const otro = (
      await http().post('/api/auth/login').send({ email: 'asesor2@svas.demo', contrasena: 'Asesor123!' })
    ).body.token;
    await http().post(`/api/asesor/solicitudes/${sol.body.id}/tomar`).set(auth(asesor)).expect(201);
    await http().post(`/api/asesor/solicitudes/${sol.body.id}/tomar`).set(auth(otro)).expect(409);
  });

  it('02 §7: no se pide asesoría sobre una cotización ya comprada (CONVERTIDA es final)', async () => {
    const tokens = await tokensDemo(app);
    const mias = (await http().get('/api/polizas/mias').set(auth(tokens.CLIENTE)).expect(200)).body;
    const comprada = mias.find((t: { estado: string }) => t.estado === 'CONVERTIDA');
    await http()
      .post('/api/asesoria/solicitudes')
      .set(auth(tokens.CLIENTE))
      .send({ cotizacionId: comprada.cotizacionId, motivo: 'DUDA', canal: 'WHATSAPP' })
      .expect(409);
    expect((await prisma.cotizacion.findUniqueOrThrow({ where: { id: comprada.cotizacionId } })).estado).toBe(
      'CONVERTIDA',
    );
  });

  it('CU-03 1a: con prima manual pero sin ACEPTA del asesor, el cliente todavía no puede comprar', async () => {
    const cliente = await registrarCliente(app);
    const cot = await cotizarComoInvitado(app, datosAuto({ anio: 2003 }));
    const plan = planDe(cot, 'Mapfre', 'Básico');
    const sol = await http()
      .post('/api/asesoria/solicitudes')
      .set(auth(cliente))
      .send({ cotizacionId: cot.id, motivo: 'DUDA', canal: 'WHATSAPP' })
      .expect(201);
    await http().post(`/api/asesor/solicitudes/${sol.body.id}/tomar`).set(auth(asesor)).expect(201);
    await http()
      .post(`/api/asesor/solicitudes/${sol.body.id}/prima`)
      .set(auth(asesor))
      .send({ primaCotizadaId: plan.primaCotizadaId, prima: 950 })
      .expect(201);
    const det = (await http().get(`/api/cotizaciones/${cot.id}`).set(auth(cliente)).expect(200)).body;
    expect(planDe(det, 'Mapfre', 'Básico')).toMatchObject({
      prima: 950,
      compraInmediata: false,
      motivoBloqueo: 'ASESORIA_PENDIENTE',
    });
    await http()
      .post('/api/compras')
      .set(auth(cliente))
      .send({ cotizacionId: cot.id, primaCotizadaId: plan.primaCotizadaId })
      .expect(422);
  });

  it('RF-32: otro asesor no puede registrar descuentos en un caso que atiende otro', async () => {
    const cliente = await registrarCliente(app);
    const cot = await cotizarComoInvitado(app);
    const sol = await http()
      .post('/api/asesoria/solicitudes')
      .set(auth(cliente))
      .send({ cotizacionId: cot.id, motivo: 'DUDA', canal: 'LLAMADA' })
      .expect(201);
    await http().post(`/api/asesor/solicitudes/${sol.body.id}/tomar`).set(auth(asesor)).expect(201);
    const otro = (
      await http().post('/api/auth/login').send({ email: 'asesor2@svas.demo', contrasena: 'Asesor123!' })
    ).body.token;
    await http()
      .post(`/api/asesor/solicitudes/${sol.body.id}/resultado`)
      .set(auth(otro))
      .send({ resultado: 'ACEPTA' })
      .expect(403);
  });
});
