import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Rol, useSesion } from '../sesion/sesion';

// RF-32 en la UI: sin sesión → login; con otro rol → aviso. (La protección real está en el backend.)
export function RutaProtegida({ roles, children }: { roles: Rol[]; children: ReactNode }) {
  const { usuario, cargando } = useSesion();
  const ubicacion = useLocation();
  if (cargando) return <p className="p-4 text-slate-600">Cargando…</p>;
  if (!usuario) return <Navigate to={`/login?volver=${encodeURIComponent(ubicacion.pathname)}`} replace />;
  if (!roles.includes(usuario.rol)) {
    return (
      <main className="mx-auto max-w-xl p-4">
        <h1 className="text-xl font-semibold text-red-700">Acceso no permitido</h1>
        <p className="mt-2 text-slate-700">Tu rol ({usuario.rol}) no puede ver esta sección.</p>
      </main>
    );
  }
  return <>{children}</>;
}
