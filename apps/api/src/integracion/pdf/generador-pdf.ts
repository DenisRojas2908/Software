// Puerto del generador de PDF (RF-25, RNF-15). D-05: pdfkit en disco; Supabase Storage sería otra implementación.
export const GENERADOR_PDF = Symbol('GENERADOR_PDF');

export const LEYENDA_DEMO = 'Documento de demostración sin validez legal';

export interface DatosPolizaPdf {
  numero: string;
  fechaEmision: Date;
  vigenciaHasta: Date;
  aseguradora: string;
  plan: string;
  coberturas: string;
  asegurado: string;
  documento: string;
  vehiculo: string;
  uso: string;
  primaBase: number;
  descuento: string;
  primaFinal: number;
  modoPago: string;
  cronograma: number[];
  canalVenta: string;
}

export interface GeneradorPdf {
  // Devuelve la ruta relativa del archivo (se guarda en poliza.archivo_pdf)
  generar(datos: DatosPolizaPdf): Promise<string>;
  rutaAbsoluta(rutaRelativa: string): string;
}
