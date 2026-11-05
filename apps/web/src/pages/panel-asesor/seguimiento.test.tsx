import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderizar, USUARIO } from '../../test/utilidades';
import { ColaSeguimiento } from './ColaSeguimiento';

const BASE = {
  id: 's-1',
  estado: 'EN_SEGUIMIENTO',
  intentos: 4,
  intentosRestantes: 0,
  limite: '2026-11-12T10:00:00Z',
  motivoCierre: null,
  canalPreferido: 'WHATSAPP',
  cliente: { nombres: 'Ana', telefono: '912345678' },
  vehiculo: 'Toyota Yaris 2022',
  planSugerido: { aseguradora: 'Quálitas', plan: 'Básico', prima: 900 },
  primeraCompra: null,
  historial: [],
  enlace: null,
  mensajeFinal: null,
  puedeContactar: { permitido: false, motivo: 'Se alcanzó el máximo de 4 intentos' },
};

describe('Seguimiento en el panel del asesor (CU-04)', () => {
  it('RN-10: muestra intentos hechos/restantes y bloquea un 5.º intento con el motivo', async () => {
    renderizar(<ColaSeguimiento />, {
      usuario: USUARIO.asesor,
      api: { '/api/asesor/seguimientos': [BASE], '/api/asesor/seguimientos/s-1': BASE },
    });
    const [fila] = await screen.findAllByTestId('seguimiento');
    expect(fila).toHaveTextContent('4 intentos · quedan 0');
    await userEvent.setup().click(within(fila).getByRole('button', { name: 'Abrir' }));
    expect(await screen.findByText('Se alcanzó el máximo de 4 intentos')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Registrar intento' })).not.toBeInTheDocument();
    expect(screen.getByText(/solo por/)).toHaveTextContent('WhatsApp'); // RNF-11: canal preferido
  });

  it('CU-04 7a: si el mensaje final falló ofrece reenviarlo', async () => {
    const cerrado = { ...BASE, estado: 'DESCARTADO', motivoCierre: 'PRECIO', mensajeFinal: 'FALLIDO' };
    renderizar(<ColaSeguimiento />, {
      usuario: USUARIO.asesor,
      api: { '/api/asesor/seguimientos': [cerrado], '/api/asesor/seguimientos/s-1': cerrado },
    });
    await userEvent
      .setup()
      .click(within((await screen.findAllByTestId('seguimiento'))[0]).getByRole('button', { name: 'Abrir' }));
    expect(await screen.findByRole('button', { name: 'Reenviar mensaje final' })).toBeInTheDocument();
  });
});
