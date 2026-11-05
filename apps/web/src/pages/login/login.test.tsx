import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Rutas } from '../../App';
import { renderizar, RespuestaSimulada } from '../../test/utilidades';

describe('Login (RF-31)', () => {
  it('RF-31: con credenciales válidas entra y lleva al panel según el rol', async () => {
    renderizar(<Rutas />, {
      ruta: '/login',
      api: {
        'POST /api/auth/login': {
          token: 't',
          usuario: { id: 'a1', email: 'asesor1@svas.demo', rol: 'ASESOR' },
        },
        '/api/asesor/cola': [],
      },
    });
    const u = userEvent.setup();
    await u.type(screen.getByLabelText('Correo'), 'asesor1@svas.demo');
    await u.type(screen.getByLabelText('Contraseña'), 'Asesor123!');
    await u.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByRole('heading', { name: 'Panel del asesor' })).toBeInTheDocument();
  });

  it('RF-31: credenciales inválidas → mensaje de error', async () => {
    renderizar(<Rutas />, {
      ruta: '/login',
      api: {
        'POST /api/auth/login': new RespuestaSimulada(401, { message: 'Correo o contraseña incorrectos' }),
      },
    });
    const u = userEvent.setup();
    await u.type(screen.getByLabelText('Correo'), 'x@x.pe');
    await u.type(screen.getByLabelText('Contraseña'), 'mala');
    await u.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos');
  });
});
