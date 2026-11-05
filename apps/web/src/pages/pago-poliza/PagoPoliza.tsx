import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { api, descargarArchivo, ErrorApi } from '../../api/cliente';
import { Campo, claseBoton, claseBotonSecundario, claseInput } from '../../componentes/Campo';
import { etiquetaValor, formatoSoles } from '../../componentes/formato';
import { ResumenOrden } from '../../tipos/dominio';

// CU-02 pasos 3–8: datos faltantes → condiciones, firma simulada y modo de pago → pagar (simulado) → póliza.
// Nunca se piden datos de tarjeta, CVV ni bancarios (D-08): el pago es un botón.
export function PagoPoliza() {
  const { ordenId } = useParams();
  const qc = useQueryClient();
  const clave = ['orden', ordenId];
  const orden = useQuery({ queryKey: clave, queryFn: () => api<ResumenOrden>(`/compras/${ordenId}`) });
  const actualizar = (o: ResumenOrden) =>
    qc.setQueryData(clave, (prev: ResumenOrden | undefined) => ({ ...prev, ...o }));

  if (orden.isLoading) return <p className="p-4">Cargando tu compra…</p>;
  if (orden.isError) return <p className="p-4 text-red-700">{orden.error.message}</p>;
  const o = orden.data!;

  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-slate-900">Tu compra</h1>
      <Resumen o={o} />
      {o.estado === 'PENDIENTE_DATOS' && <DatosFaltantes o={o} alGuardar={actualizar} />}
      {o.estado === 'LISTA_PARA_PAGAR' && <ConfirmarYPagar o={o} alCambiar={actualizar} />}
      {o.estado === 'PAGADA' && <Confirmacion o={o} />}
      {o.estado !== 'PAGADA' && (
        <p className="mt-6 text-sm">
          ¿Dudas?{' '}
          <Link to={`/asesoria/${o.cotizacionId}`} className="text-indigo-700 underline">
            Prefiero que me asesoren
          </Link>{' '}
          (conservamos tus datos).
        </p>
      )}
    </main>
  );
}

function Resumen({ o }: { o: ResumenOrden }) {
  return (
    <section className="mt-3 rounded border border-slate-200 bg-white p-4 text-sm" aria-label="Resumen">
      <p className="text-slate-500">
        {o.aseguradora} · Plan {o.plan}
      </p>
      <p className="font-medium text-slate-800">{o.vehiculo}</p>
      <dl className="mt-2 grid grid-cols-2 gap-1">
        <dt>Prima</dt>
        <dd className="text-right">{formatoSoles(o.prima)}</dd>
        <dt>Descuento</dt>
        <dd className="text-right" data-testid="descuento">
          {o.descuento.porcentaje > 0
            ? `${o.descuento.porcentaje} % (${o.descuento.tipo === 'PRIMERA_COMPRA' ? 'primera compra' : 'negociado'})`
            : o.primeraCompraEvaluada
              ? 'Sin descuento'
              : 'Se evalúa al ingresar tu DNI'}
        </dd>
        <dt className="font-semibold">Prima final</dt>
        <dd className="text-right text-lg font-bold text-indigo-700" data-testid="prima-final">
          {formatoSoles(o.primaFinal)}
        </dd>
      </dl>
    </section>
  );
}

function DatosFaltantes({ o, alGuardar }: { o: ResumenOrden; alGuardar: (o: ResumenOrden) => void }) {
  const { register, handleSubmit, setError, formState } = useForm({
    defaultValues: { numeroDocumento: o.cliente.numeroDocumento ?? '', apellidos: o.cliente.apellidos ?? '' },
  });
  const guardar = useMutation({
    mutationFn: (d: { numeroDocumento: string; apellidos: string }) =>
      api<ResumenOrden>(`/compras/${o.id}/datos`, { metodo: 'PATCH', cuerpo: d }),
    onSuccess: alGuardar,
    onError: (e) =>
      e instanceof ErrorApi &&
      Object.entries(e.errores).forEach(([k, m]) => setError(k as 'apellidos', { message: m })),
  });
  return (
    <form onSubmit={handleSubmit((d) => guardar.mutate(d))} className="mt-4 flex flex-col gap-3" noValidate>
      <h2 className="font-semibold">Solo nos faltan estos datos</h2>
      {o.datosFaltantes.includes('numeroDocumento') && (
        <Campo id="numeroDocumento" etiqueta="DNI" error={formState.errors.numeroDocumento?.message}>
          <input
            id="numeroDocumento"
            inputMode="numeric"
            className={claseInput}
            {...register('numeroDocumento')}
          />
        </Campo>
      )}
      {o.datosFaltantes.includes('apellidos') && (
        <Campo id="apellidos" etiqueta="Apellidos" error={formState.errors.apellidos?.message}>
          <input id="apellidos" className={claseInput} {...register('apellidos')} />
        </Campo>
      )}
      <button className={claseBoton} disabled={guardar.isPending}>
        Continuar
      </button>
    </form>
  );
}

