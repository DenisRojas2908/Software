import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { almacenSesion, api } from '../api/cliente';

export type Rol = 'CLIENTE' | 'ASESOR' | 'ADMINISTRADOR';
export interface UsuarioSesion {
  id: string;
  email: string;
  rol: Rol;
}

interface ValorSesion {
  usuario: UsuarioSesion | null;
  cargando: boolean;
  iniciar: (token: string, usuario: UsuarioSesion) => void;
  cerrar: () => void;
}

const SesionContexto = createContext<ValorSesion | null>(null);

// Contexto de sesión: guarda el usuario autenticado y lo comparte con toda la app (como una variable global controlada).
export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(() => almacenSesion.leer() !== null);

  useEffect(() => {
    if (!almacenSesion.leer()) return;
    api<UsuarioSesion>('/auth/yo')
      .then((u) => setUsuario({ id: u.id, email: u.email, rol: u.rol }))
      .catch(() => almacenSesion.guardar(null))
      .finally(() => setCargando(false));
  }, []);

  const iniciar = useCallback((token: string, u: UsuarioSesion) => {
    almacenSesion.guardar(token);
    setUsuario(u);
  }, []);
  const cerrar = useCallback(() => {
    almacenSesion.guardar(null);
    setUsuario(null);
  }, []);

  const valor = useMemo(() => ({ usuario, cargando, iniciar, cerrar }), [usuario, cargando, iniciar, cerrar]);
  return <SesionContexto.Provider value={valor}>{children}</SesionContexto.Provider>;
}

export function useSesion(): ValorSesion {
  const v = useContext(SesionContexto);
  if (!v) throw new Error('useSesion fuera de ProveedorSesion');
  return v;
}
