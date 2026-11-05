import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderizar, RespuestaSimulada } from '../../test/utilidades';
import { Retomar } from './Retomar';

const enRetoma = (respuesta: unknown) =>
  renderizar(
    <Routes>
      <Route path="/retomar/:token" element={<Retomar />} />
    </Routes>,
    { ruta: '/retomar/tok', api: { '/api/retoma/tok': respuesta } },
  );

describe('Retomar compra (RN-12)', () => {
  it('RN-12: con enlace vigente ofrece comprar el plan con el token de retoma', async () => {
    enRetoma({
      cotizacionId: 'c-1',
      expiraEn: '2026-11-12T10:00:00Z',
      descuentoPrimeraCompra: 5,
      planSugerido: { primaCotizadaId: 'pc-1', aseguradora: 'Quálitas', plan: 'Básico', prima: 900 },
      cotizacion: { vehiculo: { marca: 'Toyota', modelo: 'Yaris', anio: 2022 } },
    });
    expect(await screen.findByRole('link', { name: 'Comprar con este plan' })).toHaveAttribute(
      'href',
      '/comprar/c-1/pc-1?retoma=tok',
    );
    expect(screen.getByText(/5 % de descuento/)).toBeInTheDocument();
  });

  it('CU-04 7b: con enlace vencido informa y ofrece volver a cotizar', async () => {
    enRetoma(
      new RespuestaSimulada(410, {
        mensaje: 'Este enlace ya venció. Puedes volver a cotizar.',
        vencido: true,
      }),
    );
    expect(await screen.findByRole('heading', { name: 'Este enlace ya venció' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver a cotizar' })).toHaveAttribute('href', '/cotizar');
  });
});
