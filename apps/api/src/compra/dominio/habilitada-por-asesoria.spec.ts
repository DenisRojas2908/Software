import { habilitadaPorAsesoria } from './habilitada-por-asesoria';

const cerrada = (resultado: string) => ({ estado: 'CERRADA', resultado });
const negociado = (planId: string, aceptado = true) => ({ tipo: 'NEGOCIADO', aceptado, planId });

describe('habilitadaPorAsesoria (D-30, RN-27)', () => {
  it('D-30: solicitud cerrada con ACEPTA, sin descuento (taxi) → habilitada', () => {
    expect(habilitadaPorAsesoria([cerrada('ACEPTA')], [], 'p1')).toBe(true);
  });
  it('RN-27: descuento NEGOCIADO aceptado para ese plan → habilitada', () => {
    expect(habilitadaPorAsesoria([], [negociado('p1')], 'p1')).toBe(true);
  });
  it('RN-03: un negociado aceptado de OTRO plan no desbloquea este plan', () => {
    expect(habilitadaPorAsesoria([], [negociado('p2')], 'p1')).toBe(false);
  });
  it('D-31: solicitud abierta, o cerrada con NO_ACEPTA → no habilitada', () => {
    expect(
      habilitadaPorAsesoria(
        [{ estado: 'EN_ATENCION', resultado: null }, cerrada('NO_ACEPTA')],
        [negociado('p1', false)],
        'p1',
      ),
    ).toBe(false);
  });
});
