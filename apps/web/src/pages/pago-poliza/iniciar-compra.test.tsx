import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderizar, USUARIO } from '../../test/utilidades';
import { IniciarCompra } from './IniciarCompra';

const COT = {
  id: 'c-1',
  vehiculo: { uso: 'PARTICULAR', marca: 'Toyota', modelo: 'Yaris', anio: 2022 },
  aseguradoras: [
    {
      id: 'a',
      nombre: 'Rímac',
      cotiza: true,
      planes: [{ primaCotizadaId: 'pc-1', planId: 'p', nombre: 'Intermedio', prima: 1450 }],
    },
  ],
};
const enCompra = (opciones: Parameters<typeof renderizar>[1]) =>
  renderizar(
    <Routes>
      <Route path="/comprar/:cotizacionId/:primaCotizadaId" element={<IniciarCompra />} />
      <Route path="/compra/:ordenId" element={<p>Orden creada</p>} />
    </Routes>,
    { ruta: '/comprar/c-1/pc-1?retoma=tok', ...opciones },
  );

describe('Iniciar compra (CU-02 pasos 1–2)', () => {
  it('CU-02 paso 2: sin sesión muestra el resumen y pide registro conservando la cotización (y el token de retoma)', async () => {
    enCompra({ api: { '/api/cotizaciones/c-1': COT } });
    expect(await screen.findByText('Intermedio')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ingresar o crear cuenta' })).toHaveAttribute(
      'href',
      `/login?volver=${encodeURIComponent('/comprar/c-1/pc-1?retoma=tok')}`,
    );
  });

  it('CU-02 paso 2 / RN-12: con sesión de cliente crea la orden (enviando el token de retoma) y avanza', async () => {
    const { fetchFalso } = enCompra({
      usuario: USUARIO.cliente,
      api: { '/api/cotizaciones/c-1': COT, 'POST /api/compras': { id: 'o-9' } },
    });
    expect(await screen.findByText('Orden creada')).toBeInTheDocument();
    const llamada = fetchFalso.mock.calls.find(
      ([url, init]) => url === '/api/compras' && init?.method === 'POST',
    );
    expect(JSON.parse(String(llamada![1]!.body))).toEqual({
      cotizacionId: 'c-1',
      primaCotizadaId: 'pc-1',
      tokenRetoma: 'tok',
    });
  });

  it('RF-32: un asesor no puede comprar', async () => {
    enCompra({ usuario: USUARIO.asesor, api: { '/api/cotizaciones/c-1': COT } });
    expect(await screen.findByText('Solo un cliente puede comprar.')).toBeInTheDocument();
  });
});
