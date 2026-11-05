import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api, ErrorApi } from '../../api/cliente';
import { claseBoton } from '../../componentes/Campo';
import { formatoSoles } from '../../componentes/formato';
import { Cotizacion } from '../../tipos/dominio';

interface Retoma {
  cotizacionId: string;
  expiraEn: string;
  descuentoPrimeraCompra: number;
  planSugerido: { primaCotizadaId: string; aseguradora: string; plan: string; prima: number } | null;
  cotizacion: Cotizacion;
}

// RN-12 / CU-04: el cliente retoma la compra desde el enlace del mensaje final. Vencido → puede volver a cotizar (7b).
export function Retomar() {
  const { token } = useParams();
  const q = useQuery({ queryKey: ['retoma', token], queryFn: () => api<Retoma>(`/retoma/${token}`) });
  if (q.isLoading) return <p className="p-4">Cargando…</p>;
  if (q.isError) {
    const vencido = q.error instanceof ErrorApi && q.error.status === 410;
    return (
      <main className="mx-auto max-w-xl px-4 py-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          {vencido ? 'Este enlace ya venció' : 'Enlace no válido'}
        </h1>
        <p className="mt-2 text-slate-700">{q.error.message}</p>
        <Link to="/cotizar" className={`${claseBoton} mt-4 inline-block`}>
          Volver a cotizar
        </Link>
      </main>
    );
  }
  const r = q.data!;
  const v = r.cotizacion.vehiculo;
  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-slate-900">Retoma tu compra</h1>
      <p className="mt-1 text-slate-700">
        {v.marca} {v.modelo} {v.anio}. Enlace válido hasta el{' '}
        {new Date(r.expiraEn).toLocaleDateString('es-PE')}.
      </p>
      <p className="mt-2 rounded bg-green-50 p-2 text-sm text-green-900">
        Si es tu primera póliza con nosotros, tienes {r.descuentoPrimeraCompra} % de descuento (se confirma
        con tu DNI).
      </p>
      {r.planSugerido && (
        <section className="mt-4 rounded border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">{r.planSugerido.aseguradora}</p>
          <p className="text-lg font-semibold">{r.planSugerido.plan}</p>
          <p className="text-2xl font-bold text-indigo-700">{formatoSoles(r.planSugerido.prima)}</p>
          <Link
            to={`/comprar/${r.cotizacionId}/${r.planSugerido.primaCotizadaId}?retoma=${token}`}
            className={`${claseBoton} mt-3 inline-block`}
          >
            Comprar con este plan
          </Link>
        </section>
      )}
      <p className="mt-4 text-sm">
        <Link to={`/cotizacion/${r.cotizacionId}`} className="text-indigo-700 underline">
          Ver todos los planes
        </Link>
      </p>
    </main>
  );
}
