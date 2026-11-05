import { screen } from '@testing-library/react';
import { Rutas } from '../../App';
import { renderizar, USUARIO } from '../../test/utilidades';

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

  it('F8: con DEMO_MODE=true el ADMINISTRADOR ve el menú y la página de demo', async () => {
    renderizar(<Rutas demoHabilitado />, { ruta: '/demo', usuario: USUARIO.admin, api: ESTADO });
    expect(await screen.findByRole('heading', { name: 'Modo demo' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Demo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Procesar abandonos' })).toBeInTheDocument();
  });
});
