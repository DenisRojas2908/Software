import { CompraNoHabilitadaError, verificarCompraHabilitada } from './habilitacion';

describe('verificarCompraHabilitada (CU-02 1a)', () => {
  it('RN-01: plan con prima y sin bloqueo → se puede comprar', () => {
    expect(() =>
      verificarCompraHabilitada({ prima: 1450, motivoBloqueo: null, habilitadaPorAsesoria: false }),
    ).not.toThrow();
  });
  it('RF-10 / RN-03: con inspección no se compra en Opción 1', () => {
    expect(() =>
      verificarCompraHabilitada({ prima: 2592, motivoBloqueo: 'INSPECCION', habilitadaPorAsesoria: false }),
    ).toThrow(CompraNoHabilitadaError);
  });
  it('CU-03 paso 6: con inspección pero asesoría ACEPTA → se puede comprar', () => {
    expect(() =>
      verificarCompraHabilitada({ prima: 2592, motivoBloqueo: 'INSPECCION', habilitadaPorAsesoria: true }),
    ).not.toThrow();
  });
  it('RN-04: plan sin prima no se puede comprar', () => {
    expect(() =>
      verificarCompraHabilitada({ prima: null, motivoBloqueo: 'NO_COTIZA', habilitadaPorAsesoria: true }),
    ).toThrow(CompraNoHabilitadaError);
  });
});
