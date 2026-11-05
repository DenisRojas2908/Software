// Tipos que la web recibe de la API (sin importar @prisma/client: el front no conoce la BD).
export type UsoVehiculo = 'PARTICULAR' | 'COMERCIAL_LIGERO' | 'TRANSPORTE_PASAJEROS';
export type CanalContacto = 'LLAMADA' | 'WHATSAPP';
export type TipoCampo = 'TEXTO' | 'NUMERO' | 'LISTA';

export interface CampoFormulario {
  nombre: string;
  tipo: TipoCampo;
  obligatorio: boolean;
  valores: string[];
  base: boolean;
}

export interface PlanCotizado {
  primaCotizadaId: string;
  planId: string;
  nombre: string;
  descripcion: string;
  prima: number | null;
  compraInmediata: boolean;
  asesoria: boolean;
  motivoBloqueo: 'NO_COTIZA' | 'INSPECCION' | 'ASESORIA_PENDIENTE' | null;
  habilitadaPorAsesoria?: boolean; // D-30
}

export interface AseguradoraCotizada {
  id: string;
  nombre: string;
  cotiza: boolean;
  planes: PlanCotizado[];
}

export interface Cotizacion {
  id: string;
  fecha: string;
  estado: 'REGISTRADA' | 'CONVERTIDA' | 'NO_CONCRETADA';
  opciones: ('COMPRA_INMEDIATA' | 'ASESORIA')[];
  motivoDerivacion: string | null;
  mensajeDerivacion: string | null;
  tieneDueno: boolean;
  contacto: { nombres: string; canalPreferido: CanalContacto };
  vehiculo: { uso: UsoVehiculo; marca: string; modelo: string; anio: number; clase: string | null };
  solicitudAbierta: { id: string; motivo: string; estado: string } | null;
  aseguradoras: AseguradoraCotizada[];
}

export interface ResumenOrden {
  id: string;
  cotizacionId: string;
  estado: 'PENDIENTE_DATOS' | 'LISTA_PARA_PAGAR' | 'PAGADA';
  vehiculo: string;
  uso: UsoVehiculo;
  aseguradora: string;
  plan: string;
  coberturas: string;
  prima: number;
  descuento: { tipo: 'PRIMERA_COMPRA' | 'NEGOCIADO' | null; porcentaje: number };
  primeraCompraEvaluada: boolean;
  primaFinal: number;
  canalVenta: string;
  datosFaltantes: string[];
  cliente: { nombres: string; apellidos: string | null; numeroDocumento: string | null };
  aceptaCondiciones: boolean;
  firmaSimulada: boolean;
  maxCuotas: number;
  pagos: { id: string; estado: string; modo: string; monto: number; numeroCuotas: number | null }[];
  poliza: { id: string; numero: string; fechaEmision: string } | null;
  cronograma?: number[];
  polizaId?: string;
}

export interface Tramite {
  cotizacionId: string;
  fecha: string;
  vehiculo: string;
  estado: string;
  motivoDerivacion: string | null;
  solicitud: { estado: string; motivo: string } | null;
  orden: {
    id: string;
    aseguradora: string;
    plan: string;
    primaFinal: number;
    pago: {
      estado: string;
      modo: string;
      cuotas: { numero: number; monto: number; estado: string }[];
    } | null;
  } | null;
  poliza: {
    id: string;
    numero: string;
    fechaEmision: string;
    vigenciaHasta: string;
    canalVenta: string;
  } | null;
}
