import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RegistroActividadService } from '../comun/registro-actividad.service';
import { RELOJ, Reloj } from '../comun/reloj';
import { CatalogoService } from '../dominio-compartido/catalogo/catalogo.service';
import { validarContraCatalogo } from '../dominio-compartido/catalogo/formulario';
import {
  Contacto,
  DatosVehiculoRegistro,
  RegistroUnicoService,
} from '../dominio-compartido/cliente/registro-unico.service';
import { SimuladorFallos } from '../integracion/simulacion/simulador-fallos';
import { PrismaService } from '../persistencia/prisma.service';
import { UsuarioSesion } from '../seguridad/decoradores';
import { verificarPropiedad } from '../seguridad/propiedad';
import { habilitadaPorAsesoria } from '../compra/dominio/habilitada-por-asesoria';
import { DERIVADOR_CASOS, DerivadorCasos } from './derivador-casos';
import { calcularOpciones } from './dominio/calcular-opciones';
import { evaluarNicho } from './dominio/evaluar-nicho';
import { ESTRATEGIAS, EstrategiaCotizacion } from './estrategia/estrategia-cotizacion';

const COLUMNAS_VEHICULO = [
  'uso',
  'marca',
  'modelo',
  'anio',
  'clase',
  'tipo',
  'departamento',
  'provincia',
  'distrito',
];

export const MENSAJE_DERIVACION = {
  INSPECCION: 'Tu vehículo requiere inspección para este uso: un asesor revisará tu caso.',
  NO_ASEGURABLE: 'Ninguna aseguradora puede cotizarlo en línea: un asesor lo cotizará manualmente.',
};

