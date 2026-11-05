import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CanalVenta, ModoPago, Prisma } from '@prisma/client';
import { RegistroActividadService } from '../comun/registro-actividad.service';
import { RELOJ, Reloj } from '../comun/reloj';
import { CatalogoService } from '../dominio-compartido/catalogo/catalogo.service';
import { EMISOR_ASEGURADORA, EmisorAseguradora } from '../integracion/aseguradora/emisor-aseguradora';
import { PASARELA_PAGO, PasarelaPago } from '../integracion/pasarela/pasarela-pago';
import { calcularCronograma, CuotasInvalidasError } from '../pagos/dominio/cuotas';
import { PrismaService } from '../persistencia/prisma.service';
import { PolizaService } from '../polizas/poliza.service';
import { UsuarioSesion } from '../seguridad/decoradores';
import { atribuirCanal } from './dominio/atribuir-canal';
import { calcularPrimaFinal, resolverDescuento } from './dominio/descuentos';
import { CompraNoHabilitadaError, verificarCompraHabilitada } from './dominio/habilitacion';
import { habilitadaPorAsesoria } from './dominio/habilitada-por-asesoria';

type Tx = Prisma.TransactionClient | PrismaService;

const INCLUIR_ORDEN = {
  cotizacion: {
    include: {
      vehiculo: { include: { cliente: true, ubicacion: true } },
      solicitudes: true,
      seguimiento: { include: { intentosContacto: true } },
      descuentos: true,
    },
  },
  primaCotizada: { include: { plan: { include: { aseguradora: true } } } },
  pagos: { include: { cuotas: { orderBy: { numero: 'asc' } } }, orderBy: { fecha: 'desc' } },
  poliza: true,
} satisfies Prisma.OrdenCompraInclude;

export type OrdenCompleta = Prisma.OrdenCompraGetPayload<{ include: typeof INCLUIR_ORDEN }>;

// CU-02 Comprar de forma autónoma. Orquesta; las reglas están en compra/dominio y pagos/dominio.
@Injectable()
export class CompraService {
  private readonly log = new Logger(CompraService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogo: CatalogoService,
    private readonly actividad: RegistroActividadService,
    private readonly polizas: PolizaService,
    @Inject(RELOJ) private readonly reloj: Reloj,
    @Inject(PASARELA_PAGO) private readonly pasarela: PasarelaPago,
    @Inject(EMISOR_ASEGURADORA) private readonly emisor: EmisorAseguradora,
  ) {}

  // ─── Contexto: todo lo que deciden las reglas, calculado desde la BD ───
  private async contexto(tx: Tx, orden: OrdenCompleta) {
    const c = orden.cotizacion;
    const parametros = await tx.parametrosComerciales.findFirstOrThrow();
    const maximo = Number(parametros.descuentoMaximo);
    const documento = c.vehiculo.cliente.numeroDocumento;

    // RN-08: primera compra = el número de documento no tiene póliza previa (se evalúa cuando se conoce el DNI)
    let primeraCompra: number | null = null;
    if (documento) {
      const previas = await tx.poliza.count({
        // la póliza de esta misma orden no cuenta como "previa"
        where: {
          ordenCompraId: { not: orden.id },
          ordenCompra: { cotizacion: { vehiculo: { cliente: { numeroDocumento: documento } } } },
        },
      });
      if (previas === 0) primeraCompra = Number(parametros.descuentoPrimeraCompra);
    }
    // RN-07: negociado aceptado para este plan
    const negociado = c.descuentos.find(
      (d) => d.tipo === 'NEGOCIADO' && d.aceptado && d.planId === orden.primaCotizada.planId,
    );
    const descuento = resolverDescuento(
      { primeraCompra, negociado: negociado ? Number(negociado.porcentaje) : null },
      maximo,
    );
    const prima = orden.primaCotizada.prima === null ? null : Number(orden.primaCotizada.prima);

    // RN-27 (D-29, D-30): banderas para el canal
    const porAsesoria = habilitadaPorAsesoria(c.solicitudes, c.descuentos, orden.primaCotizada.planId);
    const aceptoEnSeguimiento = !!c.seguimiento?.intentosContacto.some((i) => i.resultado === 'ACEPTA');
    const desdeEnlaceRetoma =
      (await tx.registroActividad.count({
        where: { accion: 'COMPRA_DESDE_ENLACE', entidad: `Cotizacion#${c.id}` },
      })) > 0;
    const canal: CanalVenta = atribuirCanal({
      desdeEnlaceRetoma,
      aceptoEnSeguimiento,
      habilitadaPorAsesoria: porAsesoria,
    });

    return {
      parametros,
      prima,
      primeraCompra,
      descuento,
      primaFinal: prima === null ? 0 : calcularPrimaFinal(prima, descuento.porcentaje),
      canal,
      habilitadaPorAsesoria: porAsesoria,
      datosFaltantes: [!documento && 'numeroDocumento', !c.vehiculo.cliente.apellidos && 'apellidos'].filter(
        Boolean,
      ) as string[],
    };
  }

