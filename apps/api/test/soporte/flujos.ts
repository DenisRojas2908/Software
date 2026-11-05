import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { contactoUnico, datosAuto } from './datos';

// Pasos de negocio reutilizables en las pruebas de integración.
export async function registrarCliente(app: INestApplication) {
  const sufijo = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const r = await request(app.getHttpServer())
    .post('/api/auth/registro')
    .send({
      email: `c${sufijo}@prueba.pe`,
      contrasena: 'Secreta123',
      nombres: 'Cliente Prueba',
      telefono: `9${sufijo.slice(-8)}`,
      canalPreferido: 'WHATSAPP',
    })
    .expect(201);
  return r.body.token as string;
}

export function dniUnico() {
  return String(Math.floor(10_000_000 + Math.random() * 89_999_999));
}

export async function cotizarComoInvitado(
  app: INestApplication,
  datos: Record<string, unknown> = datosAuto(),
) {
  const r = await request(app.getHttpServer())
    .post('/api/cotizaciones')
    .send({ contacto: contactoUnico(), datos })
    .expect(201);
  return r.body.cotizacion;
}

type Plan = { primaCotizadaId: string; nombre: string; prima: number | null };
export function planDe(
  cotizacion: { aseguradoras: { nombre: string; planes: Plan[] }[] },
  aseguradora: string,
  plan: string,
) {
  return cotizacion.aseguradoras
    .find((a) => a.nombre === aseguradora)!
    .planes.find((p) => p.nombre === plan)!;
}

// Lleva una orden hasta "lista para pagar"
export async function prepararOrden(
  app: INestApplication,
  token: string,
  cotizacionId: string,
  primaCotizadaId: string,
  dni = dniUnico(),
  extra: Record<string, unknown> = {},
) {
  const http = () => request(app.getHttpServer());
  const auth = { Authorization: `Bearer ${token}` };
  const orden = await http()
    .post('/api/compras')
    .set(auth)
    .send({ cotizacionId, primaCotizadaId, ...extra })
    .expect(201);
  const id = orden.body.id as string;
  const datos = await http()
    .patch(`/api/compras/${id}/datos`)
    .set(auth)
    .send({ numeroDocumento: dni, apellidos: 'Prueba Ficticia' })
    .expect(200);
  await http()
    .post(`/api/compras/${id}/confirmar`)
    .set(auth)
    .send({ aceptaCondiciones: true, firma: true, modo: 'UNICO' })
    .expect(201);
  return { id, resumen: datos.body };
}
