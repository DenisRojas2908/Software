import { existsSync } from 'node:fs';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { calcularCronograma } from '../pagos/dominio/cuotas';
import { GENERADOR_PDF, GeneradorPdf } from '../integracion/pdf/generador-pdf';
import { PrismaService } from '../persistencia/prisma.service';
import { UsuarioSesion } from '../seguridad/decoradores';
import { verificarPropiedad } from '../seguridad/propiedad';

type Tx = Prisma.TransactionClient | PrismaService;

// 02 §7: la póliza no tiene columna de estado; la vigencia mostrada es fechaEmision + 12 meses.
export function vigenciaHasta(fechaEmision: Date): Date {
  const d = new Date(fechaEmision);
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

const INCLUIR_POLIZA = {
  ordenCompra: {
    include: {
      cotizacion: { include: { vehiculo: { include: { cliente: true } }, descuentos: true } },
      primaCotizada: { include: { plan: { include: { aseguradora: true } } } },
      pagos: { where: { estado: 'CONFIRMADO' as const } },
    },
  },
} satisfies Prisma.PolizaInclude;

@Injectable()
export class PolizaService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(GENERADOR_PDF) private readonly pdf: GeneradorPdf,
  ) {}

  // RF-25: arma el PDF con los datos ya registrados (no vuelve a pedir nada al cliente).
  async generarPdf(tx: Tx, polizaId: string): Promise<string> {
    const p = await tx.poliza.findUniqueOrThrow({ where: { id: polizaId }, include: INCLUIR_POLIZA });
    const o = p.ordenCompra;
    const cli = o.cotizacion.vehiculo.cliente;
    const v = o.cotizacion.vehiculo;
    const pago = o.pagos[0];
    const prima = Number(o.primaCotizada.prima ?? o.primaFinal);
    const primaFinal = Number(o.primaFinal);
    const descuento = o.cotizacion.descuentos.find(
      (d) =>
        d.aceptado &&
        d.planId === o.primaCotizada.planId &&
        Math.abs(prima * (1 - Number(d.porcentaje) / 100) - primaFinal) < 0.02,
    );
    const maxCuotas = pago?.numeroCuotas ?? 1;
    return this.pdf.generar({
      numero: p.numero,
      fechaEmision: p.fechaEmision,
      vigenciaHasta: vigenciaHasta(p.fechaEmision),
      aseguradora: o.primaCotizada.plan.aseguradora.nombre,
      plan: o.primaCotizada.plan.nombre,
      coberturas: o.primaCotizada.plan.descripcion,
      asegurado: `${cli.nombres} ${cli.apellidos ?? ''}`.trim(),
      documento: cli.numeroDocumento ?? '—',
      vehiculo: `${v.marca} ${v.modelo} ${v.anio}`,
      uso: v.uso,
      primaBase: prima,
      descuento: descuento ? `${Number(descuento.porcentaje)} % (${descuento.tipo})` : 'Sin descuento',
      primaFinal,
      modoPago: pago?.modo === 'CUOTAS' ? `En ${pago.numeroCuotas} cuotas` : 'Pago único',
      cronograma:
        pago?.modo === 'CUOTAS' ? calcularCronograma(primaFinal, maxCuotas, maxCuotas) : [primaFinal],
      canalVenta: p.canalVenta,
    });
  }

  // RF-25 / RF-32: solo el dueño descarga su póliza. Si el archivo no existe (p. ej. historial del seed) se regenera.
  async rutaPdf(polizaId: string, usuario: UsuarioSesion) {
    const p = await this.prisma.poliza.findUnique({ where: { id: polizaId }, include: INCLUIR_POLIZA });
    if (!p) throw new NotFoundException('Póliza no encontrada');
    verificarPropiedad(usuario, p.ordenCompra.cotizacion.vehiculo.cliente.usuarioId);
    let relativa = p.archivoPdf;
    if (!relativa || !existsSync(this.pdf.rutaAbsoluta(relativa))) {
      relativa = await this.generarPdf(this.prisma, p.id);
      await this.prisma.poliza.update({ where: { id: p.id }, data: { archivoPdf: relativa } });
    }
    return { ruta: this.pdf.rutaAbsoluta(relativa), nombre: `${p.numero}.pdf` };
  }

  // RF-26: el cliente consulta el estado de sus solicitudes, pagos y pólizas.
  async misTramites(usuario: UsuarioSesion) {
    const cliente = await this.prisma.cliente.findUnique({ where: { usuarioId: usuario.id } });
    if (!cliente) return [];
    const cotizaciones = await this.prisma.cotizacion.findMany({
      where: { vehiculo: { clienteId: cliente.id } },
      orderBy: { fecha: 'desc' },
      include: {
        vehiculo: true,
        solicitudes: { orderBy: { fechaCreacion: 'desc' }, take: 1 },
        seguimiento: true,
        orden: {
          include: {
            pagos: { orderBy: { fecha: 'desc' }, include: { cuotas: { orderBy: { numero: 'asc' } } } },
            poliza: true,
            primaCotizada: { include: { plan: { include: { aseguradora: true } } } },
          },
        },
      },
    });
    return cotizaciones.map((c) => {
      const pagoVigente = c.orden?.pagos.find((p) => p.estado === 'CONFIRMADO') ?? c.orden?.pagos[0];
      const poliza = c.orden?.poliza;
      return {
        cotizacionId: c.id,
        fecha: c.fecha,
        vehiculo: `${c.vehiculo.marca} ${c.vehiculo.modelo} ${c.vehiculo.anio}`,
        estado: c.estado,
        motivoDerivacion: c.motivoDerivacion,
        solicitud: c.solicitudes[0]
          ? { estado: c.solicitudes[0].estado, motivo: c.solicitudes[0].motivo }
          : null,
        orden: c.orden
          ? {
              id: c.orden.id,
              aseguradora: c.orden.primaCotizada.plan.aseguradora.nombre,
              plan: c.orden.primaCotizada.plan.nombre,
              primaFinal: Number(c.orden.primaFinal),
              pago: pagoVigente
                ? {
                    estado: pagoVigente.estado,
                    modo: pagoVigente.modo,
                    cuotas: pagoVigente.cuotas.map((q) => ({
                      numero: q.numero,
                      monto: Number(q.monto),
                      estado: q.estado,
                    })),
                  }
                : null,
            }
          : null,
        poliza: poliza
          ? {
              id: poliza.id,
              numero: poliza.numero,
              fechaEmision: poliza.fechaEmision,
              vigenciaHasta: vigenciaHasta(poliza.fechaEmision),
              canalVenta: poliza.canalVenta,
            }
          : null,
      };
    });
  }
}
