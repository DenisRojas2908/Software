import { Link, useNavigate } from 'react-router-dom';
import { useSesion } from '../sesion/sesion';

// Menú según rol (RF-32). Mobile-first: los enlaces se envuelven en pantallas de 360 px.
export function Encabezado({ demoHabilitado = false }: { demoHabilitado?: boolean }) {
  const { usuario, cerrar } = useSesion();
  const navegar = useNavigate();
  const enlace = 'rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-100';
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav
        className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-4 py-2"
        aria-label="Menú principal"
      >
        <Link to="/" className="mr-auto text-lg font-bold text-indigo-700">
          SVAS
        </Link>
        <Link to="/cotizar" className={enlace}>
          Cotizar
        </Link>
        {usuario?.rol === 'CLIENTE' && (
          <Link to="/mis-tramites" className={enlace}>
            Mis trámites
          </Link>
        )}
        {usuario?.rol === 'ASESOR' && (
          <Link to="/asesor" className={enlace}>
            Panel asesor
          </Link>
        )}
        {usuario?.rol === 'ADMINISTRADOR' && (
          <Link to="/admin" className={enlace}>
            Panel admin
          </Link>
        )}
        {usuario?.rol === 'ADMINISTRADOR' && demoHabilitado && (
          <Link to="/demo" className={enlace}>
            Demo
          </Link>
        )}
        {usuario ? (
          <button
            className={enlace}
            onClick={() => {
              cerrar();
              navegar('/');
            }}
          >
            Salir
          </button>
        ) : (
          <Link to="/login" className={enlace}>
            Ingresar
          </Link>
        )}
      </nav>
    </header>
  );
}
