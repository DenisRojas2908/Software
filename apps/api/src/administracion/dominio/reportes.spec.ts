import { agruparVentas, PolizaVendida } from './reportes';

const p = (
  canal: PolizaVendida['canal'],
  aseguradora: string,
  plan: string,
  primaFinal: number,
): PolizaVendida => ({ canal, aseguradora, plan, primaFinal });
const VENTAS = [
  p('AUTONOMO', 'Rímac', 'Full', 1957.5),
  p('AUTONOMO', 'Rímac', 'Básico', 1033.13),
  p('ASESORIA', 'Mapfre', 'Full', 1677.15),
];

describe('agruparVentas (RF-30)', () => {
  it('RF-30: por canal suma pólizas y prima final, e incluye los 3 canales', () => {
    expect(agruparVentas(VENTAS, 'canal')).toEqual([
      { grupo: 'AUTONOMO', polizas: 2, primaTotal: 2990.63 },
      { grupo: 'ASESORIA', polizas: 1, primaTotal: 1677.15 },
      { grupo: 'TELEMARKETING', polizas: 0, primaTotal: 0 },
    ]);
  });
  it('RF-30: por aseguradora', () => {
    expect(agruparVentas(VENTAS, 'aseguradora')).toEqual([
      { grupo: 'Rímac', polizas: 2, primaTotal: 2990.63 },
      { grupo: 'Mapfre', polizas: 1, primaTotal: 1677.15 },
    ]);
  });
  it('RF-30: por plan (aseguradora · plan)', () => {
    expect(agruparVentas(VENTAS, 'plan').map((f) => f.grupo)).toEqual([
      'Mapfre · Full',
      'Rímac · Básico',
      'Rímac · Full',
    ]);
  });
});
