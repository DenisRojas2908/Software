import { UsoVehiculo } from '@prisma/client';

// RF-04 · Patrón Strategy: una implementación por aseguradora con una interfaz común.
// D-09: el diagrama dice cotizar(datos); como la prima se guarda por plan, la estrategia recibe también el plan.
export interface DatosVehiculo {
  uso: UsoVehiculo;
  marca: string;
  modelo: string;
  anio: number;
  clase?: string;
  tipo?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  adicionales?: Record<string, string | number>; // D-11
}

export interface PlanACotizar {
  id: string;
  nombre: string;
}

export interface EstrategiaCotizacion {
  /** = aseguradora.codigo_estrategia: así el catálogo encuentra su estrategia sin un switch (abierto/cerrado). */
  readonly codigo: string;
  /** Prima anual en soles, o null si esta aseguradora no cotiza ese vehículo/plan (RN-26: tarifa de prueba). */
  cotizar(datos: DatosVehiculo, plan: PlanACotizar): number | null;
}

// Token de inyección: el servicio recibe TODAS las estrategias registradas como un arreglo.
export const ESTRATEGIAS = Symbol('ESTRATEGIAS');