function ConfirmarYPagar({ o, alCambiar }: { o: ResumenOrden; alCambiar: (o: ResumenOrden) => void }) {
  const [modo, setModo] = useState<'UNICO' | 'CUOTAS'>('UNICO');
  // Por defecto la opción mínima de cuotas (2); el máximo viene de parametros_comerciales (RN-14, RNF-13)
  const [numeroCuotas, setNumeroCuotas] = useState(2);
  const [acepta, setAcepta] = useState(false);
  const [firma, setFirma] = useState(false);
  const [cronograma, setCronograma] = useState<number[] | null>(null);
  const cuerpoModo = modo === 'CUOTAS' ? { modo, numeroCuotas } : { modo };

  const confirmar = useMutation({
    mutationFn: () =>
      api<ResumenOrden>(`/compras/${o.id}/confirmar`, {
        cuerpo: { aceptaCondiciones: acepta, firma, ...cuerpoModo },
      }),
    onSuccess: (r) => setCronograma(r.cronograma ?? null),
  });
  const pagar = useMutation({
    mutationFn: () => api<ResumenOrden>(`/compras/${o.id}/pagar`, { cuerpo: cuerpoModo }),
    onSuccess: alCambiar,
  });

  return (
    <section className="mt-4 flex flex-col gap-3">
      <h2 className="font-semibold">Condiciones y forma de pago</h2>
      <fieldset className="flex gap-4" onChange={() => setCronograma(null)}>
        <legend className="sr-only">Modo de pago</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="modo" checked={modo === 'UNICO'} onChange={() => setModo('UNICO')} /> Pago
          único
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="modo" checked={modo === 'CUOTAS'} onChange={() => setModo('CUOTAS')} /> En
          cuotas
        </label>
      </fieldset>
      {modo === 'CUOTAS' && (
        <Campo id="numeroCuotas" etiqueta={`Número de cuotas (máximo ${o.maxCuotas}, sin recargo)`}>
          <select
            id="numeroCuotas"
            className={claseInput}
            value={numeroCuotas}
            onChange={(e) => {
              setNumeroCuotas(Number(e.target.value));
              setCronograma(null);
            }}
          >
            {Array.from({ length: o.maxCuotas - 1 }, (_, i) => i + 2).map((n) => (
              <option key={n} value={n}>
                {n} cuotas
              </option>
            ))}
          </select>
        </Campo>
      )}
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} /> Acepto las
        condiciones de la póliza (documento de demostración).
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={firma} onChange={(e) => setFirma(e.target.checked)} /> Firmo la
        solicitud (firma simulada, sin validez legal).
      </label>
      {!cronograma ? (
        <button
          className={claseBotonSecundario}
          disabled={!acepta || !firma || confirmar.isPending}
          onClick={() => confirmar.mutate()}
        >
          Ver cronograma
        </button>
      ) : (
        <>
          <ol className="rounded border border-slate-200 bg-slate-50 p-3 text-sm" aria-label="Cronograma">
            {cronograma.map((m, i) => (
              <li key={i} className="flex justify-between">
                <span>{cronograma.length > 1 ? `Cuota ${i + 1}` : 'Pago único'}</span>
                <span>{formatoSoles(m)}</span>
              </li>
            ))}
          </ol>
          <button className={claseBoton} disabled={pagar.isPending} onClick={() => pagar.mutate()}>
            {pagar.isPending ? 'Procesando…' : `Pagar ${formatoSoles(cronograma[0])} (simulado)`}
          </button>
          <p className="text-xs text-slate-500">
            Pago simulado: no se solicitan datos de tarjeta ni se realiza ningún cobro.
          </p>
        </>
      )}
      {(confirmar.isError || pagar.isError) && (
        <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">
          {(confirmar.error ?? pagar.error)!.message} Puedes reintentar o cambiar la forma de pago.
        </p>
      )}
    </section>
  );
}

function Confirmacion({ o }: { o: ResumenOrden }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <section className="mt-4 rounded border border-green-300 bg-green-50 p-4" role="status">
      <h2 className="text-lg font-semibold text-green-900">¡Listo! Tu póliza fue emitida</h2>
      <p className="text-sm text-green-900">
        N.º <strong>{o.poliza?.numero}</strong> · canal {etiquetaValor(o.canalVenta)}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className={claseBoton}
          onClick={() =>
            descargarArchivo(`/polizas/${o.poliza!.id}/pdf`, `${o.poliza!.numero}.pdf`).catch((e) =>
              setError(e.message),
            )
          }
        >
          Descargar póliza (PDF)
        </button>
        <Link to="/mis-tramites" className={claseBotonSecundario}>
          Ver mis trámites
        </Link>
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </section>
  );
}
