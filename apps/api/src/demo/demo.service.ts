import { Inject, Injectable } from '@nestjs/common';
import { RetencionService } from '../asesoria-retencion/retencion/retencion.service';
import { RELOJ, Reloj } from '../comun/reloj';
import { SimuladorFallos } from '../integracion/simulacion/simulador-fallos';
import { PrismaService } from '../persistencia/prisma.service';
import { sembrar } from '../persistencia/seed-datos';

// El reloj de la demo se puede adelantar (RelojSistema en ejecución, RelojFijo en pruebas).
type RelojAjustable = Reloj & { adelantarDias(d: number): void; reiniciar(): void; diasAdelantados: number };

@Injectable()
export class DemoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fallos: SimuladorFallos,
    private readonly retencion: RetencionService,
    @Inject(RELOJ) private readonly reloj: RelojAjustable,
  ) {}

  estado() {
    const { pagoRechazado, emisionFallida, aseguradoraCaida, envioMensajeFallido } = this.fallos;
    return {
      ahora: this.reloj.ahora(),
      diasAdelantados: this.reloj.diasAdelantados,
      fallos: { pagoRechazado, emisionFallida, aseguradoraCaida, envioMensajeFallido },
    };
  }

  // D-07: adelantar días para mostrar los 7 días de seguimiento y el enlace vencido
  adelantar(dias: number) {
    this.reloj.adelantarDias(dias);
    return { ...this.estado(), mensaje: `Reloj adelantado ${dias} día(s)` };
  }

  reiniciarReloj() {
    this.reloj.reiniciar();
    return { ...this.estado(), mensaje: 'Reloj de vuelta a hoy' };
  }

  fijarFallos(
    d: Partial<
      Pick<SimuladorFallos, 'pagoRechazado' | 'emisionFallida' | 'envioMensajeFallido' | 'aseguradoraCaida'>
    >,
  ) {
    Object.assign(this.fallos, d);
    return this.estado();
  }

  // D-12: botón de demo que hace lo mismo que el job de cada minuto
  async procesarAbandonos() {
    const r = await this.retencion.procesar();
    return {
      ...r,
      mensaje: `${r.abandonos} cotización(es) pasaron a seguimiento; ${r.cerradosAutomaticamente} seguimiento(s) se cerraron solos`,
    };
  }

  // D-06 / D-34: lo que el notificador "habría enviado", reconstruido desde la BD (sobrevive a reinicios)
  async buzon() {
    const registros = await this.prisma.registroActividad.findMany({
      where: {
        accion: {
          in: [
            'MENSAJE_FINAL_ENVIADO',
            'MENSAJE_FINAL_FALLIDO',
            'ENLACE_RETOMA_ENVIADO',
            'ENLACE_RETOMA_FALLIDO',
          ],
        },
      },
      orderBy: { fecha: 'desc' },
      take: 50,
    });
    const ids = registros.map((r) => r.entidad.replace('Seguimiento#', ''));
    const seguimientos = await this.prisma.seguimiento.findMany({
      where: { id: { in: ids } },
      include: { cotizacion: { include: { vehiculo: { include: { cliente: true } } } } },
    });
    const ahora = this.reloj.ahora();
    return registros.flatMap((r) => {
      const s = seguimientos.find((x) => `Seguimiento#${x.id}` === r.entidad);
      if (!s) return [];
      const cli = s.cotizacion.vehiculo.cliente;
      return [
        {
          fecha: r.fecha,
          tipo: r.accion.startsWith('MENSAJE_FINAL') ? 'MENSAJE_FINAL' : 'ENLACE_RETOMA',
          resultado: r.accion.endsWith('ENVIADO') ? 'ENVIADO' : 'FALLIDO',
          canal: cli.canalPreferido,
          telefono: cli.telefono,
          cliente: cli.nombres,
          enlace: s.enlaceToken ? `/retomar/${s.enlaceToken}` : null,
          vigente: !!s.enlaceExpiraEn && ahora < s.enlaceExpiraEn,
        },
      ];
    });
  }

  // Deja la BD como recién sembrada (los usuarios demo se recrean: hay que volver a ingresar)
  async reiniciarBd() {
    this.reloj.reiniciar();
    await sembrar(this.prisma, this.reloj.ahora());
    this.fallos.reiniciar();
    return { mensaje: 'BD reiniciada con el seed de demo. Vuelve a ingresar.' };
  }
}
