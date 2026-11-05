import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { api } from './api/cliente';
import { AvisoSimulacion } from './componentes/AvisoSimulacion';
import { Encabezado } from './componentes/Encabezado';
import { RutaProtegida } from './componentes/RutaProtegida';
import { Comparativo } from './pages/cotizador/Comparativo';
import { Cotizador } from './pages/cotizador/Cotizador';
import { Inicio } from './pages/inicio/Inicio';
import { Login } from './pages/login/Login';
import { MisTramites } from './pages/mis-tramites/MisTramites';
import { PanelAdmin } from './pages/panel-admin/PanelAdmin';
import { PagoPoliza } from './pages/pago-poliza/PagoPoliza';
import { PanelAsesor } from './pages/panel-asesor/PanelAsesor';
import { SeleccionCanal } from './pages/seleccion-canal/SeleccionCanal';
import { ProveedorSesion } from './sesion/sesion';

export function Rutas({ demoHabilitado = false }: { demoHabilitado?: boolean }) {
  return (
    <>
      <AvisoSimulacion />
      <Encabezado demoHabilitado={demoHabilitado} />
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cotizar" element={<Cotizador />} />
        <Route path="/cotizacion/:id" element={<Comparativo />} />
        <Route path="/comprar/:cotizacionId/:primaCotizadaId" element={<PagoPoliza />} />
        <Route path="/asesoria/:cotizacionId" element={<SeleccionCanal />} />
        <Route
          path="/mis-tramites"
          element={
            <RutaProtegida roles={['CLIENTE']}>
              <MisTramites />
            </RutaProtegida>
          }
        />
        <Route
          path="/asesor"
          element={
            <RutaProtegida roles={['ASESOR']}>
              <PanelAsesor />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin"
          element={
            <RutaProtegida roles={['ADMINISTRADOR']}>
              <PanelAdmin />
            </RutaProtegida>
          }
        />
        <Route path="*" element={<p className="p-4">Página no encontrada.</p>} />
      </Routes>
    </>
  );
}

// Caché de datos remotos (TanStack Query): evita pedir dos veces lo mismo y maneja cargando/error.
const clienteConsultas = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

export default function App() {
  const [demoHabilitado, setDemoHabilitado] = useState(false);
  useEffect(() => {
    api<{ demoHabilitado: boolean }>('/salud')
      .then((s) => setDemoHabilitado(s.demoHabilitado))
      .catch(() => setDemoHabilitado(false));
  }, []);
  return (
    <QueryClientProvider client={clienteConsultas}>
      <BrowserRouter>
        <ProveedorSesion>
          <Rutas demoHabilitado={demoHabilitado} />
        </ProveedorSesion>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
