import { evaluarNicho } from './evaluar-nicho';

describe('evaluarNicho (RN-05)', () => {
  it('RN-05: un camión está fuera de nicho', () => {
    expect(evaluarNicho({ uso: 'COMERCIAL_LIGERO', clase: 'CAMION' }, 1).dentro).toBe(false);
  });
  it('RN-05: bus y remolcador también (D-39)', () => {
    expect(evaluarNicho({ uso: 'TRANSPORTE_PASAJEROS', clase: 'BUS' }, 1).dentro).toBe(false);
    expect(evaluarNicho({ uso: 'COMERCIAL_LIGERO', clase: 'REMOLCADOR' }, 1).dentro).toBe(false);
  });
  it('RN-05: particular admite 2 vehículos por persona; el 3.º queda fuera', () => {
    expect(evaluarNicho({ uso: 'PARTICULAR', clase: 'SUV' }, 2).dentro).toBe(true);
    expect(evaluarNicho({ uso: 'PARTICULAR', clase: 'SUV' }, 3).dentro).toBe(false);
  });
  it('RN-05: comercial ligero admite 5; el 6.º queda fuera', () => {
    expect(evaluarNicho({ uso: 'COMERCIAL_LIGERO' }, 5).dentro).toBe(true);
    expect(evaluarNicho({ uso: 'COMERCIAL_LIGERO' }, 6).dentro).toBe(false);
  });
  it('D-26: sin clase capturada solo se evalúa el número de vehículos', () => {
    expect(evaluarNicho({ uso: 'PARTICULAR' }, 1).dentro).toBe(true);
  });
});
