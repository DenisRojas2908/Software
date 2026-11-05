import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../api/cliente';
import { claseBoton } from '../../componentes/Campo';
import { formatoSoles } from '../../componentes/formato';
import { useSesion } from '../../sesion/sesion';
import { Cotizacion, ResumenOrden } from '../../tipos/dominio';

// CU-02 pasos 1–2: resumen del plan elegido; si no hay sesión, registro mínimo o login SIN perder la cotización.
export function IniciarCompra() {
  const { cotizacionId, primaCotizadaId } = useParams();
  const [params] = useSearchParams();
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const { usuario, cargando } = useSesion();
  const cot = useQuery({
    queryKey: ['cotizacion', cotizacionId],
    queryFn: () => api<Cotizacion>(`/cotizaciones/${cotizacionId}`),
  });
  const crear = useMutation({
    mutationFn: () =>
      api<ResumenOrden>('/compras', {
        cuerpo: {
          cotizacionId,
          primaCotizadaId,
          ...(params.get('retoma') ? { tokenRetoma: params.get('retoma') } : {}),
        },
      }),
    onSuccess: (o) => navegar(`/compra/${o.id}`, { replace: true }),
  });
  const { mutate, isIdle } = crear;
  useEffect(() => {
    if (usuario?.rol === 'CLIENTE' && isIdle) mutate();
  }, [usuario, isIdle, mutate]);

  const plan = cot.data?.aseguradoras
    .flatMap((a) => a.planes.map((p) => ({ ...p, aseguradora: a.nombre })))
    .find((p) => p.primaCotizadaId === primaCotizadaId);

  if (cargando || cot.isLoading) return <p className="p-4">Cargando…</p>;
  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-slate-900">Comprar ahora</h1>
      {plan && (
        <section className="mt-3 rounded border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">{plan.aseguradora}</p>
          <p className="text-lg font-semibold">{plan.nombre}</p>
          <p className="text-2xl font-bold text-indigo-700">{formatoSoles(plan.prima ?? 0)}</p>
          <p className="text-sm text-slate-600">
            {cot.data!.vehiculo.marca} {cot.data!.vehiculo.modelo} {cot.data!.vehiculo.anio}
          </p>
        </section>
      )}
      {!usuario && (
        <div className="mt-4">
          <p className="text-slate-700">
            Para comprar necesitas una cuenta (registro mínimo). Tu cotización se conserva.
          </p>
          <Link
            to={`/login?volver=${encodeURIComponent(ubicacion.pathname + ubicacion.search)}`}
            className={`${claseBoton} mt-3 inline-block`}
          >
            Ingresar o crear cuenta
          </Link>
        </div>
      )}
      {usuario && usuario.rol !== 'CLIENTE' && (
        <p className="mt-4 text-red-700">Solo un cliente puede comprar.</p>
      )}
      {crear.isPending && <p className="mt-4">Preparando tu orden…</p>}
      {crear.isError && (
        <div role="alert" className="mt-4 rounded bg-red-50 p-3 text-red-800">
          <p>{crear.error.message}</p>
          <Link to={`/asesoria/${cotizacionId}`} className="text-sm underline">
            Prefiero que me asesoren
          </Link>
        </div>
      )}
    </main>
  );
}
