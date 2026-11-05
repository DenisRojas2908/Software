import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { verificarPropiedad } from './propiedad';

const cliente = (id: string) => ({ id, email: `${id}@x.pe`, rol: 'CLIENTE' as const });

describe('verificarPropiedad (RF-32, D-36)', () => {
  it('RF-32: el cliente dueño accede', () => {
    expect(() => verificarPropiedad(cliente('A'), 'A')).not.toThrow();
  });
  it('RF-32: el cliente A no accede a lo del cliente B → 403', () => {
    expect(() => verificarPropiedad(cliente('A'), 'B')).toThrow(ForbiddenException);
  });
  it('RF-32: un invitado no accede a lo que ya tiene dueño → 403', () => {
    expect(() => verificarPropiedad(undefined, 'B')).toThrow(ForbiddenException);
  });
  it('D-36: un recurso sin dueño se lee por su uuid solo si se permite', () => {
    expect(() => verificarPropiedad(undefined, null, { permitirSinDueno: true })).not.toThrow();
    expect(() => verificarPropiedad(cliente('A'), null)).toThrow(NotFoundException);
  });
  it('RF-32: ASESOR y ADMINISTRADOR acceden en sus vistas', () => {
    expect(() => verificarPropiedad({ id: 'Z', email: 'z', rol: 'ASESOR' }, 'B')).not.toThrow();
    expect(() => verificarPropiedad({ id: 'Z', email: 'z', rol: 'ADMINISTRADOR' }, 'B')).not.toThrow();
  });
});
