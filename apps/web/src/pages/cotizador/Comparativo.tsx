import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/cliente';
import { claseBoton, claseBotonSecundario } from '../../componentes/Campo';
import { etiquetaValor, formatoSoles, MOTIVO_BLOQUEO } from '../../componentes/formato';
import { Cotizacion, PlanCotizado } from '../../tipos/dominio';

type Fila = PlanCotizado & { aseguradora: string };

// RF-05 / RF-08: comparativo de aseguradoras × planes, ordenable por precio, con Opción 1 y Opción 2 por plan.
export function Comparativo() {
  const { id } = useParams();
  const [orden, setOrden] = useState<'precio' | 'aseguradora'>('precio');
  const q = useQuery({ queryKey: ['cotizacion', id], queryFn: () => api<Cotizacion>(`/cotizaciones/${id}`) });

  if (q.isLoading) return <p className="p-4">Cargando comparativo…</p>;
  if (q.isError) return <p className="p-4 text-red-700">{q.error.message}</p>;
  const c = q.data!;

  const filas: Fila[] = c.aseguradoras
    .flatMap((a) => a.planes.map((p) => ({ ...p, aseguradora: a.nombre })))
    .filter((f) => f.prima !== null);
  filas.sort((a, b) =>
    orden === 'precio'
      ? a.prima! - b.prima!
      : a.aseguradora.localeCompare(b.aseguradora) || a.prima! - b.prima!,
  );
  const sinCotizar = c.aseguradoras.filter((a) => !a.cotiza);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-slate-900">Tu comparativo</h1>
      <p className="text-sm text-slate-600">
        {c.vehiculo.marca} {c.vehiculo.modelo} {c.vehiculo.anio} · {etiquetaValor(c.vehiculo.uso)}
      </p>

      {c.motivoDerivacion && (
        <div role="status" className="mt-4 rounded border border-indigo-200 bg-indigo-50 p-3 text-indigo-900">
          <p className="font-medium">Tu caso pasó a un asesor</p>
          <p className="text-sm">
            {c.mensajeDerivacion} Te contactaremos por {etiquetaValor(c.contacto.canalPreferido)}; no
            necesitas dejar tu correo.
          </p>
        </div>
      )}

      {sinCotizar.length > 0 && (
        <p className="mt-3 text-sm text-slate-600" data-testid="sin-cotizar">
          No cotizan en línea para este vehículo: {sinCotizar.map((a) => a.nombre).join(', ')}.
        </p>
      )}

      {filas.length > 0 && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <label htmlFor="orden">Ordenar por</label>
          <select
            id="orden"
            value={orden}
            onChange={(e) => setOrden(e.target.value as typeof orden)}
            className="rounded border border-slate-300 px-2 py-1"
          >
            <option value="precio">Precio (menor a mayor)</option>
            <option value="aseguradora">Aseguradora</option>
          </select>
        </div>
      )}

      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filas.map((f) => (
          <li
            key={f.primaCotizadaId}
            className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            data-testid="plan"
          >
            <p className="text-sm text-slate-500">{f.aseguradora}</p>
            <p className="text-lg font-semibold text-slate-900">{f.nombre}</p>
            <p className="mt-1 text-2xl font-bold text-indigo-700">{formatoSoles(f.prima!)}</p>
            <p className="text-xs text-slate-500">prima anual</p>
            <p className="mt-2 flex-1 text-sm text-slate-600">{f.descripcion}</p>
            <div className="mt-3 flex flex-col gap-2">
              {f.compraInmediata ? (
                <Link to={`/comprar/${c.id}/${f.primaCotizadaId}`} className={`${claseBoton} text-center`}>
                  Comprar ahora
                </Link>
              ) : (
                <>
                  <button className={claseBoton} disabled>
                    Comprar ahora
                  </button>
                  <p className="text-xs text-slate-600">{MOTIVO_BLOQUEO[f.motivoBloqueo!]}</p>
                </>
              )}
              <Link
                to={`/asesoria/${c.id}?plan=${f.planId}`}
                className={`${claseBotonSecundario} text-center`}
              >
                Prefiero que me asesoren
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
