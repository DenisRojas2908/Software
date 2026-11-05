import { RelojFijo, RelojSistema, sumarDias } from './reloj';

describe('Reloj (D-07)', () => {
  it('D-07: el reloj del sistema se puede adelantar días (modo demo)', () => {
    const r = new RelojSistema();
    const antes = r.ahora().getTime();
    r.adelantarDias(8);
    expect(r.ahora().getTime() - antes).toBeGreaterThanOrEqual(8 * 86_400_000);
    expect(r.diasAdelantados).toBe(8);
    r.reiniciar();
    expect(r.diasAdelantados).toBe(0);
  });
  it('D-07: el reloj fijo devuelve siempre la misma fecha', () => {
    const r = new RelojFijo('2026-11-05T12:00:00Z');
    expect(r.ahora().toISOString()).toBe('2026-11-05T12:00:00.000Z');
    expect(sumarDias(r.ahora(), 7).toISOString()).toBe('2026-11-12T12:00:00.000Z');
  });
});
