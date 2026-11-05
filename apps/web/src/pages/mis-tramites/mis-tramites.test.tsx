import { screen } from '@testing-library/react';
import { renderizar, USUARIO } from '../../test/utilidades';
import { MisTramites } from './MisTramites';

describe('Mis trámites (RF-26)', () => {
  it('RF-26: muestra el estado de la solicitud, del pago (cuotas) y de la póliza', async () => {
    renderizar(<MisTramites />, {
      usuario: USUARIO.cliente,
      api: {
        '/api/polizas/mias': [
          {
            cotizacionId: 'c1',
            fecha: '2026-11-05',
            vehiculo: 'Toyota Yaris 2022',
            estado: 'CONVERTIDA',
            motivoDerivacion: null,
            solicitud: null,
            orden: {
              id: 'o1',
              aseguradora: 'Rímac',
              plan: 'Intermedio',
              primaFinal: 1377.5,
              pago: {
                estado: 'CONFIRMADO',
                modo: 'CUOTAS',
                cuotas: [
                  { numero: 1, monto: 229.58, estado: 'CONFIRMADO' },
                  { numero: 2, monto: 229.58, estado: 'PENDIENTE' },
                ],
              },
            },
            poliza: {
              id: 'p1',
              numero: 'SVAS-RIMAC-X',
              fechaEmision: '2026-11-05',
              vigenciaHasta: '2027-11-05',
              canalVenta: 'AUTONOMO',
            },
          },
          {
            cotizacionId: 'c2',
            fecha: '2026-11-04',
            vehiculo: 'Kia Rio 2020',
            estado: 'REGISTRADA',
            motivoDerivacion: 'INSPECCION',
            solicitud: { estado: 'PENDIENTE', motivo: 'INSPECCION' },
            orden: null,
            poliza: null,
          },
        ],
      },
    });
    const items = await screen.findAllByTestId('tramite');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Comprada');
    expect(items[0]).toHaveTextContent('(1/2 cuotas)');
    expect(items[0]).toHaveTextContent('SVAS-RIMAC-X');
    expect(items[1]).toHaveTextContent('Asesoría: Inspección · Pendiente');
  });
});
