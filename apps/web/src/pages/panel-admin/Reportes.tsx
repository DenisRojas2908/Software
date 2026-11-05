import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../api/cliente';
import { claseInput } from '../../componentes/Campo';
import { etiquetaValor, formatoSoles } from '../../componentes/formato';

interface Reporte {
  total: { polizas: number; primaTotal: number };
  filas: { grupo: string; polizas: number; primaTotal: number }[];
}

// RF-30: ventas por canal (autónomo, asesoría, telemarketing), aseguradora y plan, en un periodo.
export function Reportes() {
  const [agrupar, setAgrupar] = useState<'canal' | 'aseguradora' | 'plan'>('canal');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const params = new URLSearchParams({ agrupar, ...(desde ? { desde } : {}), ...(hasta ? { hasta } : {}) });
  const q = useQuery({
    queryKey: ['admin', 'reporte', params.toString()],
    queryFn: () => api<Reporte>(`/admin/reportes/ventas?${params}`),
  });
  const datos =
    q.data?.filas.map((f) => ({ ...f, nombre: agrupar === 'canal' ? etiquetaValor(f.grupo) : f.grupo })) ??
    [];
  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col">
          Agrupar por
          <select
            className={claseInput}
            value={agrupar}
            onChange={(e) => setAgrupar(e.target.value as typeof agrupar)}
            aria-label="Agrupar por"
          >
            <option value="canal">Canal</option>
            <option value="aseguradora">Aseguradora</option>
            <option value="plan">Plan</option>
          </select>
        </label>
        <label className="flex flex-col">
          Desde
          <input
            type="date"
            className={claseInput}
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            aria-label="Desde"
          />
        </label>
        <label className="flex flex-col">
          Hasta
          <input
            type="date"
            className={claseInput}
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            aria-label="Hasta"
          />
        </label>
      </div>
      {q.data && (
        <>
          <p data-testid="total">
            Total: <strong>{q.data.total.polizas}</strong> pólizas ·{' '}
            <strong>{formatoSoles(q.data.total.primaTotal)}</strong>
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <BarChart data={datos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" tick={{ fontSize: 11 }} interval={0} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="polizas" name="Pólizas" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="w-full border-collapse text-left" aria-label="Ventas">
            <thead>
              <tr className="border-b">
                <th className="py-1">
                  {agrupar === 'canal' ? 'Canal' : agrupar === 'aseguradora' ? 'Aseguradora' : 'Plan'}
                </th>
                <th className="text-right">Pólizas</th>
                <th className="text-right">Prima total</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((f) => (
                <tr key={f.grupo} className="border-b border-slate-100">
                  <td className="py-1">{f.nombre}</td>
                  <td className="text-right">{f.polizas}</td>
                  <td className="text-right">{formatoSoles(f.primaTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
