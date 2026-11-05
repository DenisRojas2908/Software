import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CanalContacto, MotivoAsesoria } from '@prisma/client';
import { RegistroActividadService } from '../../comun/registro-actividad.service';
import { RELOJ, Reloj } from '../../comun/reloj';
import { CompraService } from '../../compra/compra.service';
import { DescuentoExcedeMaximoError, validarDescuentoNegociado } from '../../compra/dominio/descuentos';
import { CotizacionService } from '../../cotizacion/cotizacion.service';
import { PrismaService } from '../../persistencia/prisma.service';
import { UsuarioSesion } from '../../seguridad/decoradores';
import { abrirSeguimiento } from '../retencion/seguimiento-apertura';
import { ordenarCola, ResultadoAsesoria } from './dominio/cola';

// CU-03 Solicitar asesoría / descuento. Orquesta; la cola y los descuentos tienen sus reglas en el dominio.
@Injectable()
export class AsesoriaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly actividad: RegistroActividadService,
    private readonly cotizaciones: CotizacionService,
    private readonly compras: CompraService,
    @Inject(RELOJ) private readonly reloj: Reloj,
  ) {}

  // CU-03 pasos 1–3 (RF-11, RF-12): el cliente pide asesoría sin re-digitar datos; si ya tiene una abierta, se reutiliza.
  async solicitar(
    usuario: UsuarioSesion,
    d: { cotizacionId: string; motivo: MotivoAsesoria; canal: CanalContacto },
  ) {
    const solicitud = await this.prisma.$transaction(async (tx) => {
      const cot = await this.compras.asociar(tx, d.cotizacionId, usuario); // registro mínimo: la cotización pasa a su cuenta
      if (cot.estado === 'CONVERTIDA') throw new ConflictException('Esta cotización ya fue comprada'); // 02 §7: estado final
      const abierta = await tx.solicitudAsesoria.findFirst({
        where: { cotizacionId: d.cotizacionId, estado: { not: 'CERRADA' } },
      });
      if (abierta) return abierta;
      const s = await tx.solicitudAsesoria.create({
        data: {
          cotizacionId: d.cotizacionId,
          motivo: d.motivo,
          canal: d.canal,
          origen: 'CLIENTE',
          estado: 'PENDIENTE',
          fechaCreacion: this.reloj.ahora(),
        },
      });
      await this.actividad.registrar('SOLICITAR_ASESORIA', `SolicitudAsesoria#${s.id}`, usuario.id, tx);
      return s;
    });
    // RF-12 / D-35: confirmación con tiempo estimado de contacto
    return {
      id: solicitud.id,
      estado: solicitud.estado,
      motivo: solicitud.motivo,
      canal: solicitud.canal,
      minutosEstimados: Number(process.env.MINUTOS_CONTACTO_ESTIMADO ?? 30),
    };
  }

  // CU-04 alt. 3b: en seguimiento el cliente quiere negociar → el asesor le crea una solicitud CU-03
  async desdeSeguimiento(seguimientoId: string, asesor: UsuarioSesion) {
    const seg = await this.prisma.seguimiento.findUnique({
      where: { id: seguimientoId },
      include: { cotizacion: { include: { vehiculo: { include: { cliente: true } } } } },
    });
    if (!seg) throw new NotFoundException('Seguimiento no encontrado');
    if (seg.cotizacion.estado === 'CONVERTIDA')
      throw new ConflictException('Esta cotización ya fue comprada');
    return this.prisma.$transaction(async (tx) => {
      const abierta = await tx.solicitudAsesoria.findFirst({
        where: { cotizacionId: seg.cotizacionId, estado: { not: 'CERRADA' } },
      });
      if (abierta) return abierta;
      const s = await tx.solicitudAsesoria.create({
        data: {
          cotizacionId: seg.cotizacionId,
          motivo: 'NEGOCIACION',
          canal: seg.cotizacion.vehiculo.cliente.canalPreferido,
          origen: 'CLIENTE',
          estado: 'PENDIENTE',
          fechaCreacion: this.reloj.ahora(),
        },
      });
      await this.actividad.registrar('SEGUIMIENTO_A_ASESORIA', `SolicitudAsesoria#${s.id}`, asesor.id, tx);
      return s;
    });
  }

  // RF-13 / RN-13: cola con derivados primero y por orden de llegada
  async cola() {
    const solicitudes = await this.prisma.solicitudAsesoria.findMany({
      where: { estado: { not: 'CERRADA' } },
      include: {
        asesor: { select: { email: true } },
        cotizacion: { include: { vehiculo: { include: { cliente: true } } } },
      },
    });
    return ordenarCola(solicitudes).map((s) => ({
      id: s.id,
      motivo: s.motivo,
      origen: s.origen,
      estado: s.estado,
      canal: s.canal,
      fechaCreacion: s.fechaCreacion,
      asesor: s.asesor?.email ?? null,
      cliente: s.cotizacion.vehiculo.cliente.nombres,
      vehiculo: `${s.cotizacion.vehiculo.marca} ${s.cotizacion.vehiculo.modelo} ${s.cotizacion.vehiculo.anio}`,
      uso: s.cotizacion.vehiculo.uso,
    }));
  }

  private async cargar(id: string) {
    const s = await this.prisma.solicitudAsesoria.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Solicitud no encontrada');
    return s;
  }

  // RF-13 + CU-03 paso 4: el asesor ve todo lo capturado (sin pedirlo de nuevo)
  async detalle(id: string, asesor: UsuarioSesion) {
    const s = await this.prisma.solicitudAsesoria.findUnique({
      where: { id },
      include: {
        cotizacion: { include: { vehiculo: { include: { cliente: true } }, descuentos: true } },
        asesor: { select: { email: true } },
      },
    });
    if (!s) throw new NotFoundException('Solicitud no encontrada');
    const cliente = s.cotizacion.vehiculo.cliente;
    const parametros = await this.prisma.parametrosComerciales.findFirstOrThrow();
    return {
      id: s.id,
      motivo: s.motivo,
      origen: s.origen,
      estado: s.estado,
      canal: s.canal,
      resultado: s.resultado,
      fechaCreacion: s.fechaCreacion,
      asesor: s.asesor?.email ?? null,
      esMia: s.asesorId === asesor.id,
      cliente: {
        nombres: cliente.nombres,
        apellidos: cliente.apellidos,
        telefono: cliente.telefono,
        email: cliente.email,
        canalPreferido: cliente.canalPreferido,
      },
      descuentoMaximo: Number(parametros.descuentoMaximo),
      descuentos: s.cotizacion.descuentos
        .filter((d) => d.tipo === 'NEGOCIADO')
        .map((d) => ({ planId: d.planId, porcentaje: Number(d.porcentaje), aceptado: d.aceptado })),
      cotizacion: await this.cotizaciones.detalle(s.cotizacionId, asesor),
    };
  }

  // CU-03 paso 4: tomar el caso (PENDIENTE → EN_ATENCION)
  async tomar(id: string, asesor: UsuarioSesion) {
    await this.cargar(id);
    await this.prisma.$transaction(async (tx) => {
      // update condicionado: si otro asesor la tomó un instante antes, no se pisa (02 §7)
      const r = await tx.solicitudAsesoria.updateMany({
        where: { id, estado: 'PENDIENTE' },
        data: { estado: 'EN_ATENCION', asesorId: asesor.id },
      });
      if (r.count === 0) throw new ConflictException('Esta solicitud ya fue tomada o cerrada');
      await this.actividad.registrar('TOMAR_SOLICITUD', `SolicitudAsesoria#${id}`, asesor.id, tx);
    });
    return this.detalle(id, asesor);
  }

  private async enAtencionPor(id: string, asesor: UsuarioSesion) {
    const s = await this.cargar(id);
    if (s.estado !== 'EN_ATENCION') throw new ConflictException('Primero toma la solicitud');
    if (s.asesorId !== asesor.id) throw new ForbiddenException('La atiende otro asesor');
    return s;
  }

  // CU-03 alt. 1a / D-32: en casos derivados el asesor registra la prima manualmente
  async registrarPrima(id: string, asesor: UsuarioSesion, d: { primaCotizadaId: string; prima: number }) {
    const s = await this.enAtencionPor(id, asesor);
    const p = await this.prisma.primaCotizada.findUnique({ where: { id: d.primaCotizadaId } });
    if (!p || p.cotizacionId !== s.cotizacionId)
      throw new NotFoundException('El plan no pertenece a esta cotización');
    // D-52 / RN-06: prima manual solo en casos derivados por el sistema y en planes SIN prima en línea;
    // una prima publicada solo cambia por primera compra o descuento registrado (RN-07, RN-08).
    if (s.origen !== 'SISTEMA' || p.prima !== null) {
      throw new UnprocessableEntityException({
        mensaje: 'Solo se registra prima manual en casos derivados y en planes sin prima en línea',
        errores: { prima: 'Este plan ya tiene prima publicada o el caso no fue derivado' },
      });
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.primaCotizada.update({ where: { id: p.id }, data: { prima: d.prima, disponible: true } });
      await this.actividad.registrar('PRIMA_MANUAL', `PrimaCotizada#${p.id}`, asesor.id, tx);
    });
    return this.detalle(id, asesor);
  }

  // CU-03 paso 5 / RF-14 / RN-07: descuento ≤ máximo, registrado con asesor, fecha, aseguradora, plan y %
  async registrarDescuento(id: string, asesor: UsuarioSesion, d: { planId: string; porcentaje: number }) {
    const s = await this.enAtencionPor(id, asesor);
    const parametros = await this.prisma.parametrosComerciales.findFirstOrThrow();
    try {
      validarDescuentoNegociado(d.porcentaje, Number(parametros.descuentoMaximo));
    } catch (e) {
      if (e instanceof DescuentoExcedeMaximoError || e instanceof RangeError) {
        throw new UnprocessableEntityException({ mensaje: e.message, errores: { porcentaje: e.message } });
      }
      throw e;
    }
    const plan = await this.prisma.primaCotizada.findFirst({
      where: { cotizacionId: s.cotizacionId, planId: d.planId },
    });
    if (!plan) throw new NotFoundException('El plan no pertenece a esta cotización');
    await this.prisma.$transaction(async (tx) => {
      await tx.descuento.deleteMany({
        where: { cotizacionId: s.cotizacionId, tipo: 'NEGOCIADO', aceptado: false },
      });
      const desc = await tx.descuento.create({
        data: {
          cotizacionId: s.cotizacionId,
          planId: d.planId,
          tipo: 'NEGOCIADO',
          porcentaje: d.porcentaje,
          aceptado: false,
          asesorId: asesor.id,
        },
      });
      await this.actividad.registrar(
        `DESCUENTO_NEGOCIADO_${d.porcentaje}`,
        `Descuento#${desc.id}`,
        asesor.id,
        tx,
      ); // RNF-12
    });
    return this.detalle(id, asesor);
  }

  // CU-03 paso 6 / RF-15: ACEPTA → la compra queda habilitada con la prima negociada (canal ASESORIA);
  // NO_ACEPTA / NO_RESPONDE → cotización NO_CONCRETADA y entra a seguimiento (6a, 6b).
  async registrarResultado(id: string, asesor: UsuarioSesion, resultado: ResultadoAsesoria) {
    const s = await this.enAtencionPor(id, asesor);
    await this.prisma.$transaction(async (tx) => {
      await tx.solicitudAsesoria.update({ where: { id }, data: { estado: 'CERRADA', resultado } });
      if (resultado === 'ACEPTA') {
        await tx.descuento.updateMany({
          where: { cotizacionId: s.cotizacionId, tipo: 'NEGOCIADO' },
          data: { aceptado: true },
        });
      } else {
        await abrirSeguimiento(tx, s.cotizacionId, this.reloj.ahora());
      }
      await this.actividad.registrar(
        `RESULTADO_ASESORIA_${resultado}`,
        `SolicitudAsesoria#${id}`,
        asesor.id,
        tx,
      );
    });
    return this.detalle(id, asesor);
  }
}
