import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderizar, RespuestaSimulada, USUARIO } from '../../test/utilidades';
import { ResumenOrden } from '../../tipos/dominio';
import { PagoPoliza } from './PagoPoliza';

function orden(extra: Partial<ResumenOrden> = {}): ResumenOrden {
  return {
    id: 'o-1',
    cotizacionId: 'c-1',
    estado: 'LISTA_PARA_PAGAR',
    vehiculo: 'Toyota Yaris 2022',
    uso: 'PARTICULAR',
    aseguradora: 'Rímac',
    plan: 'Intermedio',
    coberturas: 'Genéricas',
    prima: 1450,
    descuento: { tipo: 'PRIMERA_COMPRA', porcentaje: 5 },
    primeraCompraEvaluada: true,
    primaFinal: 1377.5,
    canalVenta: 'AUTONOMO',
    datosFaltantes: [],
    cliente: { nombres: 'Ana', apellidos: 'Quispe', numeroDocumento: '45678123' },
    aceptaCondiciones: false,
    firmaSimulada: false,
    maxCuotas: 12,
    pagos: [],
    poliza: null,
    ...extra,
  };
}

const enPago = (api: Record<string, unknown>) =>
  renderizar(
    <Routes>
      <Route path="/compra/:ordenId" element={<PagoPoliza />} />
    </Routes>,
    { ruta: '/compra/o-1', usuario: USUARIO.cliente, api },
  );

describe('Pago y póliza (CU-02)', () => {
  it('RNF-08: solo pide los datos faltantes (DNI y apellidos)', async () => {
    enPago({
      '/api/compras/o-1': orden({
        estado: 'PENDIENTE_DATOS',
        datosFaltantes: ['numeroDocumento', 'apellidos'],
        primeraCompraEvaluada: false,
        descuento: { tipo: null, porcentaje: 0 },
      }),
    });
    expect(await screen.findByLabelText('DNI')).toBeInTheDocument();
    expect(screen.getByLabelText('Apellidos')).toBeInTheDocument();
    expect(screen.queryByLabelText(/correo|celular|marca/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('descuento')).toHaveTextContent('Se evalúa al ingresar tu DNI');
  });

  it('RN-08: muestra el 5 % de primera compra y la prima final', async () => {
    enPago({ '/api/compras/o-1': orden() });
    expect(await screen.findByTestId('descuento')).toHaveTextContent('5 % (primera compra)');
    expect(screen.getByTestId('prima-final')).toHaveTextContent('1,377.50');
  });

  it('D-08: el pago simulado nunca pide tarjeta, CVV ni datos bancarios', async () => {
    const { container } = enPago({ '/api/compras/o-1': orden() });
    await screen.findByText('Condiciones y forma de pago');
    const texto = container.textContent!.toLowerCase();
    expect(texto).not.toMatch(/n[uú]mero de tarjeta|cvv|cvc|cuenta bancaria/);
    expect(container.querySelector('input[autocomplete^="cc-"]')).toBeNull();
  });

  it('RN-14 / RF-24: tras aceptar y firmar muestra el cronograma de cuotas y el botón de pago simulado', async () => {
    enPago({
      '/api/compras/o-1': orden(),
      'POST /api/compras/o-1/confirmar': {
        ...orden(),
        cronograma: [229.58, 229.58, 229.58, 229.58, 229.58, 229.6],
      },
    });
    const u = userEvent.setup();
    expect(await screen.findByRole('button', { name: 'Ver cronograma' })).toBeDisabled();
    await u.click(screen.getByLabelText('En cuotas'));
    await u.click(screen.getByLabelText(/Acepto las condiciones/));
    await u.click(screen.getByLabelText(/Firmo la solicitud/));
    await u.click(screen.getByRole('button', { name: 'Ver cronograma' }));
    expect(await screen.findByText('Cuota 6')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pagar .*229\.58.* \(simulado\)/ })).toBeInTheDocument();
  });

  it('CU-02 5a: si el pago es rechazado lo informa y permite reintentar', async () => {
    enPago({
      '/api/compras/o-1': orden(),
      'POST /api/compras/o-1/confirmar': { ...orden(), cronograma: [1377.5] },
      'POST /api/compras/o-1/pagar': new RespuestaSimulada(402, {
        mensaje: 'Pago rechazado por la entidad (simulado)',
      }),
    });
    const u = userEvent.setup();
    await u.click(await screen.findByLabelText(/Acepto las condiciones/));
    await u.click(screen.getByLabelText(/Firmo la solicitud/));
    await u.click(screen.getByRole('button', { name: 'Ver cronograma' }));
    await u.click(await screen.findByRole('button', { name: /Pagar/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Pago rechazado.*reintentar/);
    expect(screen.getByRole('button', { name: /Pagar/ })).toBeEnabled();
  });

  it('RF-25: con la póliza emitida ofrece descargar el PDF', async () => {
    enPago({
      '/api/compras/o-1': orden({
        estado: 'PAGADA',
        poliza: { id: 'p-1', numero: 'SVAS-RIMAC-1', fechaEmision: '2026-11-05' },
      }),
    });
    expect(await screen.findByText('¡Listo! Tu póliza fue emitida')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Descargar póliza (PDF)' })).toBeInTheDocument();
  });
});
