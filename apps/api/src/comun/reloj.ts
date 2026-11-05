// Puerto Reloj (D-07, D-38): TODA regla de tiempo pide la hora aquí, nunca a `new Date()` directo.
// Así se puede adelantar el tiempo en la demo (F8) y fijarlo en las pruebas.
export const RELOJ = Symbol('RELOJ');

export interface Reloj {
  ahora(): Date;
}

const DIA_MS = 24 * 60 * 60 * 1000;

// Implementación del sistema: hora real + un desplazamiento que solo cambia el modo demo.
export class RelojSistema implements Reloj {
  private desplazamientoMs = 0;

  ahora(): Date {
    return new Date(Date.now() + this.desplazamientoMs);
  }

  adelantarDias(dias: number): void {
    this.desplazamientoMs += dias * DIA_MS;
  }

  reiniciar(): void {
    this.desplazamientoMs = 0;
  }

  get diasAdelantados(): number {
    return this.desplazamientoMs / DIA_MS;
  }
}

// Para pruebas: una hora fija que se puede mover a mano.
export class RelojFijo implements Reloj {
  private actual: Date;

  constructor(fecha: string | Date) {
    this.actual = new Date(fecha);
  }

  ahora(): Date {
    return new Date(this.actual);
  }

  adelantarDias(dias: number): void {
    this.actual = new Date(this.actual.getTime() + dias * DIA_MS);
  }
}

export function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getTime() + dias * DIA_MS);
}
