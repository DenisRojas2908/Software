import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/cliente';
import { MensajeError, useCambio } from './util';

interface Aseguradora {
  id: string;
  nombre: string;
  activa: boolean;
  codigoEstrategia: string;
  planes: { id: string; nombre: string; activo: boolean; descripcion: string }[];
}

// RF-27 / RN-16: activar y desactivar aseguradoras y planes (desactivar, no borrar).
export function Catalogo() {
  const q = useQuery({
    queryKey: ['admin', 'aseguradoras'],
    queryFn: () => api<Aseguradora[]>('/admin/aseguradoras'),
  });
  const cambio = useCambio([['admin', 'aseguradoras'], ['formulario']]);
  if (q.isLoading) return <p>Cargando…</p>;
  return (
    <div className="flex flex-col gap-3">
      <MensajeError error={cambio.error} />
      {q.data?.map((a) => (
        <section
          key={a.id}
          className="rounded border border-slate-200 bg-white p-3 text-sm"
          data-testid="aseguradora"
        >
          <label className="flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              checked={a.activa}
              aria-label={`${a.nombre} activa`}
              onChange={(e) =>
                cambio.mutate({
                  ruta: `/admin/aseguradoras/${a.id}`,
                  metodo: 'PATCH',
                  cuerpo: { activa: e.target.checked },
                })
              }
            />
            {a.nombre} <span className="text-xs font-normal text-slate-500">({a.codigoEstrategia})</span>
            {!a.activa && <span className="rounded bg-slate-200 px-2 text-xs">inactiva</span>}
          </label>
          <ul className="mt-2 flex flex-wrap gap-3 pl-6">
            {a.planes.map((p) => (
              <li key={p.id}>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={p.activo}
                    aria-label={`${a.nombre} ${p.nombre} activo`}
                    onChange={(e) =>
                      cambio.mutate({
                        ruta: `/admin/planes/${p.id}`,
                        metodo: 'PATCH',
                        cuerpo: { activo: e.target.checked },
                      })
                    }
                  />
                  {p.nombre}
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
