import { Injectable } from '@nestjs/common';

// Interruptores de la simulación (D-08, F8): permiten mostrar en la demo los caminos de error.
// Solo los cambia el panel de demo (DEMO_MODE) o las pruebas.
@Injectable()
export class SimuladorFallos {
  pagoRechazado = false;
  emisionFallida = false;
  aseguradoraCaida: string | null = null; // código de estrategia que "no responde"
  envioMensajeFallido = false;

  reiniciar() {
    this.pagoRechazado = false;
    this.emisionFallida = false;
    this.aseguradoraCaida = null;
    this.envioMensajeFallido = false;
  }
}
