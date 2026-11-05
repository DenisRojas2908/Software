import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../../api/cliente';
import { Campo, claseBoton, claseInput } from '../../componentes/Campo';
import { etiquetaValor } from '../../componentes/formato';
import { useSesion } from '../../sesion/sesion';
import { CanalContacto, Cotizacion } from '../../tipos/dominio';

type Motivo = 'DUDA' | 'NEGOCIACION' | 'DESCUENTO';
interface Confirmacion {
  id: string;
  canal: CanalContacto;
  minutosEstimados: number;
}

// CU-03 pasos 1–3 (Opción 2 «Prefiero que me asesoren»): datos precargados, motivo y canal; registro mínimo si hace falta.
export function SeleccionCanal() {
  const { cotizacionId } = useParams();
  const ubicacion = useLocation();
  const { usuario } = useSesion();
  const cot = useQuery({
    queryKey: ['cotizacion', cotizacionId],
    queryFn: () => api<Cotizacion>(`/cotizaciones/${cotizacionId}`),
  });
  const [motivo, setMotivo] = useState<Motivo>('NEGOCIACION');
  const [canal, setCanal] = useState<CanalContacto | ''>('');
  const enviar = useMutation({
    mutationFn: () =>
      api<Confirmacion>('/asesoria/solicitudes', {
        cuerpo: { cotizacionId, motivo, canal: canal || cot.data!.contacto.canalPreferido },
      }),
  });

  if (cot.isLoading) return <p className="p-4">Cargando…</p>;
  if (cot.isError) return <p className="p-4 text-red-700">{cot.error.message}</p>;
  const c = cot.data!;

  if (enviar.isSuccess) {
    return (
      <main className="mx-auto max-w-xl px-4 py-6">
        <section role="status" className="rounded border border-green-300 bg-green-50 p-4 text-green-900">
          <h1 className="text-xl font-semibold">Solicitud registrada</h1>
          <p className="mt-1">
            Un asesor te contactará por {etiquetaValor(enviar.data.canal)} en aproximadamente{' '}
            {enviar.data.minutosEstimados} minutos.
          </p>
          <Link to="/mis-tramites" className="mt-3 inline-block underline">
            Ver mis trámites
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-slate-900">Prefiero que me asesoren</h1>
      <p className="mt-1 text-sm text-slate-600">
        Usaremos los datos que ya ingresaste: {c.vehiculo.marca} {c.vehiculo.modelo} {c.vehiculo.anio} ·{' '}
        {etiquetaValor(c.vehiculo.uso)} · {c.contacto.nombres}.
      </p>
      {c.solicitudAbierta && (
        <p className="mt-3 rounded bg-indigo-50 p-2 text-sm text-indigo-900">
          Ya tienes un caso abierto con un asesor; lo actualizaremos.
        </p>
      )}
      <div className="mt-4 flex flex-col gap-3">
        <Campo id="motivo" etiqueta="¿En qué te ayudamos?">
          <select
            id="motivo"
            className={claseInput}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value as Motivo)}
          >
            <option value="DUDA">Tengo dudas sobre las coberturas</option>
            <option value="NEGOCIACION">Quiero negociar el precio</option>
            <option value="DESCUENTO">Quiero un descuento</option>
          </select>
        </Campo>
        <Campo id="canal" etiqueta="¿Por dónde te contactamos?">
          <select
            id="canal"
            className={claseInput}
            value={canal || c.contacto.canalPreferido}
            onChange={(e) => setCanal(e.target.value as CanalContacto)}
          >
            <option value="WHATSAPP">WhatsApp</option>
            <option value="LLAMADA">Llamada</option>
          </select>
        </Campo>
        {!usuario ? (
          <>
            <p className="text-sm text-slate-700">
              Para registrar tu solicitud necesitas una cuenta (registro mínimo). Tus datos se conservan.
            </p>
            <Link
              to={`/login?volver=${encodeURIComponent(ubicacion.pathname + ubicacion.search)}`}
              className={`${claseBoton} text-center`}
            >
              Ingresar o crear cuenta
            </Link>
          </>
        ) : usuario.rol !== 'CLIENTE' ? (
          <p className="text-red-700">Solo un cliente puede solicitar asesoría.</p>
        ) : (
          <button className={claseBoton} disabled={enviar.isPending} onClick={() => enviar.mutate()}>
            Solicitar asesoría
          </button>
        )}
        {enviar.isError && (
          <p role="alert" className="text-sm text-red-700">
            {enviar.error.message}
          </p>
        )}
      </div>
    </main>
  );
}
