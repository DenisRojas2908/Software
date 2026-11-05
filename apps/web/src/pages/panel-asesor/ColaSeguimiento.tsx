import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, ErrorApi } from '../../api/cliente';
import { claseBoton, claseBotonSecundario, claseInput } from '../../componentes/Campo';
import { etiquetaValor, formatoSoles } from '../../componentes/formato';

interface Seguimiento {
  id: string;
  estado: string;
  intentos: number;
  intentosRestantes: number;
  limite: string;
  motivoCierre: string | null;
  canalPreferido: 'LLAMADA' | 'WHATSAPP';
  cliente: { nombres: string; telefono: string };
  vehiculo: string;
  planSugerido: { aseguradora: string; plan: string; prima: number } | null;
  primeraCompra: boolean | null;
  historial: { canal: string; fecha: string; resultado: string; asesor: string }[];
  enlace: { expiraEn: string; vigente: boolean } | null;
  mensajeFinal: 'ENVIADO' | 'FALLIDO' | null;
  puedeContactar: { permitido: boolean; motivo?: string };
}

const MOTIVOS = ['PRECIO', 'YA_CONTRATO', 'NO_RESPONDE', 'SIN_INTERES', 'OTRO'];
const RESULTADOS = ['CONTACTADO', 'NO_RESPONDE', 'RECHAZA', 'ACEPTA'];

// CU-04: cola de seguimiento con intentos hechos/restantes; solo por el canal preferido (RN-10).
export function ColaSeguimiento() {
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const cola = useQuery({
    queryKey: ['cola-seguimiento'],
    queryFn: () => api<Seguimiento[]>('/asesor/seguimientos'),
  });
  if (seleccion) return <DetalleSeguimiento id={seleccion} volver={() => setSeleccion(null)} />;
  if (cola.isLoading) return <p>Cargando…</p>;
  if (cola.isError) return <p className="text-red-700">{cola.error.message}</p>;
  if (!cola.data!.length) return <p className="text-slate-600">No hay casos en seguimiento.</p>;
  return (
    <ul className="flex flex-col gap-2" aria-label="Cola de seguimiento">
      {cola.data!.map((s) => (
        <li
          key={s.id}
          data-testid="seguimiento"
          className="flex flex-wrap items-center gap-2 rounded border border-slate-200 bg-white p-3 text-sm"
        >
          <span className="font-medium">{s.vehiculo}</span>
          <span className="text-slate-600">
            · {s.cliente.nombres} · {etiquetaValor(s.canalPreferido)}
          </span>
          {s.planSugerido && (
            <span className="text-slate-600">
              · {s.planSugerido.aseguradora} {s.planSugerido.plan} {formatoSoles(s.planSugerido.prima)}
            </span>
          )}
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
            {s.intentos} intentos · quedan {s.intentosRestantes}
          </span>
          <button className="ml-auto text-indigo-700 underline" onClick={() => setSeleccion(s.id)}>
            Abrir
          </button>
        </li>
      ))}
    </ul>
  );
}

function DetalleSeguimiento({ id, volver }: { id: string; volver: () => void }) {
  const qc = useQueryClient();
  const clave = ['seguimiento', id];
  const q = useQuery({ queryKey: clave, queryFn: () => api<Seguimiento>(`/asesor/seguimientos/${id}`) });
  const [resultado, setResultado] = useState('NO_RESPONDE');
  const [motivo, setMotivo] = useState('');
  const accion = useMutation({
    mutationFn: ({ ruta, cuerpo }: { ruta: string; cuerpo?: unknown }) =>
      api<Seguimiento>(`/asesor/seguimientos/${id}/${ruta}`, { cuerpo: cuerpo ?? {} }),
    onSuccess: (d) => {
      qc.setQueryData(clave, d);
      qc.invalidateQueries({ queryKey: ['cola-seguimiento'] });
    },
  });
  if (q.isLoading) return <p>Cargando caso…</p>;
  if (q.isError) return <p className="text-red-700">{q.error.message}</p>;
  const s = q.data!;
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
        <p className="font-semibold">{s.vehiculo}</p>
        <p>
          {s.cliente.nombres} · {s.cliente.telefono} · solo por{' '}
          <strong>{etiquetaValor(s.canalPreferido)}</strong>
        </p>
        {s.planSugerido && (
          <p>
            Plan: {s.planSugerido.aseguradora} {s.planSugerido.plan} · {formatoSoles(s.planSugerido.prima)}
          </p>
        )}
        <p>
          Descuento de primera compra:{' '}
          {s.primeraCompra === null
            ? 'se evalúa con el DNI al comprar'
            : s.primeraCompra
              ? 'aplica'
              : 'no aplica (ya tuvo póliza)'}
        </p>
        <p data-testid="estado-seguimiento">
          Estado: {etiquetaValor(s.estado)} {s.motivoCierre ? `(${etiquetaValor(s.motivoCierre)})` : ''} ·{' '}
          {s.intentos} intentos, quedan {s.intentosRestantes} · hasta{' '}
          {new Date(s.limite).toLocaleDateString('es-PE')}
        </p>
        {s.enlace && (
          <p>
            Enlace de retoma {s.enlace.vigente ? 'vigente' : 'vencido'} hasta{' '}
            {new Date(s.enlace.expiraEn).toLocaleDateString('es-PE')}
          </p>
        )}
        {s.mensajeFinal && (
          <p>Mensaje final: {s.mensajeFinal === 'ENVIADO' ? 'enviado' : 'falló el envío'}</p>
        )}
      </div>

      {s.historial.length > 0 && (
        <ol className="list-decimal pl-5" aria-label="Intentos">
          {s.historial.map((h, i) => (
            <li key={i}>
              {new Date(h.fecha).toLocaleString('es-PE')} · {etiquetaValor(h.canal)} ·{' '}
              {etiquetaValor(h.resultado)}
            </li>
          ))}
        </ol>
      )}

      {s.estado === 'EN_SEGUIMIENTO' && (
        <div className="flex flex-col gap-3 rounded border border-slate-200 bg-slate-50 p-3">
          {s.puedeContactar.permitido ? (
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1">
                Resultado del intento por {etiquetaValor(s.canalPreferido)}
                <select
                  className={claseInput}
                  value={resultado}
                  onChange={(e) => setResultado(e.target.value)}
                  aria-label="Resultado del intento"
                >
                  {RESULTADOS.map((r) => (
                    <option key={r} value={r}>
                      {etiquetaValor(r)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className={claseBoton}
                onClick={() =>
                  accion.mutate({ ruta: 'intentos', cuerpo: { canal: s.canalPreferido, resultado } })
                }
              >
                Registrar intento
              </button>
            </div>
          ) : (
            <p className="text-amber-800">{s.puedeContactar.motivo}</p>
          )}
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1">
              Motivo de cierre (obligatorio)
              <select
                className={claseInput}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                aria-label="Motivo de cierre"
              >
                <option value="">Elige…</option>
                {MOTIVOS.map((m) => (
                  <option key={m} value={m}>
                    {etiquetaValor(m)}
                  </option>
                ))}
              </select>
            </label>
            <button
              className={claseBotonSecundario}
              onClick={() => accion.mutate({ ruta: 'cerrar', cuerpo: motivo ? { motivo } : {} })}
            >
              Cerrar caso
            </button>
          </div>
        </div>
      )}
      {s.mensajeFinal === 'FALLIDO' && (
        <button className={claseBotonSecundario} onClick={() => accion.mutate({ ruta: 'reenviar-mensaje' })}>
          Reenviar mensaje final
        </button>
      )}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