  private async cargarOrden(tx: Tx, ordenId: string, usuario: UsuarioSesion): Promise<OrdenCompleta> {
    const orden = await tx.ordenCompra.findUnique({ where: { id: ordenId }, include: INCLUIR_ORDEN });
    if (!orden) throw new NotFoundException('Orden no encontrada');
    if (orden.cotizacion.vehiculo.cliente.usuarioId !== usuario.id)
      throw new ForbiddenException('Esta orden es de otra cuenta'); // RF-32
    return orden;
  }

  private pagoConfirmado(orden: OrdenCompleta) {
    return orden.pagos.find((p) => p.estado === 'CONFIRMADO');
  }

  // CU-02 paso 2 (D-16, D-36): la cotización de invitado pasa a la cuenta que inicia la compra.
  async asociar(tx: Tx, cotizacionId: string, usuario: UsuarioSesion) {
    const c = await tx.cotizacion.findUnique({
      where: { id: cotizacionId },
      include: { vehiculo: { include: { cliente: true } } },
    });
    if (!c) throw new NotFoundException('Cotización no encontrada');
    const dueno = c.vehiculo.cliente.usuarioId;
    if (dueno === usuario.id) return c;
    if (dueno) throw new ForbiddenException('Esta cotización pertenece a otra cuenta');
    const propio = await tx.cliente.findUniqueOrThrow({ where: { usuarioId: usuario.id } });
    await tx.vehiculo.update({ where: { id: c.vehiculoId }, data: { clienteId: propio.id } });
    await this.actividad.registrar('ASOCIAR_COTIZACION', `Cotizacion#${c.id}`, usuario.id, tx);
    return c;
  }

  // CU-02 paso 1: elige plan + "Comprar ahora". D-28: la orden sin pago confirmado es editable.
  async crearOrden(
    usuario: UsuarioSesion,
    cotizacionId: string,
    primaCotizadaId: string,
    tokenRetoma?: string,
  ) {
    const ordenId = await this.prisma.$transaction(async (tx) => {
      await this.asociar(tx, cotizacionId, usuario);
      const c = await tx.cotizacion.findUniqueOrThrow({
        where: { id: cotizacionId },
        include: {
          primas: { include: { plan: true } },
          vehiculo: true,
          orden: { include: { pagos: true } },
          seguimiento: true,
          solicitudes: true,
          descuentos: true,
        },
      });
      const prima = c.primas.find((p) => p.id === primaCotizadaId);
      if (!prima) throw new NotFoundException('El plan elegido no pertenece a esta cotización');
      if (c.orden?.pagos.some((p) => p.estado === 'CONFIRMADO'))
        throw new ConflictException('Esta cotización ya fue comprada');

      // CU-02 1a: ¿se puede comprar este plan?
      const inspeccion = await this.catalogo.aseguradorasConInspeccion(c.vehiculo.uso);

      try {
        verificarCompraHabilitada({
          prima: prima.prima === null ? null : Number(prima.prima),
          motivoBloqueo:
            prima.prima === null
              ? 'NO_COTIZA'
              : inspeccion.has(prima.plan.aseguradoraId)
                ? 'INSPECCION'
                : null,
          habilitadaPorAsesoria: habilitadaPorAsesoria(c.solicitudes, c.descuentos, prima.planId),
        });
      } catch (e) {
        if (e instanceof CompraNoHabilitadaError) throw new UnprocessableEntityException(e.message);
        throw e;
      }

      // RN-12 / RN-27: si entra con un enlace de retoma vigente, la compra se marca como iniciada desde el enlace
      if (tokenRetoma && c.seguimiento?.enlaceToken === tokenRetoma) {
        if (!c.seguimiento.enlaceExpiraEn || c.seguimiento.enlaceExpiraEn < this.reloj.ahora()) {
          throw new HttpException(
            { mensaje: 'El enlace de retoma venció. Puedes volver a cotizar.' },
            HttpStatus.GONE,
          );
        }
        const ya = await tx.registroActividad.count({
          where: { accion: 'COMPRA_DESDE_ENLACE', entidad: `Cotizacion#${c.id}` },
        });
        if (!ya) await this.actividad.registrar('COMPRA_DESDE_ENLACE', `Cotizacion#${c.id}`, usuario.id, tx);
      }

      const datos = {
        primaCotizadaId,
        primaFinal: Number(prima.prima),
        canalVenta: 'AUTONOMO' as CanalVenta,
      };
      const orden = c.orden
        ? await tx.ordenCompra.update({ where: { id: c.orden.id }, data: datos })
        : await tx.ordenCompra.create({ data: { ...datos, cotizacionId, creadoEn: this.reloj.ahora() } });
      await tx.descuento.updateMany({
        where: { cotizacionId, tipo: 'PRIMERA_COMPRA' },
        data: { planId: prima.planId },
      });
      // Precio y canal provisionales con las reglas actuales (el definitivo se fija al pagar, D-28)
      const completa = await tx.ordenCompra.findUniqueOrThrow({
        where: { id: orden.id },
        include: INCLUIR_ORDEN,
      });
      const ctx = await this.contexto(tx, completa);
      await tx.ordenCompra.update({
        where: { id: orden.id },
        data: { primaFinal: ctx.primaFinal, canalVenta: ctx.canal },
      });
      await this.actividad.registrar('CREAR_ORDEN', `OrdenCompra#${orden.id}`, usuario.id, tx);
      return orden.id;
    });
    return this.resumen(ordenId, usuario);
  }

