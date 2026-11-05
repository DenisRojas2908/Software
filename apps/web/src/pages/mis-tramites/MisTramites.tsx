import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, descargarArchivo } from '../../api/cliente';
import { etiquetaValor, formatoSoles } from '../../componentes/formato';
import { Tramite } from '../../tipos/dominio';

const ESTADO_COTIZACION: Record<string, string> = {
  REGISTRADA: 'Cotizada',
  CONVERTIDA: 'Comprada',
  NO_CONCRETADA: 'No concretada',
};

// RF-26: el cliente consulta el estado de su solicitud, su pago y su póliza.
export function MisTramites() {
  const q = useQuery({ queryKey: ['mis-tramites'], queryFn: () => api<Tramite[]>('/polizas/mias') });
  if (q.isLoading) return <p className="p-4">Cargando…</p>;
  if (q.isError) return <p className="p-4 text-red-700">{q.error.message}</p>;
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-slate-900">Mis trámites</h1>
      {q.data!.length === 0 && (
        <p className="mt-3 text-slate-600">
          Aún no tienes trámites.{' '}
          <Link to="/cotizar" className="text-indigo-700 underline">
            Cotiza aquí
          </Link>
          .
        </p>
      )}
      <ul className="mt-4 flex flex-col gap-3">
        {q.data!.map((t) => (
          <li
            key={t.cotizacionId}
            className="rounded border border-slate-200 bg-white p-4 text-sm"
            data-testid="tramite"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium text-slate-900">{t.vehiculo}</p>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                {ESTADO_COTIZACION[t.estado] ?? t.estado}
              </span>
            </div>
            <p className="text-slate-500">Cotizado el {new Date(t.fecha).toLocaleDateString('es-PE')}</p>
            {t.solicitud && (
              <p>
                Asesoría: {etiquetaValor(t.solicitud.motivo)} · {etiquetaValor(t.solicitud.estado)}
              </p>
            )}
            {t.orden && (
              <p>
                {t.orden.aseguradora} · {t.orden.plan} · {formatoSoles(t.orden.primaFinal)} · pago{' '}
                {t.orden.pago ? etiquetaValor(t.orden.pago.estado).toLowerCase() : 'pendiente'}
                {t.orden.pago?.modo === 'CUOTAS' &&
                  ` (${t.orden.pago.cuotas.filter((c) => c.estado === 'CONFIRMADO').length}/${t.orden.pago.cuotas.length} cuotas)`}
              </p>
            )}
            {t.poliza ? (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span>
                  Póliza <strong>{t.poliza.numero}</strong> · vigente hasta{' '}
                  {new Date(t.poliza.vigenciaHasta).toLocaleDateString('es-PE')}
                </span>
                <button
                  className="text-indigo-700 underline"
                  onClick={() => descargarArchivo(`/polizas/${t.poliza!.id}/pdf`, `${t.poliza!.numero}.pdf`)}
                >
                  Descargar PDF
                </button>
              </div>
            ) : (
              t.orden && (
                <Link to={`/compra/${t.orden.id}`} className="mt-2 inline-block text-indigo-700 underline">
                  Continuar compra
                </Link>
              )
            )}
            {!t.orden && t.estado !== 'CONVERTIDA' && (
              <Link
                to={`/cotizacion/${t.cotizacionId}`}
                className="mt-2 inline-block text-indigo-700 underline"
              >
                Ver comparativo
              </Link>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
