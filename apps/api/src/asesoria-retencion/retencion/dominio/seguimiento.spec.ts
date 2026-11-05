import {
  DatosSeguimiento,
  MotivoObligatorioError,
  Seguimiento,
  SeguimientoCerradoError,
} from './seguimiento';

// Reglas iniciales de 02 §10: 4 intentos en 7 días; enlace de 7 días.
const REGLAS = { maxIntentos: 4, diasSeguimiento: 7, vigenciaEnlaceDias: 7 };
const APERTURA = new Date('2026-11-01T10:00:00Z');
const dias = (n: number) => new Date(APERTURA.getTime() + n * 86_400_000);
const seg = (d: Partial<DatosSeguimiento> = {}) =>
  new Seguimiento(
    { estado: 'EN_SEGUIMIENTO', intentos: 0, fechaApertura: APERTURA, canalPreferido: 'WHATSAPP', ...d },
    REGLAS,
  );

describe('Seguimiento (CU-04)', () => {
  it('RN-10: permite contactar por el canal preferido dentro del plazo', () => {
    expect(seg().puedeContactar('WHATSAPP', dias(1))).toEqual({ permitido: true });
  });
  it('RN-10 / RNF-11: no permite contactar por otro canal', () => {
    expect(seg().puedeContactar('LLAMADA', dias(1)).permitido).toBe(false);
  });
  it('RN-10: con 4 intentos ya no se permite el 5.º', () => {
    const r = seg({ intentos: 4 }).puedeContactar('WHATSAPP', dias(2));
    expect(r).toEqual({ permitido: false, motivo: 'Se alcanzó el máximo de 4 intentos' });
  });
  it('RN-10: con 3 intentos aún queda 1', () => {
    expect(seg({ intentos: 3 }).intentosRestantes).toBe(1);
    expect(seg({ intentos: 3 }).puedeContactar('WHATSAPP', dias(2)).permitido).toBe(true);
  });
  it('RN-10: pasados 7 días ya no se contacta y el caso debe cerrarse', () => {
    expect(seg().puedeContactar('WHATSAPP', dias(7)).permitido).toBe(false);
    expect(seg().debeCerrarseAutomaticamente(dias(8))).toBe(true);
    expect(seg().debeCerrarseAutomaticamente(dias(6))).toBe(false);
  });
  it('RN-10: al alcanzar 4 intentos el caso debe cerrarse', () => {
    expect(seg({ intentos: 4 }).debeCerrarseAutomaticamente(dias(1))).toBe(true);
  });
  it('D-51: si el cliente aceptó, no se cierra solo aunque llegue a 4 intentos o pasen 7 días', () => {
    expect(seg({ intentos: 4, aceptado: true }).debeCerrarseAutomaticamente(dias(8))).toBe(false);
  });
  it('RN-12: al cerrar se respeta el enlace vigente; si venció se genera uno nuevo', () => {
    const s = seg({ enlaceToken: 'viejo', enlaceExpiraEn: dias(5) });
    expect(s.enlaceParaCierre('nuevo', dias(1)).enlaceToken).toBe('viejo');
    expect(s.enlaceParaCierre('nuevo', dias(6)).enlaceToken).toBe('nuevo');
  });
  it('RN-11: cerrar exige motivo', () => {
    expect(() => seg().cerrar(null, dias(1))).toThrow(MotivoObligatorioError);
  });
  it('RN-11: cerrar con motivo PRECIO deja el caso DESCARTADO', () => {
    expect(seg().cerrar('PRECIO', dias(1))).toEqual({
      estado: 'DESCARTADO',
      motivoCierre: 'PRECIO',
      fechaCierre: dias(1),
    });
  });
  it('RN-11: no se cierra dos veces', () => {
    expect(() => seg({ estado: 'DESCARTADO', motivoCierre: 'PRECIO' }).cerrar('OTRO', dias(1))).toThrow(
      SeguimientoCerradoError,
    );
  });
  it('RN-12: el enlace vence a los 7 días (vigente el día 6, vencido el día 8)', () => {
    const { enlaceExpiraEn } = seg().nuevoEnlace('tok', APERTURA);
    expect(enlaceExpiraEn.toISOString()).toBe('2026-11-08T10:00:00.000Z');
    expect(Seguimiento.enlaceVigente(enlaceExpiraEn, dias(6))).toBe(true);
    expect(Seguimiento.enlaceVigente(enlaceExpiraEn, dias(8))).toBe(false);
  });
});
