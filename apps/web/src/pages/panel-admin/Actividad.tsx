import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/cliente';

interface Registro {
  id: string;
  accion: string;
  entidad: string;
  fecha: string;
  usuario: { email: string } | null;
}

// RNF-12: acciones críticas recientes con usuario y fecha.
export function Actividad() {
  const q = useQuery({
    queryKey: ['admin', 'actividad'],
    queryFn: () => api<Registro[]>('/admin/actividad'),
  });
  return (
    <ol className="flex flex-col gap-1 text-xs">
      {q.data?.map((r) => (
        <li key={r.id} className="rounded border border-slate-100 bg-white px-2 py-1">
          <span className="text-slate-500">{new Date(r.fecha).toLocaleString('es-PE')}</span> ·{' '}
          <strong>{r.accion}</strong> · {r.entidad} · {r.usuario?.email ?? 'invitado / sistema'}
        </li>
      ))}
    </ol>
  );
}
