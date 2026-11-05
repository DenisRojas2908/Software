import { UsoVehiculo } from '@prisma/client';
import { redondear2 } from '../../comun/dinero';

// RN-26: tarifas de PRUEBA (ficticias, 02 §10). Simulan el cotizador externo de cada aseguradora,
// por eso viven aquí y no en parametros_comerciales (que es configuración comercial del bróker).
// prima = tarifaBase × factorPlan × factorUso × factorAntiguedad × recargoPropio

// D-10: el factor del plan va por su nombre; un plan sin factor no cotiza.
export const FACTOR_PLAN: Record<string, number> = { Básico: 0.75, Intermedio: 1.0, Full: 1.35 };

export const FACTOR_USO: Record<UsoVehiculo, number> = {
  PARTICULAR: 1.0,
  COMERCIAL_LIGERO: 1.25,
  TRANSPORTE_PASAJEROS: 1.6,
};

export function factorAntiguedad(anios: number): number {
  if (anios <= 3) return 1.1;
  if (anios <= 10) return 1.0;
  return 0.95;
}

export interface TarifaAseguradora {
  tarifaBase: number;
  antiguedadMaxima: number;
}

export function primaDePrueba(
  tarifa: TarifaAseguradora,
  plan: { nombre: string },
  uso: UsoVehiculo,
  anio: number,
  anioActual: number,
  recargoPropio = 1,
): number | null {
  const factorPlan = FACTOR_PLAN[plan.nombre];
  // D-48: un modelo del año siguiente (se valida hasta año actual + 1) cuenta como 0 años
  const antiguedad = Math.max(0, anioActual - anio);
  if (factorPlan === undefined || antiguedad > tarifa.antiguedadMaxima) return null;
  return redondear2(
    tarifa.tarifaBase * factorPlan * FACTOR_USO[uso] * factorAntiguedad(antiguedad) * recargoPropio,
  );
}