  async resumen(ordenId: string, usuario: UsuarioSesion) {
    const orden = await this.cargarOrden(this.prisma, ordenId, usuario);
    const ctx = await this.contexto(this.prisma, orden);
    const c = orden.cotizacion;
    const v = c.vehiculo;
    const pagado = this.pagoConfirmado(orden);
    return {
      id: orden.id,
      cotizacionId: c.id,
      estado: pagado ? 'PAGADA' : ctx.datosFaltantes.length ? 'PENDIENTE_DATOS' : 'LISTA_PARA_PAGAR',
      vehiculo: `${v.marca} ${v.modelo} ${v.anio}`,
      uso: v.uso,
      aseguradora: orden.primaCotizada.plan.aseguradora.nombre,
      plan: orden.primaCotizada.plan.nombre,
      coberturas: orden.primaCotizada.plan.descripcion,
      prima: ctx.prima,
      descuento: ctx.descuento,
      primeraCompraEvaluada: !!v.cliente.numeroDocumento,
      primaFinal: pagado ? Number(orden.primaFinal) : ctx.primaFinal,
      canalVenta: pagado ? orden.canalVenta : ctx.canal,
      datosFaltantes: ctx.datosFaltantes,
      cliente: {
        nombres: v.cliente.nombres,
        apellidos: v.cliente.apellidos,
        numeroDocumento: v.cliente.numeroDocumento,
      },
      aceptaCondiciones: orden.aceptaCondiciones,
      firmaSimulada: orden.firmaSimulada,
      maxCuotas: ctx.parametros.maxCuotas,
      pagos: orden.pagos.map((p) => ({
        id: p.id,
        estado: p.estado,
        modo: p.modo,
        monto: Number(p.monto),
        numeroCuotas: p.numeroCuotas,
        fecha: p.fecha,
        cuotas: p.cuotas.map((q) => ({ numero: q.numero, monto: Number(q.monto), estado: q.estado })),
      })),
      poliza: orden.poliza
        ? { id: orden.poliza.id, numero: orden.poliza.numero, fechaEmision: orden.poliza.fechaEmision }
        : null,
    };
  }

