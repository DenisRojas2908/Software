import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderizar, USUARIO } from '../../test/utilidades';
import { PanelAdmin } from './PanelAdmin';

const API = {
  '/api/admin/reportes/ventas?agrupar=canal': { total: { polizas: 0, primaTotal: 0 }, filas: [] },
  '/api/admin/aseguradoras': [
    { id: 'a1', nombre: 'Rímac', activa: true, codigoEstrategia: 'RIMAC', planes: [] },
  ],
  '/api/admin/campos': [
    {
      id: 'f1',
      nombre: 'distrito',
      tipo: 'TEXTO',
      obligatorio: true,
      activo: true,
      aseguradora: { nombre: 'Rímac' },
      valores: [],
    },
    {
      id: 'f2',
      nombre: 'clase',
      tipo: 'LISTA',
      obligatorio: true,
      activo: true,
      aseguradora: { nombre: 'Rímac' },
      valores: [{ valor: 'SUV' }, { valor: 'SEDAN' }],
    },
  ],
  'POST /api/admin/campos': { id: 'f3' },
  'PATCH /api/admin/campos/f1': { id: 'f1' },
  '/api/admin/reglas-inspeccion': [
    {
      id: 'a1',
      nombre: 'Rímac',
      reglas: [
        { uso: 'PARTICULAR', requiereInspeccion: false },
        { uso: 'TRANSPORTE_PASAJEROS', requiereInspeccion: true },
      ],
    },
  ],
  'PUT /api/admin/reglas-inspeccion': {},
  '/api/admin/usuarios': [{ id: 'u1', email: 'asesor1@svas.demo', rol: 'ASESOR', activo: true }],
  'POST /api/admin/usuarios': { id: 'u2' },
  '/api/admin/actividad': [
    {
      id: 'r1',
      accion: 'EDITAR_PARAMETROS',
      entidad: 'ParametrosComerciales#1',
      fecha: '2026-11-05T10:00:00Z',
      usuario: { email: 'admin@svas.demo' },
    },
  ],
};
const cuerpo = (f: jest.Mock, url: string, metodo: string) =>
  JSON.parse(String(f.mock.calls.find(([u, i]) => u === url && i?.method === metodo)![1]!.body));

describe('Panel admin: campos, inspección, usuarios y actividad (CU-05)', () => {
  it('RF-28 / RNF-13: vuelve opcional un campo y agrega uno nuevo de tipo lista', async () => {
    const { fetchFalso } = renderizar(<PanelAdmin />, { usuario: USUARIO.admin, api: API });
    const u = userEvent.setup();
    await u.click(screen.getByRole('tab', { name: 'Campos' }));
    await u.click(await screen.findByLabelText('Rímac distrito obligatorio'));
    expect(cuerpo(fetchFalso, '/api/admin/campos/f1', 'PATCH')).toEqual({ obligatorio: false });
    await u.selectOptions(screen.getByLabelText('Aseguradora del campo'), 'a1');
    await u.type(screen.getByLabelText('Nombre del campo'), 'color');
    await u.selectOptions(screen.getByLabelText('Tipo del campo'), 'LISTA');
    await u.type(screen.getByLabelText('Valores permitidos'), 'Rojo, Negro');
    await u.click(screen.getByRole('button', { name: 'Agregar campo' }));
    expect(cuerpo(fetchFalso, '/api/admin/campos', 'POST')).toEqual({
      aseguradoraId: 'a1',
      nombre: 'color',
      tipo: 'LISTA',
      obligatorio: false,
      valores: ['Rojo', 'Negro'],
    });
  });

  it('RN-25: quitar la inspección de taxis envía la regla por aseguradora y uso', async () => {
    const { fetchFalso } = renderizar(<PanelAdmin />, { usuario: USUARIO.admin, api: API });
    const u = userEvent.setup();
    await u.click(screen.getByRole('tab', { name: 'Inspección' }));
    await u.click(await screen.findByLabelText('Rímac TRANSPORTE_PASAJEROS requiere inspección'));
    expect(cuerpo(fetchFalso, '/api/admin/reglas-inspeccion', 'PUT')).toEqual({
      aseguradoraId: 'a1',
      uso: 'TRANSPORTE_PASAJEROS',
      requiereInspeccion: false,
    });
  });

  it('RF-31: crea un asesor y muestra la actividad reciente (RNF-12)', async () => {
    const { fetchFalso } = renderizar(<PanelAdmin />, { usuario: USUARIO.admin, api: API });
    const u = userEvent.setup();
    await u.click(screen.getByRole('tab', { name: 'Usuarios' }));
    expect(await screen.findByText('asesor1@svas.demo')).toBeInTheDocument();
    await u.type(screen.getByLabelText('Correo del usuario'), 'asesor3@svas.demo');
    await u.type(screen.getByLabelText('Contraseña del usuario'), 'Asesor123!');
    await u.click(screen.getByRole('button', { name: 'Crear usuario' }));
    expect(cuerpo(fetchFalso, '/api/admin/usuarios', 'POST')).toEqual({
      email: 'asesor3@svas.demo',
      contrasena: 'Asesor123!',
      rol: 'ASESOR',
    });
    await u.click(screen.getByRole('tab', { name: 'Actividad' }));
    expect(await screen.findByText('EDITAR_PARAMETROS')).toBeInTheDocument();
  });
});
