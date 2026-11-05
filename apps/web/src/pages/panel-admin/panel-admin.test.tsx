import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderizar, USUARIO } from '../../test/utilidades';
import { PanelAdmin } from './PanelAdmin';

const API = {
  '/api/admin/reportes/ventas?agrupar=canal': {
    total: { polizas: 80, primaTotal: 140000.5 },
    filas: [
      { grupo: 'ASESORIA', polizas: 29, primaTotal: 50000 },
      { grupo: 'TELEMARKETING', polizas: 28, primaTotal: 48000.5 },
      { grupo: 'AUTONOMO', polizas: 23, primaTotal: 42000 },
    ],
  },
  '/api/admin/parametros': {
    descuentoPrimeraCompra: 5,
    descuentoMaximo: 10,
    maxIntentos: 4,
    diasSeguimiento: 7,
    maxCuotas: 12,
    vigenciaEnlaceDias: 7,
  },
  '/api/admin/aseguradoras': [
    {
      id: 'a1',
      nombre: 'Quálitas',
      activa: true,
      codigoEstrategia: 'QUALITAS',
      planes: [{ id: 'p1', nombre: 'Básico', activo: true, descripcion: '' }],
    },
  ],
  'PATCH /api/admin/aseguradoras/a1': { id: 'a1', activa: false },
};

describe('Panel del administrador (CU-05)', () => {
  it('RF-30: el reporte por canal muestra los 3 canales y el total', async () => {
    renderizar(<PanelAdmin />, { usuario: USUARIO.admin, api: API });
    expect(await screen.findByTestId('total')).toHaveTextContent('80 pólizas');
    for (const canal of ['Asesoría', 'Telemarketing', 'Autónomo'])
      expect(screen.getByRole('cell', { name: canal })).toBeInTheDocument();
  });

  it('RF-29 / RNF-13: los parámetros comerciales se muestran desde la API para editarlos', async () => {
    renderizar(<PanelAdmin />, { usuario: USUARIO.admin, api: API });
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Parámetros' }));
    expect(await screen.findByLabelText(/Descuento máximo de negociación/)).toHaveValue('10');
    expect(screen.getByLabelText(/Máximo de intentos/)).toHaveValue('4');
  });

  it('RF-27: desactivar una aseguradora llama a la API (desactivar, no borrar)', async () => {
    const { fetchFalso } = renderizar(<PanelAdmin />, { usuario: USUARIO.admin, api: API });
    const u = userEvent.setup();
    await u.click(screen.getByRole('tab', { name: 'Aseguradoras y planes' }));
    await u.click(await screen.findByLabelText('Quálitas activa'));
    expect(fetchFalso).toHaveBeenCalledWith(
      '/api/admin/aseguradoras/a1',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ activa: false }) }),
    );
  });
});
