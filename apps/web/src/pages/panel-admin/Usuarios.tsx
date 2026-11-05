import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../api/cliente';
import { claseBoton, claseInput } from '../../componentes/Campo';
import { MensajeError, useCambio } from './util';

interface Usuario {
  id: string;
  email: string;
  rol: string;
  activo: boolean;
}

// RF-31: el administrador crea asesores y activa/desactiva usuarios (desactivar, no borrar).
export function Usuarios() {
  const q = useQuery({ queryKey: ['admin', 'usuarios'], queryFn: () => api<Usuario[]>('/admin/usuarios') });
  const cambio = useCambio([['admin', 'usuarios']]);
  const [nuevo, setNuevo] = useState({ email: '', contrasena: '', rol: 'ASESOR' });
  return (
    <div className="flex flex-col gap-3 text-sm">
      <MensajeError error={cambio.error} />
      <ul className="flex flex-col gap-1">
        {q.data?.map((u) => (
          <li
            key={u.id}
            className="flex flex-wrap items-center gap-2 rounded border border-slate-200 bg-white px-3 py-2"
          >
            <span className="font-medium">{u.email}</span>
            <span className="rounded bg-slate-100 px-2 text-xs">{u.rol}</span>
            <label className="ml-auto flex items-center gap-1">
              <input
                type="checkbox"
                checked={u.activo}
                aria-label={`${u.email} activo`}
                onChange={(e) =>
                  cambio.mutate({
                    ruta: `/admin/usuarios/${u.id}`,
                    metodo: 'PATCH',
                    cuerpo: { activo: e.target.checked },
                  })
                }
              />
              activo
            </label>
          </li>
        ))}
      </ul>
      <form
        className="grid gap-2 rounded border border-slate-200 bg-slate-50 p-3 sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          cambio.mutate({ ruta: '/admin/usuarios', metodo: 'POST', cuerpo: nuevo });
        }}
      >
        <input
          className={claseInput}
          placeholder="correo"
          value={nuevo.email}
          onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })}
          aria-label="Correo del usuario"
        />
        <input
          className={claseInput}
          type="password"
          placeholder="contraseña"
          value={nuevo.contrasena}
          onChange={(e) => setNuevo({ ...nuevo, contrasena: e.target.value })}
          aria-label="Contraseña del usuario"
        />
        <select
          className={claseInput}
          value={nuevo.rol}
          onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })}
          aria-label="Rol del usuario"
        >
          <option value="ASESOR">Asesor</option>
          <option value="ADMINISTRADOR">Administrador</option>
        </select>
        <button className={claseBoton}>Crear usuario</button>
      </form>
    </div>
  );
}
