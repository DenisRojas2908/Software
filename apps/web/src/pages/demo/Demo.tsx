import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../api/cliente';
import { claseBoton, claseBotonSecundario } from '../../componentes/Campo';
import { etiquetaValor } from '../../componentes/formato';
import { useSesion } from '../../sesion/sesion';

interface EstadoDemo {
  diasAdelantados: number;
  ahora: string;
  fallos: { pagoRechazado: boolean; emisionFallida: boolean; aseguradoraCaida: string | null; envioMensajeFallido: boolean };
}
interface Mensaje {
  fecha: string;
  tipo: string;
  canal: string;
  telefono: string;
  cliente: string;
  enlace: string | null;
  vigente: boolean;
  resultado: 'ENVIADO' | 'FALLIDO';
}

const FALLOS = [
  ['pagoRechazado', 'Pago rechazado (CU-02 5a)'],
  ['emisionFallida', 'Emisión fallida → rollback (CU-02 6a, RNF-05)'],
  ['envioMensajeFallido', 'Falla el envío del mensaje final (CU-04 7a)'],
] as const;

// F8 · Modo simulación (solo DEMO_MODE=true y ADMINISTRADOR): reloj, fallos forzados, abandonos, buzón y reinicio.
export function Demo() {
  const qc = useQueryClient();
  const { cerrar } = useSesion();
  const estado = useQuery({ queryKey: ['demo'], queryFn: () => api<EstadoDemo>('/demo/estado') });
  const buzon = useQuery({ queryKey: ['demo', 'buzon'], queryFn: () => api<Mensaje[]>('/demo/buzon') });
  const accion = useMutation({
    mutationFn: ({ ruta, cuerpo }: { ruta: string; cuerpo?: unknown }) => api<{ mensaje?: string }>(`/demo/${ruta}`, { cuerpo: cuerpo ?? {} }),
    onSuccess: (r, v) => {
      if (v.ruta === 'reset') cerrar(); // los usuarios se recrean: hay que volver a ingresar
      qc.invalidateQueries();
    },
  });
  const e = estado.data;
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 text-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Modo demo</h1>
      <p className="text-slate-600">Herramientas de la simulación para la sustentación. No existen si DEMO_MODE no está activo.</p>

      <section className="mt-4 rounded border border-slate-200 bg-white p-3">
        <h2 className="font-semibold">Reloj (D-07)</h2>
        <p data-testid="reloj">
          Hoy simulado: {e ? new Date(e.ahora).toLocaleString('es-PE') : '…'} · días adelantados: {e?.diasAdelantados ?? 0}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[1, 8].map((d) => (
            <button key={d} className={claseBotonSecundario} onClick={() => accion.mutate({ ruta: 'reloj', cuerpo: { dias: d } })}>
              Adelantar {d} {d === 1 ? 'día' : 'días'}
            </button>
          ))}
          <button className={claseBotonSecundario} onClick={() => accion.mutate({ ruta: 'reloj/reiniciar' })}>
            Volver a hoy
          </button>
        </div>
      </section>

      <section className="mt-3 rounded border border-slate-200 bg-white p-3">
        <h2 className="font-semibold">Forzar fallos</h2>
        {FALLOS.map(([k, etiqueta]) => (
          <label key={k} className="mt-1 flex items-center gap-2">
            <input type="checkbox" checked={!!e?.fallos[k]} onChange={(ev) => accion.mutate({ ruta: 'fallos', cuerpo: { [k]: ev.target.checked } })} /> {etiqueta}
          </label>
        ))}
        <label className="mt-1 flex items-center gap-2">
          Aseguradora caída (CU-01 4a):
          <select
            className="rounded border border-slate-300 px-2 py-1"
            value={e?.fallos.aseguradoraCaida ?? ''}
            onChange={(ev) => accion.mutate({ ruta: 'fallos', cuerpo: { aseguradoraCaida: ev.target.value || null } })}
            aria-label="Aseguradora caída"
          >
            <option value="">ninguna</option>
            {['RIMAC', 'PACIFICO', 'LA_POSITIVA', 'MAPFRE', 'QUALITAS'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="mt-3 flex flex-wrap gap-2">
        <button className={claseBoton} onClick={() => accion.mutate({ ruta: 'procesar-abandonos' })}>
          Procesar abandonos
        </button>
        <button
          className={claseBotonSecundario}
          onClick={() => {
            if (window.confirm('¿Reiniciar la BD con el seed de demo? Se cerrará tu sesión.')) accion.mutate({ ruta: 'reset' });
          }}
        >
          Reiniciar BD
        </button>
      </section>
      {accion.data?.mensaje && (
        <p role="status" className="mt-2 text-green-800">
          {accion.data.mensaje}
        </p>
      )}
      {accion.isError && (
        <p role="alert" className="mt-2 text-red-700">
          {accion.error.message}
        </p>
      )}

      <section className="mt-4">
        <h2 className="font-semibold">Buzón de mensajes simulados (D-06)</h2>
        {!buzon.data?.length && <p className="text-slate-600">Sin mensajes todavía.</p>}
        <ul className="mt-2 flex flex-col gap-2">
          {buzon.data?.map((m, i) => (
            <li key={i} className="rounded border border-slate-200 bg-white p-2" data-testid="mensaje">
              <p className="text-xs text-slate-500">
                {new Date(m.fecha).toLocaleString('es-PE')} · {m.tipo === 'MENSAJE_FINAL' ? 'Mensaje final' : 'Enlace de retoma'} · {etiquetaValor(m.canal)} ·{' '}
                {m.telefono} · {m.resultado === 'ENVIADO' ? 'enviado' : 'falló'}
              </p>
              <p>
                Para {m.cliente}:{' '}
                {m.enlace ? (
                  <Link to={m.enlace} className="text-indigo-700 underline">
                    {m.enlace}
                  </Link>
                ) : (
                  '—'
                )}{' '}
                {m.enlace && <span className="text-xs">({m.vigente ? 'vigente' : 'vencido'})</span>}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
