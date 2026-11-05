import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderizar, USUARIO } from '../../test/utilidades';
import { SeleccionCanal } from './SeleccionCanal';

const COTIZACION = {
  id: 'c-1',
  vehiculo: { uso: 'PARTICULAR', marca: 'Toyota', modelo: 'Yaris', anio: 2022 },
  contacto: { nombres: 'Ana', canalPreferido: 'WHATSAPP' },
  solicitudAbierta: null,
  aseguradoras: [],
};
const enPantalla = (opciones: Parameters<typeof renderizar>[1]) =>
  renderizar(
    <Routes>
      <Route path="/asesoria/:cotizacionId" element={<SeleccionCanal />} />
    </Routes>,
    { ruta: '/asesoria/c-1', ...opciones },
  );

describe('Selección de canal (CU-03)', () => {
  it('RF-11: muestra los datos ya capturados y pide registro mínimo si no hay sesión', async () => {
    enPantalla({ api: { '/api/cotizaciones/c-1': COTIZACION } });
    expect(await screen.findByText(/Toyota Yaris 2022/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ingresar o crear cuenta' })).toBeInTheDocument();
    expect(screen.getByLabelText('¿Por dónde te contactamos?')).toHaveValue('WHATSAPP'); // canal preferido precargado
  });

  it('RF-12: al solicitar muestra la confirmación con el tiempo estimado de contacto', async () => {
    enPantalla({
      usuario: USUARIO.cliente,
      api: {
        '/api/cotizaciones/c-1': COTIZACION,
        'POST /api/asesoria/solicitudes': { id: 's-1', canal: 'LLAMADA', minutosEstimados: 30 },
      },
    });
    const u = userEvent.setup();
    await u.selectOptions(await screen.findByLabelText('¿Por dónde te contactamos?'), 'LLAMADA');
    await u.click(screen.getByRole('button', { name: 'Solicitar asesoría' }));
    expect(await screen.findByText('Solicitud registrada')).toBeInTheDocument();
    expect(screen.getByText(/por Llamada en aproximadamente 30 minutos/)).toBeInTheDocument();
  });
});
