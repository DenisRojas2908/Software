import { redondear2 } from './dinero';

describe('redondear2', () => {
  it('redondea a 2 decimales sin error de coma flotante', () => {
    expect(redondear2(1290 * 0.75 * 1.15)).toBe(1112.63);
    expect(redondear2(1.005)).toBe(1.01);
    expect(redondear2(1450)).toBe(1450);
  });
});
