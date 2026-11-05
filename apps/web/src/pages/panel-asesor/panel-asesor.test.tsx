import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderizar, RespuestaSimulada, USUARIO } from '../../test/utilidades';
import { PanelAsesor } from './PanelAsesor';

const COLA = [
  {
    id: 's-taxi',
    motivo: 'INSPECCION',
    origen: 'SISTEMA',
    estado: 'PENDIENTE',
    canal: 'WHATSAPP',
    fechaCreacion: '2026-11-05T10:00:00Z',
    asesor: null,
    cliente: 'Luis',
    vehiculo: 'Kia Rio 2022',
    uso: 'TRANSPORTE_PASAJEROS',
  },
  {
    id: 's-cli',
    motivo: 'NEGOCIACION',
    origen: 'CLIENTE',
    estado: 'PENDIENTE',
    canal: 'LLAMADA',
    fechaCreacion: '2026-11-05T09:00:00Z',
    asesor: null,
    cliente: 'Ana',
    vehiculo: 'Toyota Yaris 2022',
    uso: 'PARTICULAR',
  },
];
const DETALLE = {
  id: 's-cli',
  motivo: 'NEGOCIACION',
  origen: 'CLIENTE',
  estado: 'EN_ATENCION',
  canal: 'LLAMADA',
  resultado: null,
  esMia: true,
  cliente: { nombres: 'Ana', apellidos: null, telefono: '912345678', email: null, canalPreferido: 'LLAMADA' },
  descuentoMaximo: 10,
  descuentos: [],
  cotizacion: {
    vehiculo: { uso: 'PARTICULAR', marca: 'Toyota', modelo: 'Yaris', anio: 2022 },
    aseguradoras: [
      {
        id: 'a',
        nombre: 'Rímac',
        cotiza: true,
        planes: [{ primaCotizadaId: 'pc', planId: 'p-full', nombre: 'Full', prima: 1957.5 }],
      },
    ],
  },
};

describe('Panel del asesor (CU-03)', () => {
  it('RN-13: muestra la cola en el orden de la API con los derivados marcados', async () => {
    renderizar(<PanelAsesor />, { usuario: USUARIO.asesor, api: { '/api/asesor/cola': COLA } });
    const casos = await screen.findAllByTestId('caso');
    expect(within(casos[0]).getByText('Derivado')).toBeInTheDocument();
    expect(within(casos[1]).queryByText('Derivado')).not.toBeInTheDocument();
  });

  it('RN-07 / RF-13: ve los datos capturados e informa el rechazo de un descuento mayor al máximo', async () => {
    renderizar(<PanelAsesor />, {
      usuario: USUARIO.asesor,
      api: {
        '/api/asesor/cola': COLA,
        '/api/asesor/solicitudes/s-cli': DETALLE,
        'POST /api/asesor/solicitudes/s-cli/descuento': new RespuestaSimulada(422, {
          mensaje: 'El descuento de 12 % supera el máximo permitido de 10 %',
          errores: { porcentaje: 'El descuento de 12 % supera el máximo permitido de 10 %' },
        }),
      },
    });
    const u = userEvent.setup();
    const casos = await screen.findAllByTestId('caso');
    await u.click(within(casos[1]).getByRole('button', { name: 'Abrir' }));
    expect(await screen.findByText(/912345678/)).toBeInTheDocument();
    expect(screen.getByText(/máximo 10 %/)).toBeInTheDocument();
    await u.selectOptions(screen.getByLabelText('Plan'), 'p-full');
    await u.type(screen.getByLabelText('Descuento (%)'), '12');
    await u.click(screen.getByRole('button', { name: 'Registrar descuento' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('supera el máximo permitido de 10 %');
  });
});
