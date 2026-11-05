import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TipoCampo, UsoVehiculo } from '@prisma/client';
import { RegistroActividadService } from '../comun/registro-actividad.service';
import { PrismaService } from '../persistencia/prisma.service';
import { redondear2 } from '../comun/dinero';
import { agruparVentas, CriterioReporte } from './dominio/reportes';
import { ParametrosEditables, validarParametros } from './dominio/parametros';

type Tx = Prisma.TransactionClient;

// CU-05: catálogo, parámetros, usuarios y reportes "sin tocar código" (RNF-13).
// Regla transversal: cada cambio y su RegistroActividad van en la MISMA transacción (RNF-12). Desactivar, no borrar (RN-16).
@Injectable()
export class AdministracionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly actividad: RegistroActividadService,
  ) {}

  private cambio<T>(
    adminId: string,
    accion: string,
    entidad: string,
    fn: (tx: Tx) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const r = await fn(tx);
      await this.actividad.registrar(accion, entidad, adminId, tx);
      return r;
    });
  }

  // ─── RF-27: aseguradoras y planes ───
  catalogo() {
    return this.prisma.aseguradora.findMany({
      orderBy: { nombre: 'asc' },
      include: { planes: { orderBy: { nombre: 'asc' } }, _count: { select: { campos: true } } },
    });
  }

  async activarAseguradora(id: string, activa: boolean, adminId: string) {
    await this.existe(this.prisma.aseguradora.findUnique({ where: { id } }), 'Aseguradora');
    return this.cambio(
      adminId,
      activa ? 'ACTIVAR_ASEGURADORA' : 'DESACTIVAR_ASEGURADORA',
      `Aseguradora#${id}`,
      (tx) => tx.aseguradora.update({ where: { id }, data: { activa } }),
    );
  }

  async actualizarPlan(id: string, d: { activo?: boolean; descripcion?: string }, adminId: string) {
    await this.existe(this.prisma.plan.findUnique({ where: { id } }), 'Plan');
    const accion = d.activo === undefined ? 'EDITAR_PLAN' : d.activo ? 'ACTIVAR_PLAN' : 'DESACTIVAR_PLAN';
    return this.cambio(adminId, accion, `Plan#${id}`, (tx) => tx.plan.update({ where: { id }, data: d }));
  }

  // ─── RF-28: campos requeridos y valores permitidos ───
  campos() {
    return this.prisma.campoRequerido.findMany({
      orderBy: [{ aseguradora: { nombre: 'asc' } }, { nombre: 'asc' }],
      include: { aseguradora: { select: { nombre: true } }, valores: { orderBy: { valor: 'asc' } } },
    });
  }

  // D-11: un campo nuevo sin columna propia se guarda en vehiculo.datos_adicionales (solo configuración)
  async crearCampo(
    d: { aseguradoraId: string; nombre: string; tipo: TipoCampo; obligatorio: boolean; valores: string[] },
    adminId: string,
  ) {
    await this.existe(this.prisma.aseguradora.findUnique({ where: { id: d.aseguradoraId } }), 'Aseguradora');
    if (
      await this.prisma.campoRequerido.findUnique({
        where: { aseguradoraId_nombre: { aseguradoraId: d.aseguradoraId, nombre: d.nombre } },
      })
    ) {
      throw new ConflictException({
        mensaje: 'Esa aseguradora ya tiene ese campo',
        errores: { nombre: 'Ya existe' },
      });
    }
    if (d.tipo === 'LISTA' && d.valores.length === 0) {
      throw new BadRequestException({
        mensaje: 'Una lista necesita al menos un valor',
        errores: { valores: 'Al menos un valor' },
      });
    }
    return this.prisma.$transaction(async (tx) => {
      const campo = await tx.campoRequerido.create({
        data: {
          aseguradoraId: d.aseguradoraId,
          nombre: d.nombre,
          tipo: d.tipo,
          obligatorio: d.obligatorio,
          valores: { create: d.valores.map((valor) => ({ valor })) },
        },
        include: { valores: true },
      });
      await this.actividad.registrar('CREAR_CAMPO', `CampoRequerido#${campo.id}`, adminId, tx); // RNF-12 (con id)
      return campo;
    });
  }

  async actualizarCampo(
    id: string,
    d: { obligatorio?: boolean; activo?: boolean; valores?: string[] },
    adminId: string,
  ) {
    const campo = await this.existe(this.prisma.campoRequerido.findUnique({ where: { id } }), 'Campo');
    if (d.valores && campo.tipo === 'LISTA' && d.valores.length === 0) {
      throw new BadRequestException({
        mensaje: 'Una lista necesita al menos un valor',
        errores: { valores: 'Al menos un valor' },
      });
    }
    return this.cambio(adminId, 'EDITAR_CAMPO', `CampoRequerido#${id}`, async (tx) => {
      if (d.valores) {
        // valor_permitido es una composición (CASCADE): se reemplaza el conjunto completo
        await tx.valorPermitido.deleteMany({ where: { campoRequeridoId: id } });
        await tx.valorPermitido.createMany({
          data: [...new Set(d.valores)].map((valor) => ({ campoRequeridoId: id, valor })),
        });
      }
      return tx.campoRequerido.update({
        where: { id },
        data: { obligatorio: d.obligatorio, activo: d.activo },
        include: { valores: true },
      });
    });
  }

  // ─── RF-29 / RN-25: reglas de inspección por aseguradora × uso ───
  async reglasInspeccion() {
    const [aseguradoras, reglas] = await Promise.all([
      this.prisma.aseguradora.findMany({ orderBy: { nombre: 'asc' }, select: { id: true, nombre: true } }),
      this.prisma.reglaInspeccion.findMany(),
    ]);
    return aseguradoras.map((a) => ({
      ...a,
      reglas: Object.values(UsoVehiculo).map((uso) => ({
        uso,
        requiereInspeccion:
          reglas.find((r) => r.aseguradoraId === a.id && r.uso === uso)?.requiereInspeccion ?? false,
      })),
    }));
  }

  async fijarInspeccion(
    d: { aseguradoraId: string; uso: UsoVehiculo; requiereInspeccion: boolean },
    adminId: string,
  ) {
    await this.existe(this.prisma.aseguradora.findUnique({ where: { id: d.aseguradoraId } }), 'Aseguradora');
    return this.cambio(
      adminId,
      `INSPECCION_${d.uso}_${d.requiereInspeccion ? 'SI' : 'NO'}`,
      `Aseguradora#${d.aseguradoraId}`,
      (tx) =>
        tx.reglaInspeccion.upsert({
          where: { aseguradoraId_uso: { aseguradoraId: d.aseguradoraId, uso: d.uso } },
          create: d,
          update: { requiereInspeccion: d.requiereInspeccion },
        }),
    );
  }

  // ─── RF-29: parámetros comerciales ───
  async parametros() {
    const p = await this.prisma.parametrosComerciales.findFirstOrThrow();
    return {
      ...p,
      descuentoPrimeraCompra: Number(p.descuentoPrimeraCompra),
      descuentoMaximo: Number(p.descuentoMaximo),
    };
  }

  async actualizarParametros(d: ParametrosEditables, adminId: string) {
    const errores = validarParametros(d);
    if (Object.keys(errores).length)
      throw new BadRequestException({ mensaje: 'Revisa los parámetros', errores });
    const actual = await this.prisma.parametrosComerciales.findFirstOrThrow();
    await this.cambio(adminId, 'EDITAR_PARAMETROS', `ParametrosComerciales#${actual.id}`, (tx) =>
      tx.parametrosComerciales.update({ where: { id: actual.id }, data: d }),
    );
    return this.parametros();
  }

  // RNF-12: vista de actividad reciente
  actividadReciente(limite = 50) {
    return this.prisma.registroActividad.findMany({
      orderBy: { fecha: 'desc' },
      take: limite,
      include: { usuario: { select: { email: true } } },
    });
  }

  // ─── RF-30: reportes por canal, aseguradora y plan en un periodo (sobre fechaEmision) ───
  async reporteVentas(desde: Date, hasta: Date, criterio: CriterioReporte) {
    const polizas = await this.prisma.poliza.findMany({
      where: { fechaEmision: { gte: desde, lte: hasta } },
      include: {
        ordenCompra: {
          include: { primaCotizada: { include: { plan: { include: { aseguradora: true } } } } },
        },
      },
    });
    const filas = agruparVentas(
      polizas.map((p) => ({
        canal: p.canalVenta,
        aseguradora: p.ordenCompra.primaCotizada.plan.aseguradora.nombre,
        plan: p.ordenCompra.primaCotizada.plan.nombre,
        primaFinal: Number(p.ordenCompra.primaFinal),
      })),
      criterio,
    );
    return {
      desde,
      hasta,
      agrupar: criterio,
      total: {
        polizas: polizas.length,
        primaTotal: filas.reduce((s, f) => redondear2(s + f.primaTotal), 0),
      },
      filas,
    };
  }

  private async existe<T>(p: Promise<T | null>, que: string): Promise<T> {
    const r = await p;
    if (!r) throw new NotFoundException(`${que} no encontrado`);
    return r;
  }
}
