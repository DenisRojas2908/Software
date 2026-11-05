import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { RetencionService } from '../src/asesoria-retencion/retencion/retencion.service';
import { RELOJ, RelojFijo } from '../src/comun/reloj';
import { SimuladorFallos } from '../src/integracion/simulacion/simulador-fallos';
import { PrismaService } from '../src/persistencia/prisma.service';
import { crearAppPrueba, tokensDemo } from './soporte/app-prueba';
import { cotizarComoInvitado, dniUnico, planDe, registrarCliente } from './soporte/flujos';

describe('CU-04 Gestionar seguimiento de telemarketing (F6)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let retencion: RetencionService;
  let reloj: RelojFijo;
  let fallos: SimuladorFallos;
  let asesor: string;
  const http = () => request(app.getHttpServer());
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
  const DIA = 1;

  beforeAll(async () => {
    app = await crearAppPrueba();
    prisma = app.get(PrismaService);
    retencion = app.get(RetencionService);
    reloj = app.get(RELOJ);
    fallos = app.get(SimuladorFallos);
    asesor = (await tokensDemo(app)).ASESOR;
  });
  afterEach(() => fallos.reiniciar());
  afterAll(() => app.close());

  // Cotización de invitado que se abandona y entra a seguimiento (D-12)
  async function cotizacionEnSeguimiento() {
    const cot = await cotizarComoInvitado(app);
    reloj.adelantarDias(DIA);
    await retencion.procesar();
    const s = await prisma.seguimiento.findUniqueOrThrow({ where: { cotizacionId: cot.id } });
    return { cot, id: s.id };
  }
  const mensajes = (id: string, accion: string) =>
    prisma.registroActividad.count({ where: { entidad: `Seguimiento#${id}`, accion } });

  it('D-12 / RF-16: una cotización sin compra pasa a seguimiento (EN_SEGUIMIENTO) solo después de MINUTOS_ABANDONO', async () => {
    const cot = await cotizarComoInvitado(app);
    await retencion.procesar();
    expect(await prisma.seguimiento.findUnique({ where: { cotizacionId: cot.id } })).toBeNull();
    reloj.adelantarDias(DIA);
    await retencion.procesar();
    expect(await prisma.seguimiento.findUniqueOrThrow({ where: { cotizacionId: cot.id } })).toMatchObject({
      estado: 'EN_SEGUIMIENTO',
      intentos: 0,
    });
    expect((await prisma.cotizacion.findUniqueOrThrow({ where: { id: cot.id } })).estado).toBe(
      'NO_CONCRETADA',
    );
  });

  it('RN-10 / RNF-11: solo por el canal preferido; 4 intentos sin respuesta cierran el caso y el 5.º se rechaza', async () => {
    const { id } = await cotizacionEnSeguimiento();
    await http()
      .post(`/api/asesor/seguimientos/${id}/intentos`)
      .set(auth(asesor))
      .send({ canal: 'LLAMADA', resultado: 'NO_RESPONDE' })
      .expect(422);
    for (let i = 1; i <= 3; i++) {
      const r = await http()
        .post(`/api/asesor/seguimientos/${id}/intentos`)
        .set(auth(asesor))
        .send({ canal: 'WHATSAPP', resultado: 'NO_RESPONDE' })
        .expect(201);
      expect(r.body.intentosRestantes).toBe(4 - i);
    }
    const cuarto = await http()
      .post(`/api/asesor/seguimientos/${id}/intentos`)
      .set(auth(asesor))
      .send({ canal: 'WHATSAPP', resultado: 'NO_RESPONDE' })
      .expect(201);
    expect(cuarto.body).toMatchObject({
      estado: 'DESCARTADO',
      motivoCierre: 'NO_RESPONDE',
      intentos: 4,
      mensajeFinal: 'ENVIADO',
    });
    const quinto = await http()
      .post(`/api/asesor/seguimientos/${id}/intentos`)
      .set(auth(asesor))
      .send({ canal: 'WHATSAPP', resultado: 'NO_RESPONDE' })
      .expect(422);
    expect(quinto.body.mensaje).toMatch(/cerrado/);
    expect(await prisma.intentoContacto.count({ where: { seguimientoId: id } })).toBe(4);
  });

  it('RN-11 / RN-12: cerrar exige motivo; con PRECIO queda DESCARTADO y sale UN solo mensaje final con enlace', async () => {
    const { id } = await cotizacionEnSeguimiento();
    const sinMotivo = await http()
      .post(`/api/asesor/seguimientos/${id}/cerrar`)
      .set(auth(asesor))
      .send({})
      .expect(400);
    expect(sinMotivo.body.errores.motivo).toBeDefined();
    const r = await http()
      .post(`/api/asesor/seguimientos/${id}/cerrar`)
      .set(auth(asesor))
      .send({ motivo: 'PRECIO' })
      .expect(201);
    expect(r.body).toMatchObject({ estado: 'DESCARTADO', motivoCierre: 'PRECIO', mensajeFinal: 'ENVIADO' });
    expect(r.body.enlace.vigente).toBe(true);
    await http()
      .post(`/api/asesor/seguimientos/${id}/cerrar`)
      .set(auth(asesor))
      .send({ motivo: 'OTRO' })
      .expect(409);
    await http().post(`/api/asesor/seguimientos/${id}/reenviar-mensaje`).set(auth(asesor)).expect(409);
    expect(await mensajes(id, 'MENSAJE_FINAL_ENVIADO')).toBe(1);
  });

  it('CU-04 7a: si falla el envío queda registrado y se puede reenviar una vez', async () => {
    const { id } = await cotizacionEnSeguimiento();
    fallos.envioMensajeFallido = true;
    const r = await http()
      .post(`/api/asesor/seguimientos/${id}/cerrar`)
      .set(auth(asesor))
      .send({ motivo: 'SIN_INTERES' })
      .expect(201);
    expect(r.body.mensajeFinal).toBe('FALLIDO');
    fallos.envioMensajeFallido = false;
    const re = await http()
      .post(`/api/asesor/seguimientos/${id}/reenviar-mensaje`)
      .set(auth(asesor))
      .expect(201);
    expect(re.body.mensajeFinal).toBe('ENVIADO');
    await http().post(`/api/asesor/seguimientos/${id}/reenviar-mensaje`).set(auth(asesor)).expect(409);
  });

  it('RN-12 / RN-27: el cliente retoma desde el enlace y compra → canal TELEMARKETING; el seguimiento queda CONVERTIDO', async () => {
    const { cot, id } = await cotizacionEnSeguimiento();
    await http()
      .post(`/api/asesor/seguimientos/${id}/cerrar`)
      .set(auth(asesor))
      .send({ motivo: 'PRECIO' })
      .expect(201);
    const token = (await prisma.seguimiento.findUniqueOrThrow({ where: { id } })).enlaceToken!;
    const retoma = await http().get(`/api/retoma/${token}`).expect(200);
    expect(retoma.body.descuentoPrimeraCompra).toBe(5); // RN-08 vía enlace
    const plan = planDe(retoma.body.cotizacion, 'Rímac', 'Básico');
    const cliente = await registrarCliente(app);
    const o = await http()
      .post('/api/compras')
      .set(auth(cliente))
      .send({ cotizacionId: cot.id, primaCotizadaId: plan.primaCotizadaId, tokenRetoma: token })
      .expect(201);
    await http()
      .patch(`/api/compras/${o.body.id}/datos`)
      .set(auth(cliente))
      .send({ numeroDocumento: dniUnico(), apellidos: 'Ficticio' })
      .expect(200);
    await http()
      .post(`/api/compras/${o.body.id}/confirmar`)
      .set(auth(cliente))
      .send({ aceptaCondiciones: true, firma: true, modo: 'UNICO' })
      .expect(201);
    const pago = await http()
      .post(`/api/compras/${o.body.id}/pagar`)
      .set(auth(cliente))
      .send({ modo: 'UNICO' })
      .expect(201);
    expect(pago.body.canalVenta).toBe('TELEMARKETING');
    expect(pago.body.primaFinal).toBe(1033.13); // 02 §10: Rímac Básico 1087.50 × 0,95
    expect((await prisma.seguimiento.findUniqueOrThrow({ where: { id } })).estado).toBe('CONVERTIDO');
    expect((await prisma.cotizacion.findUniqueOrThrow({ where: { id: cot.id } })).estado).toBe('CONVERTIDA');
  });

  it('D-29 / RN-27: si acepta en seguimiento y compra (sin usar el enlace) → TELEMARKETING', async () => {
    const { cot, id } = await cotizacionEnSeguimiento();
    const r = await http().post(`/api/asesor/seguimientos/${id}/aceptar`).set(auth(asesor)).expect(201);
    expect(r.body.enlace.vigente).toBe(true); // CU-04 paso 5: se genera el enlace
    const cliente = await registrarCliente(app);
    const plan = planDe(
      (await http().get(`/api/cotizaciones/${cot.id}`).expect(200)).body,
      'Mapfre',
      'Básico',
    );
    const o = await http()
      .post('/api/compras')
      .set(auth(cliente))
      .send({ cotizacionId: cot.id, primaCotizadaId: plan.primaCotizadaId })
      .expect(201);
    expect(o.body.canalVenta).toBe('TELEMARKETING');
  });

  it('RN-12 / CU-04 7b: pasados 8 días el enlace está vencido (410) y no se puede comprar con él', async () => {
    const { cot, id } = await cotizacionEnSeguimiento();
    await http()
      .post(`/api/asesor/seguimientos/${id}/cerrar`)
      .set(auth(asesor))
      .send({ motivo: 'OTRO' })
      .expect(201);
    const token = (await prisma.seguimiento.findUniqueOrThrow({ where: { id } })).enlaceToken!;
    reloj.adelantarDias(8);
    const r = await http().get(`/api/retoma/${token}`).expect(410);
    expect(r.body.vencido).toBe(true);
    const cliente = await registrarCliente(app);
    const plan = (
      await prisma.primaCotizada.findFirstOrThrow({ where: { cotizacionId: cot.id, disponible: true } })
    ).id;
    await http()
      .post('/api/compras')
      .set(auth(cliente))
      .send({ cotizacionId: cot.id, primaCotizadaId: plan, tokenRetoma: token })
      .expect(410);
  });

  it('RN-10 3a: un seguimiento abierto más de 7 días se cierra solo con motivo NO_RESPONDE', async () => {
    const { id } = await cotizacionEnSeguimiento();
    reloj.adelantarDias(8);
    await retencion.procesar();
    expect(await prisma.seguimiento.findUniqueOrThrow({ where: { id } })).toMatchObject({
      estado: 'DESCARTADO',
      motivoCierre: 'NO_RESPONDE',
    });
    expect(await mensajes(id, 'MENSAJE_FINAL_ENVIADO')).toBe(1);
  });

  it('CU-04 paso 1: la cola muestra intentos hechos/restantes, canal y plan sugerido', async () => {
    const { id } = await cotizacionEnSeguimiento();
    const cola = (await http().get('/api/asesor/seguimientos').set(auth(asesor)).expect(200)).body;
    const s = cola.find((x: { id: string }) => x.id === id);
    expect(s).toMatchObject({ intentos: 0, intentosRestantes: 4, canalPreferido: 'WHATSAPP' });
    expect(s.planSugerido.prima).toBe(900); // D-29: la prima disponible más baja (Quálitas Básico 1200 × 0,75)
  });
});
