import { ordenarCola } from './cola';

const caso = (id: string, origen: 'SISTEMA' | 'CLIENTE', hora: string) => ({
  id,
  origen,
  fechaCreacion: new Date(`2026-11-05T${hora}:00Z`),
});

describe('ordenarCola (RN-13)', () => {
  it('RN-13: los derivados por el sistema van primero aunque hayan llegado después', () => {
    const cola = ordenarCola([caso('cliente-1', 'CLIENTE', '09:00'), caso('taxi', 'SISTEMA', '10:00')]);
    expect(cola.map((c) => c.id)).toEqual(['taxi', 'cliente-1']);
  });
  it('RN-13: dentro de cada grupo, por orden de llegada', () => {
    const cola = ordenarCola([
      caso('c2', 'CLIENTE', '11:00'),
      caso('s2', 'SISTEMA', '10:30'),
      caso('c1', 'CLIENTE', '08:00'),
      caso('s1', 'SISTEMA', '10:00'),
    ]);
    expect(cola.map((c) => c.id)).toEqual(['s1', 's2', 'c1', 'c2']);
  });
});
