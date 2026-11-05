import { render, screen } from '@testing-library/react';
import App, { Rutas } from '../../App';
import { renderizar, simularApi, USUARIO } from '../../test/utilidades';

const ESTADO = {
  '/api/demo/estado': {
    ahora: '2026-11-05T15:00:00Z',
    diasAdelantados: 0,
    fallos: {
      pagoRechazado: false,
      emisionFallida: false,
      aseguradoraCaida: null,
      envioMensajeFallido: false,
    },
  },
  '/api/demo/buzon': [],
};

describe('Página de demo (F8)', () => {
  it('RNF-10: con DEMO_MODE=false el admin no ve "Demo" en el menú y /demo no existe', async () => {
    renderizar(<Rutas demoHabilitado={false} />, { ruta: '/demo', usuario: USUARIO.admin, api: ESTADO });
    expect(await screen.findByText('Página no encontrada.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Demo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Modo demo' })).not.toBeInTheDocument();
  });

  it('RF-32: con DEMO_MODE=true un ASESOR no ve el menú y en /demo recibe "Acceso no permitido"', async () => {
    renderizar(<Rutas demoHabilitado />, { ruta: '/demo', usuario: USUARIO.asesor, api: ESTADO });
    expect(await screen.findByText('Acceso no permitido')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Demo' })).not.toBeInTheDocument();
  });

  it('RF-32: con DEMO_MODE=true un CLIENTE tampoco ve el menú ni la página', async () => {
    renderizar(<Rutas demoHabilitado />, { ruta: '/demo', usuario: USUARIO.cliente, api: ESTADO });
    expect(await screen.findByText('Acceso no permitido')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Demo' })).not.toBeInTheDocument();
  });

  it('F8: la app decide mostrar "Demo" según /api/salud (demoHabilitado)', async () => {
    localStorage.setItem('svas.token', 't');
    simularApi({
      '/api/salud': { estado: 'ok', simulacion: true, demoHabilitado: true },
      '/api/auth/yo': USUARIO.admin,
    });
    const { unmount } = render(<App />);
    expect(await screen.findByRole('link', { name: 'Demo' })).toBeInTheDocument();
    unmount();
    simularApi({
      '/api/salud': { estado: 'ok', simulacion: true, demoHabilitado: false },
      '/api/auth/yo': USUARIO.admin,
    });
    render(<App />);
    expect(await screen.findByRole('link', { name: 'Panel admin' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Demo' })).not.toBeInTheDocument();
    localStorage.clear();
  });

  it('F8: con DEMO_MODE=true el ADMINISTRADOR ve el menú y la página de demo', async () => {
    renderizar(<Rutas demoHabilitado />, { ruta: '/demo', usuario: USUARIO.admin, api: ESTADO });
    expect(await screen.findByRole('heading', { name: 'Modo demo' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Demo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Procesar abandonos' })).toBeInTheDocument();
  });
});
