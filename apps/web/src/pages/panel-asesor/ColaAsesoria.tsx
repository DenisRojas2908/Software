import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, ErrorApi } from '../../api/cliente';
import { claseBoton, claseBotonSecundario, claseInput } from '../../componentes/Campo';
import { etiquetaValor, formatoSoles } from '../../componentes/formato';
import { Cotizacion } from '../../tipos/dominio';

interface ItemCola {
  id: string;
  motivo: string;
  origen: 'SISTEMA' | 'CLIENTE';
  estado: string;
  canal: string;
  fechaCreacion: string;
  asesor: string | null;
  cliente: string;
  vehiculo: string;
  uso: string;
}
interface Detalle {
  id: string;
  motivo: string;
  origen: 'SISTEMA' | 'CLIENTE';
  estado: string;
  canal: string;
  resultado: string | null;
  esMia: boolean;
  cliente: {
    nombres: string;
    apellidos: string | null;
    telefono: string;
    email: string | null;
    canalPreferido: string;
  };
  descuentoMaximo: number;
  descuentos: { planId: string; porcentaje: number; aceptado: boolean }[];
  cotizacion: Cotizacion;
}

// CU-03 lado asesor: cola priorizada (RN-13) → tomar → ver todo → prima manual / descuento ≤ máximo → resultado.
export function ColaAsesoria() {
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const cola = useQuery({ queryKey: ['cola-asesoria'], queryFn: () => api<ItemCola[]>('/asesor/cola') });
  if (seleccion) return <DetalleCaso id={seleccion} volver={() => setSeleccion(null)} />;
  if (cola.isLoading) return <p>Cargando cola…</p>;
  if (cola.isError) return <p className="text-red-700">{cola.error.message}</p>;
  if (!cola.data!.length) return <p className="text-slate-600">No hay solicitudes pendientes.</p>;
  return (
    <ul className="flex flex-col gap-2" aria-label="Cola de asesoría">
      {cola.data!.map((s) => (
        <li
          key={s.id}
          data-testid="caso"
          className="flex flex-wrap items-center gap-2 rounded border border-slate-200 bg-white p-3 text-sm"
        >
          {s.origen === 'SISTEMA' && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
              Derivado
            </span>
          )}
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{etiquetaValor(s.motivo)}</span>
          <span className="font-medium">{s.vehiculo}</span>
          <span className="text-slate-600">
            · {s.cliente} · {etiquetaValor(s.canal)}
          </span>
          <span className="text-slate-500">
            · {etiquetaValor(s.estado)}
            {s.asesor ? ` (${s.asesor})` : ''}
          </span>
          <button className="ml-auto text-indigo-700 underline" onClick={() => setSeleccion(s.id)}>
            Abrir
          </button>
        </li>
      ))}
    </ul>
  );
}

