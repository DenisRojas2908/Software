// Formatos y etiquetas visibles (textos de la UI en un solo lugar).
const soles = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
export const formatoSoles = (n: number) => soles.format(n);

export const ETIQUETA_CAMPO: Record<string, string> = {
  uso: 'Uso del vehículo',
  marca: 'Marca',
  modelo: 'Modelo',
  anio: 'Año',
  clase: 'Clase',
  tipo: 'Tipo',
  departamento: 'Departamento',
  provincia: 'Provincia',
  distrito: 'Distrito',
};
export const etiquetaCampo = (n: string) =>
  ETIQUETA_CAMPO[n] ?? n.charAt(0).toUpperCase() + n.slice(1).replace(/_/g, ' ');

export const ETIQUETA_VALOR: Record<string, string> = {
  PARTICULAR: 'Particular',
  COMERCIAL_LIGERO: 'Comercial ligero',
  TRANSPORTE_PASAJEROS: 'Transporte de pasajeros (taxi, colectivo, apps)',
  WHATSAPP: 'WhatsApp',
  LLAMADA: 'Llamada',
  AUTONOMO: 'Autónomo',
  ASESORIA: 'Asesoría',
  TELEMARKETING: 'Telemarketing',
};
export const etiquetaValor = (v: string) => ETIQUETA_VALOR[v] ?? v.replace(/_/g, ' ');

export const MOTIVO_BLOQUEO: Record<string, string> = {
  NO_COTIZA: 'Esta aseguradora no cotiza este vehículo en línea.',
  INSPECCION: 'Requiere inspección para este uso: solo con asesoría.',
};