  // CU-02 paso 3 / RNF-08: solo los datos que faltan para emitir. Aquí se evalúa la primera compra (D-18).
  async completarDatos(
    ordenId: string,
    usuario: UsuarioSesion,
    d: { numeroDocumento: string; apellidos: string },
  ) {
    await this.prisma.$transaction(async (tx) => {
      const orden = await this.cargarOrden(tx, ordenId, usuario);
      if (this.pagoConfirmado(orden)) throw new ConflictException('La orden ya fue pagada');
      await tx.cliente.update({
        where: { id: orden.cotizacion.vehiculo.clienteId },
        data: { numeroDocumento: d.numeroDocumento, apellidos: d.apellidos },
      });
      const actualizada = await this.cargarOrden(tx, ordenId, usuario);
      const ctx = await this.contexto(tx, actualizada);
      // RF-20: el descuento de primera compra queda registrado en la cotización
      await tx.descuento.deleteMany({ where: { cotizacionId: orden.cotizacionId, tipo: 'PRIMERA_COMPRA' } });
      if (ctx.primeraCompra !== null) {
        await tx.descuento.create({
          data: {
            cotizacionId: orden.cotizacionId,
            planId: orden.primaCotizada.planId,
            tipo: 'PRIMERA_COMPRA',
            porcentaje: Math.min(ctx.primeraCompra, Number(ctx.parametros.descuentoMaximo)),
            aceptado: true,
          },
        });
      }
      await tx.ordenCompra.update({ where: { id: ordenId }, data: { primaFinal: ctx.primaFinal } });
      await this.actividad.registrar('COMPLETAR_DATOS', `OrdenCompra#${ordenId}`, usuario.id, tx);
    });
    return this.resumen(ordenId, usuario);
  }

  private cronograma(total: number, modo: ModoPago, numeroCuotas: number | undefined, maxCuotas: number) {
    if (modo === 'UNICO') return [total];
    try {
      return calcularCronograma(total, numeroCuotas ?? 0, maxCuotas);
    } catch (e) {
      if (e instanceof CuotasInvalidasError)
        throw new BadRequestException({ mensaje: e.message, errores: { numeroCuotas: e.message } });
      throw e;
    }
  }

  // CU-02 paso 4: condiciones + firma simulada (RF-24) + modo de pago; devuelve el cronograma (RN-14).
  async confirmar(
    ordenId: string,
    usuario: UsuarioSesion,
    d: { aceptaCondiciones: boolean; firma: boolean; modo: ModoPago; numeroCuotas?: number },
  ) {
    const errores: Record<string, string> = {};
    if (!d.aceptaCondiciones) errores.aceptaCondiciones = 'Debes aceptar las condiciones';
    if (!d.firma) errores.firma = 'Debes firmar (firma simulada)';
    if (Object.keys(errores).length) throw new BadRequestException({ mensaje: 'Falta confirmar', errores });
    const orden = await this.cargarOrden(this.prisma, ordenId, usuario);
    const ctx = await this.contexto(this.prisma, orden);
    if (ctx.datosFaltantes.length)
      throw new UnprocessableEntityException('Completa tus datos antes de confirmar');
    const cronograma = this.cronograma(ctx.primaFinal, d.modo, d.numeroCuotas, ctx.parametros.maxCuotas);
    await this.prisma.ordenCompra.update({
      where: { id: ordenId },
      data: { aceptaCondiciones: true, firmaSimulada: true },
    });
    return { ...(await this.resumen(ordenId, usuario)), cronograma };
  }

