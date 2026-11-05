import { Global, Module } from '@nestjs/common';
import { EMISOR_ASEGURADORA } from './aseguradora/emisor-aseguradora';
import { EmisorSimulado } from './aseguradora/emisor-simulado';
import { PASARELA_PAGO } from './pasarela/pasarela-pago';
import { PasarelaSimulada } from './pasarela/pasarela-simulada';
import { GENERADOR_PDF } from './pdf/generador-pdf';
import { GeneradorPdfKit } from './pdf/generador-pdfkit';
import { SimuladorFallos } from './simulacion/simulador-fallos';

// Lo externo siempre detrás de una interfaz (RNF-15). Cambiar a una pasarela real = otra clase aquí.
@Global()
@Module({
  providers: [
    SimuladorFallos,
    { provide: PASARELA_PAGO, useClass: PasarelaSimulada },
    { provide: EMISOR_ASEGURADORA, useClass: EmisorSimulado },
    { provide: GENERADOR_PDF, useClass: GeneradorPdfKit },
  ],
  exports: [SimuladorFallos, PASARELA_PAGO, EMISOR_ASEGURADORA, GENERADOR_PDF],
})
export class IntegracionModule {}
