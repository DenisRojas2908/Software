import { CanalContacto, EstadoSeguimiento, MotivoCierre } from '@prisma/client';
import { sumarDias } from '../../../comun/reloj';

// Reglas del seguimiento de telemarketing (CU-04). Clase de dominio pura: no toca la BD.
export interface ReglasSeguimiento {
  maxIntentos: number; // RN-10 (parametros_comerciales.max_intentos)
  diasSeguimiento: number; // RN-10 (parametros_comerciales.dias_seguimiento)
  vigenciaEnlaceDias: number; // RN-12 (parametros_comerciales.vigencia_enlace_dias)
}

export interface DatosSeguimiento {
  estado: EstadoSeguimiento;
  intentos: number;
  fechaApertura: Date;
  canalPreferido: CanalContacto;
  motivoCierre?: MotivoCierre | null;
  enlaceToken?: string | null;
  enlaceExpiraEn?: Date | null;
}

export class SeguimientoCerradoError extends Error {}
export class ContactoNoPermitidoError extends Error {}
export class MotivoObligatorioError extends Error {}

export class Seguimiento {
  constructor(
    private readonly d: DatosSeguimiento,
    private readonly reglas: ReglasSeguimiento,
  ) {}

  get limite(): Date {
    return sumarDias(this.d.fechaApertura, this.reglas.diasSeguimiento);
  }

  get intentosRestantes(): number {
    return Math.max(0, this.reglas.maxIntentos - this.d.intentos);
  }

  // RN-10 / RNF-11: solo por el canal preferido, sin pasar el máximo de intentos ni la ventana de días.
  puedeContactar(canal: CanalContacto, ahora: Date): { permitido: boolean; motivo?: string } {
    if (this.d.estado !== 'EN_SEGUIMIENTO')
      return { permitido: false, motivo: 'El seguimiento ya está cerrado' };
    if (canal !== this.d.canalPreferido) {
      return {
        permitido: false,
        motivo: `Solo se puede contactar por el canal preferido (${this.d.canalPreferido})`,
      };
    }
    if (this.d.intentos >= this.reglas.maxIntentos) {
      return { permitido: false, motivo: `Se alcanzó el máximo de ${this.reglas.maxIntentos} intentos` };
    }
    if (ahora >= this.limite) {
      return { permitido: false, motivo: `Pasaron los ${this.reglas.diasSeguimiento} días de seguimiento` };
    }
    return { permitido: true };
  }

  // RN-10: al alcanzar el máximo (o vencer el plazo) el caso se cierra automáticamente.
  debeCerrarseAutomaticamente(ahora: Date): boolean {
    return (
      this.d.estado === 'EN_SEGUIMIENTO' &&
      (this.d.intentos >= this.reglas.maxIntentos || ahora >= this.limite)
    );
  }

  // RN-11 / D-37: todo cierre sin conversión exige motivo; queda DESCARTADO.
  cerrar(motivo: MotivoCierre | null | undefined, ahora: Date) {
    if (this.d.estado !== 'EN_SEGUIMIENTO')
      throw new SeguimientoCerradoError('El seguimiento ya está cerrado');
    if (!motivo) throw new MotivoObligatorioError('El motivo de cierre es obligatorio');
    return { estado: 'DESCARTADO' as const, motivoCierre: motivo, fechaCierre: ahora };
  }

  // RN-12: el enlace de retoma vence a los `vigenciaEnlaceDias` días.
  nuevoEnlace(token: string, ahora: Date) {
    return { enlaceToken: token, enlaceExpiraEn: sumarDias(ahora, this.reglas.vigenciaEnlaceDias) };
  }

  static enlaceVigente(expiraEn: Date | null | undefined, ahora: Date): boolean {
    return !!expiraEn && ahora < expiraEn;
  }
}