  // CU-02 pasos 5–7: cobro → (pago + cuotas + emisión + póliza + PDF + estados) en UNA transacción (RNF-05).
  async pagar(ordenId: string, usuario: UsuarioSesion, d: { modo: ModoPago; numeroCuotas?: number }) {
    const orden = await this.cargarOrden(this.prisma, ordenId, usuario);
    if (this.pagoConfirmado(orden)) throw new ConflictException('La orden ya fue pagada');
    const ctx = await this.contexto(this.prisma, orden);
    if (ctx.datosFaltantes.length)
      throw new UnprocessableEntityException('Completa tus datos antes de pagar');
    if (!orden.aceptaCondiciones || !orden.firmaSimulada)
      throw new UnprocessableEntityException('Acepta las condiciones y firma antes de pagar');
    const cronograma = this.cronograma(ctx.primaFinal, d.modo, d.numeroCuotas, ctx.parametros.maxCuotas);
    const numeroCuotas = d.modo === 'CUOTAS' ? cronograma.length : null;

    // Paso 5: pasarela (externa). En CUOTAS se cobra la cuota 1 (D-13).
    const cobro = await this.pasarela.cobrar({ monto: cronograma[0], modo: d.modo, ordenId });
    if (!cobro.aprobado) {
      // 5a: pago rechazado → se registra y NO se emite; puede reintentar o cambiar el modo
      await this.prisma.$transaction(async (tx) => {
        await tx.pago.create({
          data: {
            ordenCompraId: ordenId,
            monto: ctx.primaFinal,
            modo: d.modo,
            numeroCuotas,
            estado: 'RECHAZADO',
            referencia: cobro.referencia,
            fecha: this.reloj.ahora(),
          },
        });
        await this.actividad.registrar('PAGO_RECHAZADO', `OrdenCompra#${ordenId}`, usuario.id, tx);
      });
      throw new HttpException(
        { mensaje: cobro.motivo ?? 'Pago rechazado', estado: 'RECHAZADO' },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    try {
      const polizaId = await this.prisma.$transaction(
        async (tx) => {
          const o = await this.cargarOrden(tx, ordenId, usuario);
          if (this.pagoConfirmado(o)) throw new ConflictException('La orden ya fue pagada');
          const c = await this.contexto(tx, o); // se recalcula dentro de la transacción
          if (c.primaFinal !== ctx.primaFinal) {
            throw new ConflictException(
              'El precio cambió mientras pagabas; revisa el resumen y vuelve a pagar',
            );
          }
          const ahora = this.reloj.ahora();
          // D-28: el canal y la prima definitivos se fijan aquí
          await tx.ordenCompra.update({
            where: { id: ordenId },
            data: { primaFinal: c.primaFinal, canalVenta: c.canal },
          });
          await tx.pago.create({
            data: {
              ordenCompraId: ordenId,
              monto: c.primaFinal, // D-40: el pago guarda el total
              modo: d.modo,
              numeroCuotas,
              estado: 'CONFIRMADO',
              referencia: cobro.referencia,
              fecha: ahora,
              cuotas: numeroCuotas
                ? {
                    create: cronograma.map((monto, i) => ({
                      numero: i + 1,
                      monto,
                      estado: i === 0 ? 'CONFIRMADO' : 'PENDIENTE',
                    })),
                  }
                : undefined,
            },
          });
          // Paso 6: emisión (externa simulada). Si falla, se lanza y se revierte TODO.
          const { numeroPoliza } = await this.emisor.emitir({
            codigoAseguradora: o.primaCotizada.plan.aseguradora.codigoEstrategia,
            ordenId,
            fecha: ahora,
          });
          const poliza = await tx.poliza.create({
            data: {
              ordenCompraId: ordenId,
              numero: numeroPoliza,
              fechaEmision: ahora,
              canalVenta: c.canal,
              archivoPdf: '',
            },
          });
          // Paso 7: PDF (RN-15: solo tras pago confirmado), estados y actividad
          const archivoPdf = await this.polizas.generarPdf(tx, poliza.id);
          await tx.poliza.update({ where: { id: poliza.id }, data: { archivoPdf } });
          await tx.cotizacion.update({ where: { id: o.cotizacionId }, data: { estado: 'CONVERTIDA' } });
          if (o.cotizacion.seguimiento) {
            await tx.seguimiento.update({
              where: { id: o.cotizacion.seguimiento.id },
              data: { estado: 'CONVERTIDO', fechaCierre: ahora },
            });
          }
          await this.actividad.registrar('PAGO_CONFIRMADO', `OrdenCompra#${ordenId}`, usuario.id, tx);
          await this.actividad.registrar('EMITIR_POLIZA', `Poliza#${poliza.id}`, usuario.id, tx);
          return poliza.id;
        },
        { timeout: 20_000 },
      );
      return { ...(await this.resumen(ordenId, usuario)), polizaId };
    } catch (e) {
      // Cualquier falla dentro de la transacción → rollback (no queda pago confirmado ni póliza) + anulación del cobro
      await this.pasarela.anular(cobro.referencia);
      if (e instanceof HttpException) throw e;
      // 6a: falla la emisión
      await this.actividad.registrar('EMISION_FALLIDA', `OrdenCompra#${ordenId}`, usuario.id);
      this.log.warn(`Emisión fallida en la orden ${ordenId}: ${(e as Error).message}`);
      throw new HttpException(
        {
          mensaje: 'La aseguradora no pudo emitir la póliza. No se realizó ningún cobro; intenta nuevamente.',
          estado: 'EMISION_FALLIDA',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
