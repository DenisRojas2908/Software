import { atribuirCanal } from './atribuir-canal';

const base = { desdeEnlaceRetoma: false, aceptoEnSeguimiento: false, habilitadaPorAsesoria: false };

describe('atribuirCanal (RN-27)', () => {
  it('RN-27: sin asesoría ni seguimiento → AUTONOMO', () => {
    expect(atribuirCanal(base)).toBe('AUTONOMO');
  });
  it('RN-27: compra desde el enlace de retoma → TELEMARKETING', () => {
    expect(atribuirCanal({ ...base, desdeEnlaceRetoma: true })).toBe('TELEMARKETING');
  });
  it('RN-27: aceptó el descuento en seguimiento → TELEMARKETING', () => {
    expect(atribuirCanal({ ...base, aceptoEnSeguimiento: true })).toBe('TELEMARKETING');
  });
  it('RN-27 / D-30: compra habilitada por la asesoría (con o sin descuento) → ASESORIA', () => {
    expect(atribuirCanal({ ...base, habilitadaPorAsesoria: true })).toBe('ASESORIA');
  });
  it('D-30 caso mixto: asesoría con 8 % pero la compra empezó desde el enlace de retoma → TELEMARKETING', () => {
    expect(
      atribuirCanal({ desdeEnlaceRetoma: true, aceptoEnSeguimiento: false, habilitadaPorAsesoria: true }),
    ).toBe('TELEMARKETING');
  });
});
