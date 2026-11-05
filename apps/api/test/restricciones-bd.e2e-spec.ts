// F1: la BD rechaza datos inválidos aunque el código tuviera un error (última barrera, 02 §9).
import { PrismaClient } from '@prisma/client';
import { crearPrisma } from '../src/persistencia/crear-prisma';

describe('Restricciones de la BD (F1)', () => {
  let prisma: PrismaClient;

  // Crea una cotización mínima con una prima del primer plan
  async function nuevaCotizacion() {
    const plan = await prisma.plan.findFirstOrThrow();
    const cliente = await prisma.cliente.create({
      data: { nombres: 'Prueba', telefono: '999999999', canalPreferido: 'LLAMADA' },
    });
    const vehiculo = await prisma.vehiculo.create({
      data: { uso: 'PARTICULAR', marca: 'Toyota', modelo: 'Yaris', anio: 2022, clienteId: cliente.id },
    });
    return prisma.cotizacion.create({
      data: {
        vehiculoId: vehiculo.id,
        primas: { create: [{ planId: plan.id, prima: 1000, disponible: true }] },
      },
      include: { primas: true },
    });
  }

  beforeAll(() => {
    prisma = crearPrisma();
  });
  afterAll(() => prisma.$disconnect());

  it('seed: 5 aseguradoras, 15 planes y una sola fila de parámetros', async () => {
    expect(await prisma.aseguradora.count()).toBe(5);
    expect(await prisma.plan.count()).toBe(15);
    expect(await prisma.parametrosComerciales.count()).toBe(1);
  });

  it('FK compuesta: la orden no puede apuntar a una prima de otra cotización', async () => {
    const a = await nuevaCotizacion();
    const b = await nuevaCotizacion();
    await expect(
      prisma.ordenCompra.create({
        data: {
          cotizacionId: a.id,
          primaCotizadaId: b.primas[0].id,
          primaFinal: 1000,
          canalVenta: 'AUTONOMO',
        },
      }),
    ).rejects.toThrow();
  });

  it('índice parcial + T4: solo un pago CONFIRMADO por orden', async () => {
    const c = await nuevaCotizacion();
    const orden = await prisma.ordenCompra.create({
      data: { cotizacionId: c.id, primaCotizadaId: c.primas[0].id, primaFinal: 1000, canalVenta: 'AUTONOMO' },
    });
    const pago = {
      ordenCompraId: orden.id,
      monto: 1000,
      modo: 'UNICO' as const,
      fecha: new Date(),
      estado: 'CONFIRMADO' as const,
    };
    await prisma.pago.create({ data: { ...pago, referencia: 'P1' } });
    await expect(prisma.pago.create({ data: { ...pago, referencia: 'P2' } })).rejects.toThrow();
    // Un pago RECHAZADO adicional sí se permite
    await expect(
      prisma.pago.create({ data: { ...pago, estado: 'RECHAZADO', referencia: 'P3' } }),
    ).resolves.toBeDefined();
  });

  it('RN-07 / T2: la BD rechaza un descuento de 12 % cuando el máximo es 10 %', async () => {
    const c = await nuevaCotizacion();
    await expect(
      prisma.descuento.create({
        data: {
          cotizacionId: c.id,
          planId: c.primas[0].planId,
          tipo: 'PRIMERA_COMPRA',
          porcentaje: 12,
          aceptado: true,
        },
      }),
    ).rejects.toThrow(/T2/);
  });

  it('T1: el asesor de un descuento debe tener rol ASESOR', async () => {
    const c = await nuevaCotizacion();
    const admin = await prisma.usuario.findFirstOrThrow({ where: { rol: 'ADMINISTRADOR' } });
    await expect(
      prisma.descuento.create({
        data: {
          cotizacionId: c.id,
          planId: c.primas[0].planId,
          tipo: 'NEGOCIADO',
          porcentaje: 8,
          aceptado: false,
          asesorId: admin.id,
        },
      }),
    ).rejects.toThrow(/T1/);
  });

  it('RN-14 / T3: no se aceptan 13 cuotas cuando el máximo es 12', async () => {
    const c = await nuevaCotizacion();
    const orden = await prisma.ordenCompra.create({
      data: { cotizacionId: c.id, primaCotizadaId: c.primas[0].id, primaFinal: 1000, canalVenta: 'AUTONOMO' },
    });
    await expect(
      prisma.pago.create({
        data: {
          ordenCompraId: orden.id,
          monto: 1000,
          modo: 'CUOTAS',
          numeroCuotas: 13,
          referencia: 'C',
          fecha: new Date(),
        },
      }),
    ).rejects.toThrow(/T3/);
  });

  it('T5: parametros_comerciales admite una sola fila', async () => {
    await expect(
      prisma.parametrosComerciales.create({
        data: {
          descuentoPrimeraCompra: 5,
          descuentoMaximo: 10,
          maxIntentos: 4,
          diasSeguimiento: 7,
          maxCuotas: 12,
          vigenciaEnlaceDias: 7,
        },
      }),
    ).rejects.toThrow(/T5/);
  });

  it('RN-10 / T6: un seguimiento no puede registrar 5 intentos si el máximo es 4', async () => {
    const c = await nuevaCotizacion();
    await expect(
      prisma.seguimiento.create({ data: { cotizacionId: c.id, fechaApertura: new Date(), intentos: 5 } }),
    ).rejects.toThrow(/T6/);
  });

  it('CHECK: una prima disponible debe tener monto', async () => {
    const c = await nuevaCotizacion();
    const plan = await prisma.plan.findFirstOrThrow({ where: { id: { not: c.primas[0].planId } } });
    await expect(
      prisma.primaCotizada.create({
        data: { cotizacionId: c.id, planId: plan.id, prima: null, disponible: true },
      }),
    ).rejects.toThrow();
  });

  it('RN-11 / CHECK: un seguimiento DESCARTADO exige motivo de cierre', async () => {
    const c = await nuevaCotizacion();
    await expect(
      prisma.seguimiento.create({
        data: { cotizacionId: c.id, fechaApertura: new Date(), estado: 'DESCARTADO' },
      }),
    ).rejects.toThrow();
  });
});
