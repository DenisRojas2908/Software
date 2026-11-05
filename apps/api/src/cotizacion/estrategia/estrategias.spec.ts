import { RelojFijo } from '../../comun/reloj';
import { DatosVehiculo } from './estrategia-cotizacion';
import {
  EstrategiaLaPositiva,
  EstrategiaMapfre,
  EstrategiaPacifico,
  EstrategiaQualitas,
  EstrategiaRimac,
} from './estrategias';

// Valores esperados calculados a mano con la fórmula de 02 §10 (año actual 2026).
const reloj = new RelojFijo('2026-11-05T12:00:00Z');
const plan = (nombre: string) => ({ id: nombre, nombre });
const auto = (d: Partial<DatosVehiculo> = {}): DatosVehiculo => ({
  uso: 'PARTICULAR',
  marca: 'Toyota',
  modelo: 'Yaris',
  anio: 2022,
  ...d,
});

describe('Estrategias de cotización (RF-04, RN-26)', () => {
  it('RN-18: Rímac, particular 2022 → Básico 1087.50 · Intermedio 1450.00 · Full 1957.50', () => {
    const e = new EstrategiaRimac(reloj);
    expect(e.cotizar(auto(), plan('Básico'))).toBe(1087.5);
    expect(e.cotizar(auto(), plan('Intermedio'))).toBe(1450);
    expect(e.cotizar(auto(), plan('Full'))).toBe(1957.5);
  });

  it('RN-18: Rímac no cotiza autos de más de 15 años (2009 → 17 años)', () => {
    expect(new EstrategiaRimac(reloj).cotizar(auto({ anio: 2009 }), plan('Intermedio'))).toBeNull();
  });

  it('RN-19: Pacífico aplica 10 % en Lima (Full 2022 → 2049.30) y no en Arequipa (Básico 2015 → 983.25)', () => {
    const e = new EstrategiaPacifico(reloj);
    expect(e.cotizar(auto({ departamento: 'Lima' }), plan('Full'))).toBe(2049.3);
    expect(e.cotizar(auto({ anio: 2015, departamento: 'Arequipa' }), plan('Básico'))).toBe(983.25);
  });

  it('RN-20: La Positiva aplica recargo por clase (SUV Básico 1112.63 · PICK_UP Full 2020 → 2089.80)', () => {
    const e = new EstrategiaLaPositiva(reloj);
    expect(e.cotizar(auto({ clase: 'SUV' }), plan('Básico'))).toBe(1112.63);
    expect(e.cotizar(auto({ clase: 'PICK_UP', anio: 2020 }), plan('Full'))).toBe(2089.8);
  });

  it('RN-20: La Positiva no cotiza 2009 (17 años > 16)', () => {
    expect(new EstrategiaLaPositiva(reloj).cotizar(auto({ anio: 2009 }), plan('Básico'))).toBeNull();
  });

  it('RN-21: Mapfre, comercial ligero 2024 Intermedio → 1856.25 (factor uso 1,25 × antigüedad 1,10)', () => {
    expect(
      new EstrategiaMapfre(reloj).cotizar(auto({ uso: 'COMERCIAL_LIGERO', anio: 2024 }), plan('Intermedio')),
    ).toBe(1856.25);
  });

  it('RN-22: Quálitas, taxi 2022 Full → 2592.00 (factor uso 1,60)', () => {
    expect(new EstrategiaQualitas(reloj).cotizar(auto({ uso: 'TRANSPORTE_PASAJEROS' }), plan('Full'))).toBe(
      2592,
    );
  });

  it('RN-04: un auto 2003 (23 años) no lo cotiza ninguna aseguradora', () => {
    const todas = [
      EstrategiaRimac,
      EstrategiaPacifico,
      EstrategiaLaPositiva,
      EstrategiaMapfre,
      EstrategiaQualitas,
    ];
    for (const E of todas) expect(new E(reloj).cotizar(auto({ anio: 2003 }), plan('Básico'))).toBeNull();
  });

  it('D-48: un modelo del año siguiente (2027) cotiza como 0 años → Rímac Intermedio 1595.00 (factor 1,10)', () => {
    expect(new EstrategiaRimac(reloj).cotizar(auto({ anio: 2027 }), plan('Intermedio'))).toBe(1595);
  });

  it('D-10: un plan sin factor de tarifa no cotiza', () => {
    expect(new EstrategiaMapfre(reloj).cotizar(auto(), plan('Premium'))).toBeNull();
  });
});
