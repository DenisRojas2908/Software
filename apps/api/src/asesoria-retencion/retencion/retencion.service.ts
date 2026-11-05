import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  GoneException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CanalContacto, MotivoCierre, Prisma, ResultadoIntento } from '@prisma/client';
import { RegistroActividadService } from '../../comun/registro-actividad.service';
import { RELOJ, Reloj } from '../../comun/reloj';
import { CotizacionService } from '../../cotizacion/cotizacion.service';
import { NOTIFICADOR, Notificador } from '../../integracion/notificador/notificador';
import { PrismaService } from '../../persistencia/prisma.service';
import { UsuarioSesion } from '../../seguridad/decoradores';
import { MotivoObligatorioError, ReglasSeguimiento, Seguimiento } from './dominio/seguimiento';
import { abrirSeguimiento } from './seguimiento-apertura';

type Tx = Prisma.TransactionClient | PrismaService;
const INCLUIR = {
  cotizacion: {
    include: {
      vehiculo: { include: { cliente: true } },
      primas: { include: { plan: { include: { aseguradora: true } } } },
      orden: { include: { primaCotizada: { include: { plan: { include: { aseguradora: true } } } } } },
    },
  },
  intentosContacto: { orderBy: { fecha: 'asc' as const }, include: { asesor: { select: { email: true } } } },
} satisfies Prisma.SeguimientoInclude;
type SeguimientoCompleto = Prisma.SeguimientoGetPayload<{ include: typeof INCLUIR }>;

