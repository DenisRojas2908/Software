import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { USUARIOS_DEMO } from '../prisma/seed';
import { SimuladorFallos } from '../src/integracion/simulacion/simulador-fallos';
import { PrismaService } from '../src/persistencia/prisma.service';
import { crearAppPrueba, tokensDemo } from './soporte/app-prueba';
import { datosAuto } from './soporte/datos';
import { cotizarComoInvitado, planDe, prepararOrden, registrarCliente } from './soporte/flujos';

describe('CU-02 Comprar de forma autónoma (F4)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fallos: SimuladorFallos;
  const http = () => request(app.getHttpServer());
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

  beforeAll(async () => {
    app = await crearAppPrueba();
    prisma = app.get(PrismaService);
    fallos = app.get(SimuladorFallos);
  });
  afterEach(() => fallos.reiniciar());
  afterAll(() => app.close());

  it('CU-02: invitado cotiza, se registra, compra en 6 cuotas con 5 % de primera compra y descarga el PDF', async () => {
    const cot = await cotizarComoInvitado(app);
    const plan = planDe(cot, 'Rímac', 'Intermedio'); // prima 1450.00 con año 2026
    const token = await registrarCliente(app);

    // Paso 1–2: orden; la cotización de invitado queda asociada a la cuenta (D-16)
    const orden = await http()
      .post('/api/compras')
      .set(auth(token))
      .send({ cotizacionId: cot.id, primaCotizadaId: plan.primaCotizadaId })
      .expect(201);
    expect(orden.body.estado).toBe('PENDIENTE_DATOS');
    expect(orden.body.datosFaltantes).toEqual(['numeroDocumento', 'apellidos']); // RNF-08: solo lo que falta
    const id = orden.body.id;

    // Paso 3: datos faltantes → RN-08 primera compra 5 %
    const datos = await http()
      .patch(`/api/compras/${id}/datos`)
      .set(auth(token))
      .send({ numeroDocumento: '45678123', apellidos: 'Quispe Rojas' })
      .expect(200);
    expect(datos.body.descuento).toEqual({ tipo: 'PRIMERA_COMPRA', porcentaje: 5 });
    expect(datos.body.primaFinal).toBeCloseTo(plan.prima! * 0.95, 2);

    // Paso 4: condiciones + firma + 6 cuotas → cronograma (RN-14)
    const conf = await http()
      .post(`/api/compras/${id}/confirmar`)
      .set(auth(token))
      .send({ aceptaCondiciones: true, firma: true, modo: 'CUOTAS', numeroCuotas: 6 })
      .expect(201);
    expect(conf.body.cronograma).toHaveLength(6);

    // Pasos 5–7: pagar
    const pago = await http()
      .post(`/api/compras/${id}/pagar`)
      .set(auth(token))
      .send({ modo: 'CUOTAS', numeroCuotas: 6 })
      .expect(201);
    expect(pago.body.estado).toBe('PAGADA');
    expect(pago.body.canalVenta).toBe('AUTONOMO'); // RN-27
    expect(pago.body.pagos[0].cuotas.map((q: { estado: string }) => q.estado)).toEqual([
      'CONFIRMADO',
      'PENDIENTE',
      'PENDIENTE',
      'PENDIENTE',
      'PENDIENTE',
      'PENDIENTE',
    ]);

    const c = await prisma.cotizacion.findUniqueOrThrow({ where: { id: cot.id } });
    expect(c.estado).toBe('CONVERTIDA');

    // RF-25: PDF descargable (RN-15: solo tras pago confirmado)
    const pdf = await http()
      .get(`/api/polizas/${pago.body.polizaId}/pdf`)
      .set(auth(token))
      .buffer(true)
      .parse((res, cb) => {
        const partes: Buffer[] = [];
        res.on('data', (d: Buffer) => partes.push(d));
        res.on('end', () => cb(null, Buffer.concat(partes)));
      })
      .expect(200);
    expect(pdf.headers['content-type']).toContain('application/pdf');
    expect((pdf.body as Buffer).subarray(0, 4).toString()).toBe('%PDF');

    // RF-26: aparece en mis trámites con su póliza
    const mias = await http().get('/api/polizas/mias').set(auth(token)).expect(200);
    expect(mias.body[0].poliza.numero).toMatch(/^SVAS-RIMAC-/);
  });

  it('RN-08: cliente@svas.demo (DNI con póliza previa) NO recibe el 5 % de primera compra', async () => {
    const tokens = await tokensDemo(app);
    const cot = await cotizarComoInvitado(app);
    const plan = planDe(cot, 'Mapfre', 'Básico');
    const { resumen } = await prepararOrden(
      app,
      tokens.CLIENTE,
      cot.id,
      plan.primaCotizadaId,
      USUARIOS_DEMO.cliente.documento,
    );
    expect(resumen.descuento).toEqual({ tipo: null, porcentaje: 0 });
    expect(resumen.primaFinal).toBe(plan.prima);
  });

  it('CU-02 1a / RF-10: no se puede comprar en Opción 1 un plan que exige inspección (taxi)', async () => {
    const token = await registrarCliente(app);
    const cot = await cotizarComoInvitado(app, datosAuto({ uso: 'TRANSPORTE_PASAJEROS' }));
    const plan = planDe(cot, 'Quálitas', 'Full');
    const r = await http()
      .post('/api/compras')
      .set(auth(token))
      .send({ cotizacionId: cot.id, primaCotizadaId: plan.primaCotizadaId })
      .expect(422);
    expect(r.body.message).toMatch(/inspección/);
  });

  it('CU-02 5a: pago rechazado → no emite, queda el pago RECHAZADO y se puede reintentar', async () => {
    const token = await registrarCliente(app);
    const cot = await cotizarComoInvitado(app);
    const { id } = await prepararOrden(app, token, cot.id, planDe(cot, 'Pacífico', 'Full').primaCotizadaId);
    fallos.pagoRechazado = true;
    const r = await http()
      .post(`/api/compras/${id}/pagar`)
      .set(auth(token))
      .send({ modo: 'UNICO' })
      .expect(402);
    expect(r.body.estado).toBe('RECHAZADO');
    expect(await prisma.poliza.count({ where: { ordenCompraId: id } })).toBe(0);
    expect(await prisma.pago.count({ where: { ordenCompraId: id, estado: 'RECHAZADO' } })).toBe(1);

    fallos.pagoRechazado = false;
    await http().post(`/api/compras/${id}/pagar`).set(auth(token)).send({ modo: 'UNICO' }).expect(201);
    expect(await prisma.poliza.count({ where: { ordenCompraId: id } })).toBe(1);
  });

  it('RNF-05 / CU-02 6a: si falla la emisión se revierte TODO (sin pago confirmado, sin póliza, cotización sin convertir)', async () => {
    const token = await registrarCliente(app);
    const cot = await cotizarComoInvitado(app);
    const { id } = await prepararOrden(app, token, cot.id, planDe(cot, 'Quálitas', 'Básico').primaCotizadaId);
    fallos.emisionFallida = true;
    const r = await http()
      .post(`/api/compras/${id}/pagar`)
      .set(auth(token))
      .send({ modo: 'UNICO' })
      .expect(502);
    expect(r.body.estado).toBe('EMISION_FALLIDA');
    expect(await prisma.pago.count({ where: { ordenCompraId: id, estado: 'CONFIRMADO' } })).toBe(0);
    expect(await prisma.poliza.count({ where: { ordenCompraId: id } })).toBe(0);
    expect((await prisma.cotizacion.findUniqueOrThrow({ where: { id: cot.id } })).estado).toBe('REGISTRADA');
    expect(
      await prisma.registroActividad.count({
        where: { accion: 'EMISION_FALLIDA', entidad: `OrdenCompra#${id}` },
      }),
    ).toBe(1);
  });

  it('RN-14: no se aceptan 13 cuotas (máximo 12) y se informa por campo', async () => {
    const token = await registrarCliente(app);
    const cot = await cotizarComoInvitado(app);
    const { id } = await prepararOrden(app, token, cot.id, planDe(cot, 'Rímac', 'Básico').primaCotizadaId);
    const r = await http()
      .post(`/api/compras/${id}/confirmar`)
      .set(auth(token))
      .send({ aceptaCondiciones: true, firma: true, modo: 'CUOTAS', numeroCuotas: 13 })
      .expect(400);
    expect(r.body.errores.numeroCuotas).toMatch(/12/);
  });

  it('RF-24: sin aceptar condiciones ni firmar no se confirma', async () => {
    const token = await registrarCliente(app);
    const cot = await cotizarComoInvitado(app);
    const orden = await http()
      .post('/api/compras')
      .set(auth(token))
      .send({ cotizacionId: cot.id, primaCotizadaId: planDe(cot, 'Rímac', 'Full').primaCotizadaId })
      .expect(201);
    await http()
      .patch(`/api/compras/${orden.body.id}/datos`)
      .set(auth(token))
      .send({ numeroDocumento: '41234567', apellidos: 'Ficticio' })
      .expect(200);
    const r = await http()
      .post(`/api/compras/${orden.body.id}/confirmar`)
      .set(auth(token))
      .send({ aceptaCondiciones: false, firma: false, modo: 'UNICO' })
      .expect(400);
    expect(Object.keys(r.body.errores)).toEqual(['aceptaCondiciones', 'firma']);
  });

  it('RF-32: otro cliente no puede ver, pagar ni descargar la orden/póliza ajena', async () => {
    const dueno = await registrarCliente(app);
    const otro = await registrarCliente(app);
    const cot = await cotizarComoInvitado(app);
    const { id } = await prepararOrden(app, dueno, cot.id, planDe(cot, 'Mapfre', 'Full').primaCotizadaId);
    await http().get(`/api/compras/${id}`).set(auth(otro)).expect(403);
    await http().post(`/api/compras/${id}/pagar`).set(auth(otro)).send({ modo: 'UNICO' }).expect(403);
    const pago = await http()
      .post(`/api/compras/${id}/pagar`)
      .set(auth(dueno))
      .send({ modo: 'UNICO' })
      .expect(201);
    await http().get(`/api/polizas/${pago.body.polizaId}/pdf`).set(auth(otro)).expect(403);
    // y la cotización ya asociada tampoco puede "reclamarla" otra cuenta
    await http()
      .post('/api/compras')
      .set(auth(otro))
      .send({ cotizacionId: cot.id, primaCotizadaId: planDe(cot, 'Mapfre', 'Full').primaCotizadaId })
      .expect(403);
  });

  it('RF-25: la póliza histórica del seed se puede descargar (el PDF se regenera si falta)', async () => {
    const tokens = await tokensDemo(app);
    const mias = await http().get('/api/polizas/mias').set(auth(tokens.CLIENTE)).expect(200);
    const historica = mias.body.find((t: { poliza: { numero: string } | null }) =>
      t.poliza?.numero.includes('-H0000'),
    );
    expect(historica).toBeDefined();
    await http().get(`/api/polizas/${historica.poliza.id}/pdf`).set(auth(tokens.CLIENTE)).expect(200);
  });
});