// CU-01: el servicio ORQUESTA (valida, registra, recorre estrategias, deriva). Las reglas viven en el dominio.
@Injectable()
export class CotizacionService {
  private readonly log = new Logger(CotizacionService.name);
  private readonly estrategias: Map<string, EstrategiaCotizacion>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogo: CatalogoService,
    private readonly registroUnico: RegistroUnicoService,
    private readonly actividad: RegistroActividadService,
    @Inject(RELOJ) private readonly reloj: Reloj,
    @Inject(ESTRATEGIAS) estrategias: EstrategiaCotizacion[],
    @Inject(DERIVADOR_CASOS) private readonly derivador: DerivadorCasos,
    private readonly fallos: SimuladorFallos,
  ) {
    // Strategy: el servicio no sabe qué aseguradora es cada estrategia; las busca por código del catálogo.
    this.estrategias = new Map(estrategias.map((e) => [e.codigo, e]));
  }

  async cotizar(contacto: Contacto, datos: Record<string, unknown>, usuario?: UsuarioSesion) {
    // 1. RF-03: validar contra el catálogo (errores por campo; la web conserva lo ingresado)
    const campos = await this.catalogo.formulario();
    const errores = validarContraCatalogo(campos, datos, this.reloj.ahora().getFullYear());
    if (Object.keys(errores).length)
      throw new BadRequestException({ mensaje: 'Revisa los datos del vehículo', errores });
    const vehiculo = this.normalizar(
      datos,
      campos.map((c) => c.nombre),
    );

    // Lecturas del catálogo y cálculo de primas ANTES de abrir la transacción: así la transacción solo escribe
    // y no ocupa una segunda conexión del pool (hallazgo de la prueba de carga de F9).
    // 4. RF-04 / RF-05: prima por aseguradora activa × plan activo
    const [aseguradoras, inspeccion] = await Promise.all([
      this.catalogo.aseguradorasActivas(),
      this.catalogo.aseguradorasConInspeccion(vehiculo.uso),
    ]);
    const primas = aseguradoras.flatMap((a) =>
      a.planes.map((plan) => ({
        aseguradoraId: a.id,
        planId: plan.id,
        prima: this.primaSegura(a.codigoEstrategia, vehiculo, plan),
      })),
    );
    // 5-7. RN-01…RN-04, RN-25: opciones por plan y derivación automática
    const resultado = calcularOpciones(primas, inspeccion);

    return this.prisma.$transaction(async (tx) => {
      // 2. RN-05: nicho → se informa y NO se registra nada
      const previo = await this.registroUnico.buscarCliente(tx, contacto, usuario);
      const nicho = evaluarNicho(
        vehiculo,
        await this.registroUnico.vehiculosConUso(tx, previo?.id, vehiculo),
      );
      if (!nicho.dentro) return { fueraDeNicho: true as const, mensaje: nicho.mensaje };

      // 3. RF-07: registro único de cliente y vehículo
      const { cliente, vehiculo: v } = await this.registroUnico.registrar(tx, contacto, vehiculo, usuario);

      const cotizacion = await tx.cotizacion.create({
        data: {
          fecha: this.reloj.ahora(),
          vehiculoId: v.id,
          motivoDerivacion: resultado.motivoDerivacion,
          opciones: { create: resultado.opciones.map((opcion) => ({ opcion })) }, // D-17
          primas: {
            create: primas.map((p) => ({ planId: p.planId, prima: p.prima, disponible: p.prima !== null })),
          },
        },
      });
      if (resultado.motivoDerivacion) {
        await this.derivador.derivar(cotizacion.id, resultado.motivoDerivacion, cliente.canalPreferido, tx);
      }
      await this.actividad.registrar('COTIZAR', `Cotizacion#${cotizacion.id}`, usuario?.id ?? null, tx); // RNF-12
      return { fueraDeNicho: false as const, id: cotizacion.id };
    });
  }

  // RF-05 / CU-01 4a: si una estrategia falla (aseguradora caída) se trata como "no cotiza" (D-41)
  private primaSegura(codigo: string, datos: DatosVehiculoRegistro, plan: { id: string; nombre: string }) {
    const estrategia = this.estrategias.get(codigo);
    if (!estrategia) return null;
    try {
      if (this.fallos.aseguradoraCaida === codigo) throw new Error('aseguradora caída (simulada)');
      return estrategia.cotizar(datos, plan);
    } catch (e) {
      this.log.warn(`La estrategia ${codigo} no respondió: ${(e as Error).message}`);
      return null;
    }
  }

  private normalizar(datos: Record<string, unknown>, nombres: string[]): DatosVehiculoRegistro {
    const texto = (k: string) =>
      datos[k] === undefined || datos[k] === '' ? undefined : String(datos[k]).trim();
    const adicionales: Record<string, string | number> = {};
    for (const n of nombres)
      if (!COLUMNAS_VEHICULO.includes(n) && texto(n) !== undefined) adicionales[n] = texto(n)!; // D-11
    return {
      uso: texto('uso') as DatosVehiculoRegistro['uso'],
      marca: texto('marca')!,
      modelo: texto('modelo')!,
      anio: Number(datos.anio),
      clase: texto('clase'),
      tipo: texto('tipo'),
      departamento: texto('departamento'),
      provincia: texto('provincia'),
      distrito: texto('distrito'),
      adicionales,
    };
  }

  // Comparativo (RF-05, RF-08): aseguradoras × planes con prima y opciones habilitadas POR PLAN (D-17).
  // `porEnlace`: acceso con un enlace de retoma válido (el token hace de credencial, RN-12)
  async detalle(id: string, usuario?: UsuarioSesion, opciones: { porEnlace?: boolean } = {}) {
    const c = await this.prisma.cotizacion.findUnique({
      where: { id },
      include: {
        vehiculo: { include: { cliente: true, ubicacion: true } },
        opciones: true,
        // orden estable: aseguradora y luego plan
        primas: {
          include: { plan: { include: { aseguradora: true } } },
          orderBy: [{ plan: { aseguradora: { nombre: 'asc' } } }, { plan: { nombre: 'asc' } }],
        },
        solicitudes: { orderBy: { fechaCreacion: 'desc' } },
        descuentos: true,
      },
    });
    if (!c) throw new NotFoundException('Cotización no encontrada');
    if (!opciones.porEnlace)
      verificarPropiedad(usuario, c.vehiculo.cliente.usuarioId, { permitirSinDueno: true }); // RF-32, D-36

    const inspeccion = await this.catalogo.aseguradorasConInspeccion(c.vehiculo.uso);
    const primas = c.primas.map((p) => ({
      aseguradoraId: p.plan.aseguradoraId,
      planId: p.planId,
      prima: p.prima === null ? null : Number(p.prima),
    }));
    const { porPlan } = calcularOpciones(primas, inspeccion);

    const aseguradoras = new Map<
      string,
      { id: string; nombre: string; cotiza: boolean; planes: unknown[] }
    >();
    c.primas.forEach((p, i) => {
      const a = p.plan.aseguradora;
      const grupo = aseguradoras.get(a.id) ?? { id: a.id, nombre: a.nombre, cotiza: false, planes: [] };
      grupo.cotiza ||= p.disponible;
      grupo.planes.push({
        primaCotizadaId: p.id,
        nombre: p.plan.nombre,
        descripcion: p.plan.descripcion,
        prima: p.prima === null ? null : Number(p.prima),
        ...porPlan[i],
        // D-30: tras una asesoría aceptada el plan se puede comprar aunque exija inspección
        habilitadaPorAsesoria:
          p.prima !== null && habilitadaPorAsesoria(c.solicitudes, c.descuentos, p.planId),
      });
      aseguradoras.set(a.id, grupo);
    });

    const v = c.vehiculo;
    return {
      id: c.id,
      fecha: c.fecha,
      estado: c.estado,
      opciones: c.opciones.map((o) => o.opcion),
      motivoDerivacion: c.motivoDerivacion,
      mensajeDerivacion: c.motivoDerivacion
        ? MENSAJE_DERIVACION[c.motivoDerivacion as keyof typeof MENSAJE_DERIVACION]
        : null,
      tieneDueno: c.vehiculo.cliente.usuarioId !== null,
      contacto: { nombres: v.cliente.nombres, canalPreferido: v.cliente.canalPreferido },
      vehiculo: {
        uso: v.uso,
        marca: v.marca,
        modelo: v.modelo,
        anio: v.anio,
        clase: v.clase,
        tipo: v.tipo,
        ubicacion: v.ubicacion,
        adicionales: v.datosAdicionales as Prisma.JsonObject,
      },
      solicitudAbierta: c.solicitudes.find((s) => s.estado !== 'CERRADA') ?? null,
      aseguradoras: [...aseguradoras.values()],
    };
  }
}
