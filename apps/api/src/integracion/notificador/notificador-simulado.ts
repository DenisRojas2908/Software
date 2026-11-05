import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, Reloj } from '../../comun/reloj';
import { SimuladorFallos } from '../simulacion/simulador-fallos';
import { EnvioFallidoError, MensajeCliente, Notificador } from './notificador';

// Simulado: no envía nada real. El "buzón de demo" muestra lo que se habría enviado (D-06, D-34).
@Injectable()
export class NotificadorSimulado implements Notificador {
  readonly enviados: (MensajeCliente & { fecha: Date })[] = [];

  constructor(
    private readonly fallos: SimuladorFallos,
    @Inject(RELOJ) private readonly reloj: Reloj,
  ) {}

  async enviar(m: MensajeCliente): Promise<void> {
    if (this.fallos.envioMensajeFallido)
      throw new EnvioFallidoError('El proveedor de mensajería no respondió (simulado)');
    this.enviados.push({ ...m, fecha: this.reloj.ahora() });
  }
}
