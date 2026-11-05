import { CanalVenta } from '@prisma/client';
import { redondear2 } from '../../comun/dinero';

// RF-30: ventas (número de pólizas y suma de prima final) por canal, aseguradora o plan, en un periodo.
export type CriterioReporte = 'canal' | 'aseguradora' | 'plan';

export interface PolizaVendida {
  canal: CanalVenta;
  aseguradora: string;
  plan: string;
  primaFinal: number;
}

export interface FilaReporte {
  grupo: string;
  polizas: number;
  primaTotal: number;
}

export function agruparVentas(polizas: PolizaVendida[], criterio: CriterioReporte): FilaReporte[] {
  const clave = (p: PolizaVendida) =>
    criterio === 'canal'
      ? p.canal
      : criterio === 'aseguradora'
        ? p.aseguradora
        : `${p.aseguradora} · ${p.plan}`;
  const mapa = new Map<string, FilaReporte>();
  for (const p of polizas) {
    const k = clave(p);
    const fila = mapa.get(k) ?? { grupo: k, polizas: 0, primaTotal: 0 };
    fila.polizas += 1;
    fila.primaTotal = redondear2(fila.primaTotal + p.primaFinal);
    mapa.set(k, fila);
  }
  // Los 3 canales siempre aparecen (aunque tengan 0) para comparar
  if (criterio === 'canal') {
    for (const c of ['AUTONOMO', 'ASESORIA', 'TELEMARKETING'])
      if (!mapa.has(c)) mapa.set(c, { grupo: c, polizas: 0, primaTotal: 0 });
  }
  return [...mapa.values()].sort((a, b) => b.polizas - a.polizas || a.grupo.localeCompare(b.grupo));
}
