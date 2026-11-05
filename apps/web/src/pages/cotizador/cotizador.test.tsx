import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderizar, RespuestaSimulada } from '../../test/utilidades';
import { Cotizacion } from '../../tipos/dominio';
import { Comparativo } from './Comparativo';
import { Cotizador } from './Cotizador';

const FORMULARIO = {
  aseguradoras: ['Rímac', 'Pacífico'],
  campos: [
    {
      nombre: 'uso',
      tipo: 'LISTA',
      obligatorio: true,
      valores: ['PARTICULAR', 'TRANSPORTE_PASAJEROS'],
      base: true,
    },
    { nombre: 'marca', tipo: 'LISTA', obligatorio: true, valores: ['Toyota'], base: true },
    { nombre: 'modelo', tipo: 'TEXTO', obligatorio: true, valores: [], base: true },
    { nombre: 'anio', tipo: 'NUMERO', obligatorio: true, valores: [], base: true },
    { nombre: 'color', tipo: 'TEXTO', obligatorio: false, valores: [], base: false },
  ],
};

const plan = (
  id: string,
  nombre: string,
  prima: number | null,
  motivoBloqueo: 'NO_COTIZA' | 'INSPECCION' | null = null,
) => ({
  primaCotizadaId: id,
  planId: `p-${id}`,
  nombre,
  descripcion: 'Coberturas de prueba',
  prima,
  compraInmediata: motivoBloqueo === null,
  asesoria: true,
  motivoBloqueo,
});

function cotizacion(extra: Partial<Cotizacion> = {}): Cotizacion {
  return {
    id: 'c-1',
    fecha: '2026-11-05',
    estado: 'REGISTRADA',
    opciones: ['COMPRA_INMEDIATA', 'ASESORIA'],
    motivoDerivacion: null,
    mensajeDerivacion: null,
    tieneDueno: false,
    contacto: { nombres: 'Ana', canalPreferido: 'WHATSAPP' },
    vehiculo: { uso: 'PARTICULAR', marca: 'Toyota', modelo: 'Yaris', anio: 2022, clase: null },
    solicitudAbierta: null,
    aseguradoras: [
      {
        id: 'a1',
        nombre: 'Rímac',
        cotiza: true,
        planes: [plan('r1', 'Full', 1957.5), plan('r2', 'Básico', 1087.5)],
      },
      { id: 'a2', nombre: 'La Positiva', cotiza: false, planes: [plan('l1', 'Básico', null, 'NO_COTIZA')] },
    ],
    ...extra,
  };
}

const enComparativo = (c: Cotizacion) =>
  renderizar(
    <Routes>
      <Route path="/cotizacion/:id" element={<Comparativo />} />
    </Routes>,
    { ruta: '/cotizacion/c-1', api: { '/api/cotizaciones/c-1': c } },
  );

describe('Cotizador (CU-01)', () => {
  it('RF-02: arma el formulario con los campos que manda el catálogo (incluye uno agregado por el admin)', async () => {
    renderizar(<Cotizador />, { api: { '/api/catalogo/formulario': FORMULARIO } });
    expect(await screen.findByLabelText('Uso del vehículo *')).toBeInTheDocument();
    expect(screen.getByLabelText('Año *')).toBeInTheDocument();
    expect(screen.getByLabelText('Color')).toBeInTheDocument();
    expect(screen.getByText(/Comparamos 2 aseguradoras/)).toBeInTheDocument();
  });

  it('RF-03 / RNF-08: muestra los errores del backend junto a cada campo y conserva lo ingresado', async () => {
    renderizar(<Cotizador />, {
      api: {
        '/api/catalogo/formulario': FORMULARIO,
        'POST /api/cotizaciones': new RespuestaSimulada(400, {
          mensaje: 'Revisa los datos',
          errores: {
            anio: 'Año entre 1950 y 2027',
            'contacto.telefono': 'Celular de 9 dígitos que empieza en 9',
          },
        }),
      },
    });
    const u = userEvent.setup();
    await u.type(await screen.findByLabelText('Modelo *'), 'Yaris');
    await u.click(screen.getByRole('button', { name: 'Ver precios' }));
    expect(await screen.findByText('Año entre 1950 y 2027')).toBeInTheDocument();
    expect(screen.getByText('Celular de 9 dígitos que empieza en 9')).toBeInTheDocument();
    expect(screen.getByLabelText('Modelo *')).toHaveValue('Yaris');
  });

  it('RN-05: si el vehículo está fuera de nicho muestra el mensaje y no navega', async () => {
    renderizar(<Cotizador />, {
      api: {
        '/api/catalogo/formulario': FORMULARIO,
        'POST /api/cotizaciones': { fueraDeNicho: true, mensaje: 'No aseguramos vehículos pesados' },
      },
    });
    const u = userEvent.setup();
    await u.click(await screen.findByRole('button', { name: 'Ver precios' }));
    expect(await screen.findByText('No aseguramos vehículos pesados')).toBeInTheDocument();
    // no navega: sigue en el formulario
    expect(screen.getByRole('heading', { name: 'Cotiza tu seguro vehicular' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver precios' })).toBeInTheDocument();
  });
});

describe('Comparativo (RF-05, RF-08)', () => {
  it('RF-05: ordena por precio e indica las aseguradoras que no cotizan', async () => {
    enComparativo(cotizacion());
    const tarjetas = await screen.findAllByTestId('plan');
    expect(tarjetas.map((t) => within(t).getByText(/S\/|PEN/).textContent)).toEqual([
      expect.stringContaining('1,087.50'),
      expect.stringContaining('1,957.50'),
    ]);
    expect(screen.getByTestId('sin-cotizar')).toHaveTextContent('La Positiva');
  });

  it('RF-08: cada plan muestra "Comprar ahora" (Opción 1) y "Prefiero que me asesoren" (Opción 2)', async () => {
    enComparativo(cotizacion());
    const [primera] = await screen.findAllByTestId('plan');
    expect(within(primera).getByRole('link', { name: 'Comprar ahora' })).toHaveAttribute(
      'href',
      '/comprar/c-1/r2',
    );
    expect(within(primera).getByRole('link', { name: 'Prefiero que me asesoren' })).toBeInTheDocument();
  });

  it('RF-10 / RN-03: con inspección, "Comprar ahora" está deshabilitado y explica por qué', async () => {
    enComparativo(
      cotizacion({
        opciones: ['ASESORIA'],
        motivoDerivacion: 'INSPECCION',
        mensajeDerivacion: 'Tu vehículo requiere inspección.',
        aseguradoras: [
          { id: 'a1', nombre: 'Rímac', cotiza: true, planes: [plan('r1', 'Full', 2592, 'INSPECCION')] },
        ],
      }),
    );
    const [t] = await screen.findAllByTestId('plan');
    expect(within(t).getByRole('button', { name: 'Comprar ahora' })).toBeDisabled();
    expect(within(t).getByText(/Requiere inspección/)).toBeInTheDocument();
    expect(screen.getByText('Tu caso pasó a un asesor')).toBeInTheDocument();
    expect(screen.getByText(/no necesitas dejar tu correo/)).toBeInTheDocument();
  });
});
