import { screen } from '@testing-library/react';
import userEventLib from '@testing-library/user-event';
import { Rutas } from '../App';
import { renderizar, USUARIO } from '../test/utilidades';

const userEvent = userEventLib;

describe('Seguridad en la UI (F2)', () => {
  it('RF-32: sin sesión, el panel admin redirige al login', async () => {
    renderizar(<Rutas />, { ruta: '/admin' });
    expect(await screen.findByRole('tab', { name: 'Ingresar' })).toBeInTheDocument();
  });

  it('RF-32: un ASESOR que entra a /admin ve "Acceso no permitido"', async () => {
    renderizar(<Rutas />, { ruta: '/admin', usuario: USUARIO.asesor });
    expect(await screen.findByText('Acceso no permitido')).toBeInTheDocument();
  });

  it('RF-32: el menú muestra solo las opciones del rol', async () => {
    renderizar(<Rutas />, { usuario: USUARIO.cliente });
    expect(await screen.findByRole('link', { name: 'Mis trámites' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Panel admin' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Panel asesor' })).not.toBeInTheDocument();
  });

  it('RF-03: el login muestra errores por campo sin llamar a la API', async () => {
    const { fetchFalso } = renderizar(<Rutas />, { ruta: '/login' });
    const u = userEvent.setup();
    await u.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText('Correo inválido')).toBeInTheDocument();
    expect(screen.getByText('Ingresa tu contraseña')).toBeInTheDocument();
    expect(fetchFalso).not.toHaveBeenCalledWith('/api/auth/login', expect.anything());
  });

  it('RF-11: "Crear cuenta" pide nombres, celular y canal preferido', async () => {
    renderizar(<Rutas />, { ruta: '/login' });
    const u = userEvent.setup();
    await u.click(screen.getByRole('tab', { name: 'Crear cuenta' }));
    expect(screen.getByLabelText('Nombres')).toBeInTheDocument();
    expect(screen.getByLabelText('Celular')).toBeInTheDocument();
    expect(screen.getByLabelText('¿Cómo prefieres que te contactemos?')).toBeInTheDocument();
  });
});