// CU-04 Gestionar seguimiento de telemarketing. Las reglas viven en la clase de dominio Seguimiento.
@Injectable()
export class RetencionService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(RetencionService.name);
  private temporizador?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly actividad: RegistroActividadService,
    private readonly cotizaciones: CotizacionService,
    @Inject(RELOJ) private readonly reloj: Reloj,
    @Inject(NOTIFICADOR) private readonly notificador: Notificador,
  ) {}

  // D-12: un job revisa cada minuto los abandonos y los seguimientos vencidos (desactivable con JOB_SEGUIMIENTO=false).
  onModuleInit() {
    if (process.env.JOB_SEGUIMIENTO === 'false' || process.env.JEST_WORKER_ID) return;
    this.temporizador = setInterval(() => {
      this.procesar().catch((e) => this.log.warn(`Job de seguimiento: ${(e as Error).message}`));
    }, 60_000);
  }

  onModuleDestroy() {
    if (this.temporizador) clearInterval(this.temporizador);
  }

  private async reglas(tx: Tx = this.prisma): Promise<ReglasSeguimiento> {
    const p = await tx.parametrosComerciales.findFirstOrThrow();
    return {
      maxIntentos: p.maxIntentos,
      diasSeguimiento: p.diasSeguimiento,
      vigenciaEnlaceDias: p.vigenciaEnlaceDias,
    };
  }

  private dominio(s: SeguimientoCompleto, reglas: ReglasSeguimiento) {
    return new Seguimiento(
      {
        ...s,
        canalPreferido: s.cotizacion.vehiculo.cliente.canalPreferido,
        aceptado: s.intentosContacto.some((i) => i.resultado === 'ACEPTA' && i.fecha >= s.fechaApertura), // ventana vigente
      },
      reglas,
    );
  }

  private async cargar(id: string, tx: Tx = this.prisma): Promise<SeguimientoCompleto> {
    const s = await tx.seguimiento.findUnique({ where: { id }, include: INCLUIR });
    if (!s) throw new NotFoundException('Seguimiento no encontrado');
    return s;
  }

  // D-12 / RF-16: cotización REGISTRADA, sin pago confirmado ni asesoría abierta, con más de MINUTOS_ABANDONO → seguimiento.
  // RN-10 3a: además cierra los seguimientos que agotaron intentos o días.
  async procesar() {
    const ahora = this.reloj.ahora();
    const minutos = Number(process.env.MINUTOS_ABANDONO ?? 30);
    const limite = new Date(ahora.getTime() - minutos * 60_000);
    const abandonadas = await this.prisma.cotizacion.findMany({
      where: {
        estado: 'REGISTRADA',
        fecha: { lt: limite },
        seguimiento: null,
        solicitudes: { none: { OR: [{ estado: { not: 'CERRADA' } }, { resultado: 'ACEPTA' }] } }, // D-53
        primas: { some: { disponible: true } },
        OR: [{ orden: null }, { orden: { pagos: { none: { estado: 'CONFIRMADO' } } } }],
      },
      select: { id: true },
    });
    for (const c of abandonadas) {
      await this.prisma.$transaction(async (tx) => {
        await abrirSeguimiento(tx, c.id, ahora);
        await this.actividad.registrar('ABANDONO_A_SEGUIMIENTO', `Cotizacion#${c.id}`, null, tx);
      });
    }
    const reglas = await this.reglas();
    const abiertos = await this.prisma.seguimiento.findMany({
      where: { estado: 'EN_SEGUIMIENTO' },
      include: INCLUIR,
    });
    let cerrados = 0;
    for (const s of abiertos) {
      if (this.dominio(s, reglas).debeCerrarseAutomaticamente(ahora)) {
        try {
          await this.cerrarYAvisar(s.id, 'NO_RESPONDE', null);
          cerrados++;
        } catch (e) {
          this.log.warn(`No se pudo cerrar el seguimiento ${s.id}: ${(e as Error).message}`); // sigue con los demás
        }
      }
    }
    return { abandonos: abandonadas.length, cerradosAutomaticamente: cerrados };
  }

  // D-29: el plan del seguimiento es el de la orden abierta; si no hay, la prima disponible más baja.
  private planSugerido(s: SeguimientoCompleto) {
    const orden = s.cotizacion.orden;
    if (orden)
      return {
        primaCotizadaId: orden.primaCotizadaId,
        aseguradora: orden.primaCotizada.plan.aseguradora.nombre,
        plan: orden.primaCotizada.plan.nombre,
        prima: Number(orden.primaCotizada.prima),
      };
    const disponibles = s.cotizacion.primas
      .filter((p) => p.prima !== null)
      .sort((a, b) => Number(a.prima) - Number(b.prima));
    const p = disponibles[0];
    return p
      ? {
          primaCotizadaId: p.id,
          aseguradora: p.plan.aseguradora.nombre,
          plan: p.plan.nombre,
          prima: Number(p.prima),
        }
      : null;
  }

  private async vista(s: SeguimientoCompleto, reglas: ReglasSeguimiento) {
    const d = this.dominio(s, reglas);
    const cli = s.cotizacion.vehiculo.cliente;
    const v = s.cotizacion.vehiculo;
    const mensajes = await this.prisma.registroActividad.findMany({
      where: {
        entidad: `Seguimiento#${s.id}`,
        accion: { in: ['MENSAJE_FINAL_ENVIADO', 'MENSAJE_FINAL_FALLIDO'] },
      },
      orderBy: { fecha: 'asc' },
    });
    // CU-04 paso 2 / 5a: primera compra si el DNI (cuando se conoce) no tiene póliza previa
    let primeraCompra: boolean | null = null;
    if (cli.numeroDocumento) {
      primeraCompra =
        (await this.prisma.poliza.count({
          where: {
            ordenCompra: { cotizacion: { vehiculo: { cliente: { numeroDocumento: cli.numeroDocumento } } } },
          },
        })) === 0;
    }
    return {
      id: s.id,
      cotizacionId: s.cotizacionId,
      estado: s.estado,
      fechaApertura: s.fechaApertura,
      limite: d.limite,
      intentos: s.intentos,
      intentosRestantes: d.intentosRestantes,
      motivoCierre: s.motivoCierre,
      canalPreferido: cli.canalPreferido,
      cliente: { nombres: cli.nombres, telefono: cli.telefono },
      vehiculo: `${v.marca} ${v.modelo} ${v.anio}`,
      planSugerido: this.planSugerido(s),
      primeraCompra,
      historial: s.intentosContacto.map((i) => ({
        canal: i.canal,
        fecha: i.fecha,
        resultado: i.resultado,
        asesor: i.asesor.email,
      })),
      enlace: s.enlaceToken
        ? {
            expiraEn: s.enlaceExpiraEn,
            vigente: Seguimiento.enlaceVigente(s.enlaceExpiraEn, this.reloj.ahora()),
          }
        : null,
      mensajeFinal: mensajes.length
        ? mensajes[mensajes.length - 1].accion.replace('MENSAJE_FINAL_', '')
        : null,
      puedeContactar: d.puedeContactar(cli.canalPreferido, this.reloj.ahora()),
    };
  }

  // CU-04 paso 1: cola EN_SEGUIMIENTO con intentos hechos/restantes
  async cola() {
    const reglas = await this.reglas();
    const lista = await this.prisma.seguimiento.findMany({
      where: { estado: 'EN_SEGUIMIENTO' },
      include: INCLUIR,
      orderBy: { fechaApertura: 'asc' },
    });
    return Promise.all(lista.map((s) => this.vista(s, reglas)));
  }

  async detalle(id: string) {
    return this.vista(await this.cargar(id), await this.reglas());
  }

  // CU-04 pasos 3–5 / RF-17 / RN-10: un intento por el canal preferido y sin pasar el máximo
  async registrarIntento(
    id: string,
    asesor: UsuarioSesion,
    canal: CanalContacto,
    resultado: ResultadoIntento,
  ) {
    const reglas = await this.reglas();
    const ahora = this.reloj.ahora();
    await this.prisma.$transaction(async (tx) => {
      const s = await this.cargar(id, tx);
      const permiso = this.dominio(s, reglas).puedeContactar(canal, ahora);
      if (!permiso.permitido)
        throw new UnprocessableEntityException({
          mensaje: permiso.motivo,
          errores: { canal: permiso.motivo },
        });
      await tx.intentoContacto.create({
        data: { seguimientoId: id, canal, resultado, fecha: ahora, asesorId: asesor.id },
      });
      await tx.seguimiento.update({ where: { id }, data: { intentos: { increment: 1 } } });
      await this.actividad.registrar(`INTENTO_${resultado}`, `Seguimiento#${id}`, asesor.id, tx); // RNF-12
      if (resultado === 'ACEPTA') {
        // CU-04 paso 5: genera (o reactiva) el enlace de retoma con el descuento; el canal será TELEMARKETING (D-29)
        const enlace = this.dominio(s, reglas).nuevoEnlace(this.token(), ahora);
        await tx.seguimiento.update({ where: { id }, data: enlace });
      }
    });
    const s = await this.cargar(id);
    if (resultado === 'ACEPTA') await this.avisar(s, 'ENLACE_RETOMA', asesor.id);
    // RN-10: al alcanzar el máximo de intentos sin aceptación, el caso se cierra (motivo NO_RESPONDE)
    else if (this.dominio(s, reglas).debeCerrarseAutomaticamente(this.reloj.ahora()))
      await this.cerrarYAvisar(id, 'NO_RESPONDE', asesor.id);
    return this.detalle(id);
  }

  // CU-04 pasos 6–7 / RF-18 / RN-11 / RN-12: cierre con motivo → DESCARTADO + UN mensaje final con enlace
  async cerrar(id: string, asesor: UsuarioSesion, motivo: MotivoCierre | undefined) {
    await this.cerrarYAvisar(id, motivo, asesor.id);
    return this.detalle(id);
  }

  private async cerrarYAvisar(id: string, motivo: MotivoCierre | null | undefined, usuarioId: string | null) {
    const reglas = await this.reglas();
    const ahora = this.reloj.ahora();
    await this.prisma.$transaction(async (tx) => {
      const s = await this.cargar(id, tx);
      const dom = this.dominio(s, reglas);
      let cierre;
      try {
        cierre = dom.cerrar(motivo, ahora);
      } catch (e) {
        if (e instanceof MotivoObligatorioError)
          throw new BadRequestException({ mensaje: e.message, errores: { motivo: e.message } });
        throw new ConflictException((e as Error).message);
      }
      await tx.seguimiento.update({
        where: { id },
        data: { ...cierre, ...dom.enlaceParaCierre(this.token(), ahora) },
      });
      await this.actividad.registrar(
        `CERRAR_SEGUIMIENTO_${cierre.motivoCierre}`,
        `Seguimiento#${id}`,
        usuarioId,
        tx,
      );
    });
    await this.avisar(await this.cargar(id), 'MENSAJE_FINAL', usuarioId);
  }

  // RN-12 / D-34: el mensaje final se envía UNA sola vez; si falla queda registrado y se puede reenviar (7a).
  private async avisar(
    s: SeguimientoCompleto,
    tipo: 'ENLACE_RETOMA' | 'MENSAJE_FINAL',
    usuarioId: string | null,
  ) {
    const entidad = `Seguimiento#${s.id}`;
    if (
      tipo === 'MENSAJE_FINAL' &&
      (await this.prisma.registroActividad.count({ where: { entidad, accion: 'MENSAJE_FINAL_ENVIADO' } }))
    ) {
      throw new ConflictException('El mensaje final ya fue enviado (solo se envía uno)');
    }
    const cli = s.cotizacion.vehiculo.cliente;
    const enlace = `/retomar/${s.enlaceToken}`;
    const texto =
      tipo === 'MENSAJE_FINAL'
        ? `Hola ${cli.nombres}: si cambias de opinión, retoma tu compra con tu descuento aquí: ${enlace} (vence el ${s.enlaceExpiraEn?.toISOString().slice(0, 10)}).`
        : `Hola ${cli.nombres}: aquí tienes tu enlace para completar la compra con tu descuento: ${enlace}`;
    try {
      await this.notificador.enviar({ canal: cli.canalPreferido, telefono: cli.telefono, tipo, texto });
      await this.actividad.registrar(
        tipo === 'MENSAJE_FINAL' ? 'MENSAJE_FINAL_ENVIADO' : 'ENLACE_RETOMA_ENVIADO',
        entidad,
        usuarioId,
      );
    } catch (e) {
      this.log.warn(`Envío fallido (${tipo}) en ${entidad}: ${(e as Error).message}`);
      await this.actividad.registrar(
        tipo === 'MENSAJE_FINAL' ? 'MENSAJE_FINAL_FALLIDO' : 'ENLACE_RETOMA_FALLIDO',
        entidad,
        usuarioId,
      );
    }
  }

  // CU-04 7a: reenviar solo si el mensaje final falló y nunca se envió
  async reenviarMensaje(id: string, asesor: UsuarioSesion) {
    const s = await this.cargar(id);
    if (s.estado === 'EN_SEGUIMIENTO') throw new ConflictException('El caso aún no está cerrado');
    await this.avisar(s, 'MENSAJE_FINAL', asesor.id);
    return this.detalle(id);
  }

  private token() {
    return randomBytes(18).toString('base64url');
  }

  // RN-12 / CU-04 7b: retomar desde el enlace (público). Vencido → 410 y puede volver a cotizar.
  async retoma(token: string) {
    const s = await this.prisma.seguimiento.findUnique({ where: { enlaceToken: token }, include: INCLUIR });
    if (!s) throw new NotFoundException('Enlace no válido');
    if (!Seguimiento.enlaceVigente(s.enlaceExpiraEn, this.reloj.ahora())) {
      throw new GoneException({ mensaje: 'Este enlace ya venció. Puedes volver a cotizar.', vencido: true });
    }
    if (s.cotizacion.estado === 'CONVERTIDA') throw new ConflictException('Esta cotización ya fue comprada');
    const p = await this.prisma.parametrosComerciales.findFirstOrThrow();
    return {
      cotizacionId: s.cotizacionId,
      expiraEn: s.enlaceExpiraEn,
      planSugerido: this.planSugerido(s),
      descuentoPrimeraCompra: Number(p.descuentoPrimeraCompra), // RN-08: se aplica si el DNI no tiene póliza previa
      cotizacion: await this.cotizaciones.detalle(s.cotizacionId, undefined, { porEnlace: true }),
    };
  }
}
