import { createWriteStream, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { DatosPolizaPdf, GeneradorPdf, LEYENDA_DEMO } from './generador-pdf';

const soles = (n: number) =>
  `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fecha = (d: Date) => d.toISOString().slice(0, 10);

// RF-25 / RN-15 / RNF-20: PDF de la póliza con marca de agua y pie "Documento de demostración sin validez legal".
@Injectable()
export class GeneradorPdfKit implements GeneradorPdf {
  private readonly base = process.env.STORAGE_DIR ?? join(process.cwd(), 'storage');

  rutaAbsoluta(rutaRelativa: string): string {
    return join(this.base, rutaRelativa.replace(/^storage[\\/]/, ''));
  }

  generar(d: DatosPolizaPdf): Promise<string> {
    const relativa = `storage/polizas/${d.numero}.pdf`;
    const destino = this.rutaAbsoluta(relativa);
    mkdirSync(dirname(destino), { recursive: true });
    // compress: false → sin zlib (evita un fallo nativo de zlib dentro de Jest; el PDF pesa unos KB más)
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      compress: false,
      info: { Title: `Póliza ${d.numero} (demostración)` },
    });
    const salida = createWriteStream(destino);
    doc.pipe(salida);

    // Marca de agua y pie en TODAS las páginas (RNF-20)
    // (con margen inferior 0 mientras se escribe el pie, para no provocar otra página)
    const marcar = () => {
      const margenInferior = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.save();
      doc
        .rotate(-35, { origin: [300, 420] })
        .fontSize(34)
        .fillColor('#dc2626')
        .opacity(0.15);
      doc.text(LEYENDA_DEMO.toUpperCase(), 40, 400, { width: 560, align: 'center', lineBreak: false });
      doc.restore();
      doc.opacity(1).fillColor('#475569').fontSize(9);
      doc.text(`${LEYENDA_DEMO} · SVAS, simulación académica SI707V UNI-FIIS`, 50, 805, {
        width: 495,
        align: 'center',
        lineBreak: false,
      });
      doc.page.margins.bottom = margenInferior;
      doc.fillColor('#0f172a').fontSize(11);
      doc.x = 50;
      doc.y = 60;
    };
    doc.on('pageAdded', marcar);
    marcar();

    doc.fontSize(18).text('SVAS — Póliza de seguro vehicular', { align: 'left' });
    doc.fontSize(10).fillColor('#dc2626').text(LEYENDA_DEMO).fillColor('#0f172a').moveDown();
    const fila = (k: string, v: string) =>
      doc.fontSize(11).text(`${k}: `, { continued: true }).font('Helvetica-Bold').text(v).font('Helvetica');
    fila('Número de póliza', d.numero);
    fila('Aseguradora', d.aseguradora);
    fila('Plan', d.plan);
    fila('Emisión', fecha(d.fechaEmision));
    fila('Vigencia hasta', fecha(d.vigenciaHasta));
    doc.moveDown();
    fila('Asegurado', d.asegurado);
    fila('Documento', d.documento);
    fila('Vehículo', d.vehiculo);
    fila('Uso', d.uso);
    doc.moveDown();
    fila('Prima base', soles(d.primaBase));
    fila('Descuento', d.descuento);
    fila('Prima final', soles(d.primaFinal));
    fila('Forma de pago', d.modoPago);
    if (d.cronograma.length > 1) {
      doc.moveDown(0.5).fontSize(11).text('Cronograma de cuotas:');
      d.cronograma.forEach((m, i) => doc.fontSize(10).text(`  Cuota ${i + 1}: ${soles(m)}`));
    }
    fila('Canal de venta', d.canalVenta);
    doc.moveDown().fontSize(10).text(`Coberturas: ${d.coberturas}`);
    doc
      .moveDown()
      .fontSize(9)
      .fillColor('#475569')
      .text('Tarifas y número de póliza de prueba (RN-26). Firma simulada (RF-24).');
    doc.end();

    return new Promise((resolve, reject) => {
      salida.on('finish', () => resolve(relativa));
      salida.on('error', reject);
    });
  }
}
