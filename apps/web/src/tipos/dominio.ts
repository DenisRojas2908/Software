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
  motivoBloqueo: 'NO_COTIZA' | 'INSPECCION' | null;
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
