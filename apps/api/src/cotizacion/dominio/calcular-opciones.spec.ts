import { calcularOpciones, PrimaPlan } from './calcular-opciones';

const p = (aseguradoraId: string, planId: string, prima: number | null): PrimaPlan => ({
  aseguradoraId,
  planId,
  prima,
});
const sinInspeccion = new Set<string>();

describe('calcularOpciones (RF-08, RF-10)', () => {
  it('RN-01: particular con cotización estándar → Opción 1 habilitada y Opción 2 visible', () => {
    const r = calcularOpciones([p('RIMAC', 'r1', 1450), p('MAPFRE', 'm1', 1350)], sinInspeccion);
    expect(r.opciones).toEqual(['COMPRA_INMEDIATA', 'ASESORIA']);
    expect(r.porPlan.every((x) => x.compraInmediata && x.asesoria)).toBe(true);
    expect(r.motivoDerivacion).toBeNull();
  });

  it('RN-02: comercial ligero que la aseguradora cotiza sin evaluación → Opción 1 con la prima publicada', () => {
    const r = calcularOpciones([p('MAPFRE', 'm2', 1856.25)], sinInspeccion);
    expect(r.porPlan[0]).toEqual({
      planId: 'm2',
      compraInmediata: true,
      asesoria: true,
      motivoBloqueo: null,
    });
  });

  it('RN-03 / RN-25: si todas exigen inspección (taxi) → solo Opción 2 y derivación INSPECCION', () => {
    const r = calcularOpciones(
      [p('RIMAC', 'r1', 2320), p('MAPFRE', 'm1', 2160)],
      new Set(['RIMAC', 'MAPFRE']),
    );
    expect(r.opciones).toEqual(['ASESORIA']);
    expect(r.motivoDerivacion).toBe('INSPECCION');
    expect(r.porPlan.map((x) => x.motivoBloqueo)).toEqual(['INSPECCION', 'INSPECCION']);
  });

  it('RN-25: la inspección es por aseguradora: si solo una la exige, las demás siguen con Opción 1', () => {
    const r = calcularOpciones([p('RIMAC', 'r1', 2320), p('MAPFRE', 'm1', 2160)], new Set(['RIMAC']));
    expect(r.porPlan[0].compraInmediata).toBe(false);
    expect(r.porPlan[1].compraInmediata).toBe(true);
    expect(r.motivoDerivacion).toBeNull();
  });

  it('RN-04: ninguna prima disponible → solo Opción 2 y derivación NO_ASEGURABLE', () => {
    const r = calcularOpciones([p('RIMAC', 'r1', null), p('MAPFRE', 'm1', null)], sinInspeccion);
    expect(r.opciones).toEqual(['ASESORIA']);
    expect(r.motivoDerivacion).toBe('NO_ASEGURABLE');
  });

  it('CU-01 4a: si una aseguradora no cotiza, las demás se muestran igual', () => {
    const r = calcularOpciones([p('RIMAC', 'r1', null), p('MAPFRE', 'm1', 1350)], sinInspeccion);
    expect(r.porPlan[0]).toMatchObject({ compraInmediata: false, motivoBloqueo: 'NO_COTIZA' });
    expect(r.porPlan[1].compraInmediata).toBe(true);
    expect(r.motivoDerivacion).toBeNull();
  });
});
