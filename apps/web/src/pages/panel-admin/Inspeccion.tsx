import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/cliente';
import { etiquetaValor } from '../../componentes/formato';
import { MensajeError, useCambio } from './util';

interface Fila {
  id: string;
  nombre: string;
  reglas: { uso: string; requiereInspeccion: boolean }[];
}

// RF-29 / RN-25: exigencia de inspección por aseguradora × uso.
export function Inspeccion() {
  const q = useQuery({
    queryKey: ['admin', 'inspeccion'],
    queryFn: () => api<Fila[]>('/admin/reglas-inspeccion'),
  });
  const cambio = useCambio([['admin', 'inspeccion']]);
  if (q.isLoading) return <p>Cargando…</p>;
  const usos = q.data?.[0]?.reglas.map((r) => r.uso) ?? [];
  return (
    <div className="overflow-x-auto text-sm">
      <MensajeError error={cambio.error} />
      <table className="w-full min-w-[420px] border-collapse text-left">
        <thead>
          <tr className="border-b">
            <th className="py-1">Aseguradora</th>
            {usos.map((u) => (
              <th key={u}>{etiquetaValor(u).split(' (')[0]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {q.data?.map((a) => (
            <tr key={a.id} className="border-b border-slate-100">
              <td className="py-1">{a.nombre}</td>
              {a.reglas.map((r) => (
                <td key={r.uso}>
                  <input
                    type="checkbox"
                    checked={r.requiereInspeccion}
                    aria-label={`${a.nombre} ${r.uso} requiere inspección`}
                    onChange={(e) =>
                      cambio.mutate({
                        ruta: '/admin/reglas-inspeccion',
                        metodo: 'PUT',
                        cuerpo: { aseguradoraId: a.id, uso: r.uso, requiereInspeccion: e.target.checked },
                      })
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-500">
        Marcado = solo Opción 2 (asesoría) para ese uso en esa aseguradora.
      </p>
    </div>
  );
}