function DetalleCaso({ id, volver }: { id: string; volver: () => void }) {
  const qc = useQueryClient();
  const clave = ['solicitud', id];
  const q = useQuery({ queryKey: clave, queryFn: () => api<Detalle>(`/asesor/solicitudes/${id}`) });
  const [planId, setPlanId] = useState('');
  const [porcentaje, setPorcentaje] = useState('');
  const [primaManual, setPrimaManual] = useState('');
  const accion = useMutation({
    mutationFn: ({ ruta, cuerpo }: { ruta: string; cuerpo?: unknown }) =>
      api<Detalle>(`/asesor/solicitudes/${id}/${ruta}`, { cuerpo: cuerpo ?? {} }),
    onSuccess: (d) => {
      qc.setQueryData(clave, d);
      qc.invalidateQueries({ queryKey: ['cola-asesoria'] });
    },
  });
  if (q.isLoading) return <p>Cargando caso…</p>;
  if (q.isError) return <p className="text-red-700">{q.error.message}</p>;
  const d = q.data!;
  const planes = d.cotizacion.aseguradoras.flatMap((a) =>
    a.planes.map((p) => ({ ...p, aseguradora: a.nombre })),
  );
  const elegido = planes.find((p) => p.planId === planId);
  const enAtencion = d.estado === 'EN_ATENCION' && d.esMia;
  const error =
    accion.error instanceof ErrorApi
      ? (Object.values(accion.error.errores)[0] ?? accion.error.message)
      : accion.error?.message;

  return (
    <section className="flex flex-col gap-3 text-sm">
      <button className="self-start text-indigo-700 underline" onClick={volver}>
        ← Volver a la cola
      </button>
      <div className="rounded border border-slate-200 bg-white p-3">
        <p className="font-semibold">
          {d.cotizacion.vehiculo.marca} {d.cotizacion.vehiculo.modelo} {d.cotizacion.vehiculo.anio} ·{' '}
          {etiquetaValor(d.cotizacion.vehiculo.uso)}
        </p>
        <p>
          {d.origen === 'SISTEMA' ? 'Derivado por el sistema' : 'Pedido por el cliente'} · motivo{' '}
          {etiquetaValor(d.motivo)} · {etiquetaValor(d.estado)}
        </p>
        <p>
          Cliente: {d.cliente.nombres} {d.cliente.apellidos ?? ''} · {d.cliente.telefono} · contactar por{' '}
          <strong>{etiquetaValor(d.canal)}</strong>
        </p>
      </div>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b">
            <th className="py-1">Aseguradora</th>
            <th>Plan</th>
            <th className="text-right">Prima</th>
          </tr>
        </thead>
        <tbody>
          {planes.map((p) => (
            <tr key={p.primaCotizadaId} className="border-b border-slate-100">
              <td className="py-1">{p.aseguradora}</td>
              <td>{p.nombre}</td>
              <td className="text-right">{p.prima === null ? 'no cotiza' : formatoSoles(p.prima)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {d.estado === 'PENDIENTE' && (
        <button className={claseBoton} onClick={() => accion.mutate({ ruta: 'tomar' })}>
          Tomar caso
        </button>
      )}

      {enAtencion && (
        <div className="flex flex-col gap-3 rounded border border-slate-200 bg-slate-50 p-3">
          <label className="flex flex-col gap-1">
            Plan
            <select
              className={claseInput}
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              aria-label="Plan"
            >
              <option value="">Elige…</option>
              {planes.map((p) => (
                <option key={p.planId} value={p.planId}>
                  {p.aseguradora} · {p.nombre}
                </option>
              ))}
            </select>
          </label>
          {elegido?.prima === null && (
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1">
                Prima manual (S/)
                <input
                  className={claseInput}
                  inputMode="decimal"
                  value={primaManual}
                  onChange={(e) => setPrimaManual(e.target.value)}
                />
              </label>
              <button
                className={claseBotonSecundario}
                onClick={() =>
                  accion.mutate({
                    ruta: 'prima',
                    cuerpo: { primaCotizadaId: elegido.primaCotizadaId, prima: primaManual },
                  })
                }
              >
                Registrar prima
              </button>
            </div>
          )}
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1">
              Descuento (%) · máximo {d.descuentoMaximo} %
              <input
                className={claseInput}
                inputMode="decimal"
                value={porcentaje}
                onChange={(e) => setPorcentaje(e.target.value)}
                aria-label="Descuento (%)"
              />
            </label>
            <button
              className={claseBotonSecundario}
              disabled={!planId}
              onClick={() => accion.mutate({ ruta: 'descuento', cuerpo: { planId, porcentaje } })}
            >
              Registrar descuento
            </button>
          </div>
          {d.descuentos.map((x) => (
            <p key={x.planId}>
              Descuento negociado: {x.porcentaje} % {x.aceptado ? '(aceptado)' : '(ofrecido)'}
            </p>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              className={claseBoton}
              onClick={() => accion.mutate({ ruta: 'resultado', cuerpo: { resultado: 'ACEPTA' } })}
            >
              Cliente acepta
            </button>
            <button
              className={claseBotonSecundario}
              onClick={() => accion.mutate({ ruta: 'resultado', cuerpo: { resultado: 'NO_ACEPTA' } })}
            >
              No acepta
            </button>
            <button
              className={claseBotonSecundario}
              onClick={() => accion.mutate({ ruta: 'resultado', cuerpo: { resultado: 'NO_RESPONDE' } })}
            >
              No responde
            </button>
          </div>
        </div>
      )}
      {d.estado === 'CERRADA' && (
        <p className="font-medium">Caso cerrado: {etiquetaValor(d.resultado ?? '')}</p>
      )}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
