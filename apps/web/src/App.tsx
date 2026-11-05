import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { api } from './api/cliente';
import { AvisoSimulacion } from './componentes/AvisoSimulacion';
import { Encabezado } from './componentes/Encabezado';
import { RutaProtegida } from './componentes/RutaProtegida';
import { Inicio } from './pages/inicio/Inicio';
import { Login } from './pages/login/Login';
import { MisTramites } from './pages/mis-tramites/MisTramites';
import { PanelAdmin } from './pages/panel-admin/PanelAdmin';
import { PanelAsesor } from './pages/panel-asesor/PanelAsesor';
import { ProveedorSesion } from './sesion/sesion';

export function Rutas({ demoHabilitado = false }: { demoHabilitado?: boolean }) {
  return (
    <>
      <AvisoSimulacion />
      <Encabezado demoHabilitado={demoHabilitado} />
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
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

export default function App() {
  const [demoHabilitado, setDemoHabilitado] = useState(false);
  useEffect(() => {
    api<{ demoHabilitado: boolean }>('/salud')
      .then((s) => setDemoHabilitado(s.demoHabilitado))
      .catch(() => setDemoHabilitado(false));
  }, []);
  return (
    <BrowserRouter>
      <ProveedorSesion>
        <Rutas demoHabilitado={demoHabilitado} />
      </ProveedorSesion>
    </BrowserRouter>
  );
}
