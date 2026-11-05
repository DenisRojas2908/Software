import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { api, ErrorApi } from '../../api/cliente';
import { Campo, claseBoton, claseInput } from '../../componentes/Campo';
import { etiquetaCampo, etiquetaValor } from '../../componentes/formato';
import { CampoFormulario, Cotizacion } from '../../tipos/dominio';

type Valores = Record<string, string>;
const CAMPOS_CONTACTO = ['nombres', 'telefono', 'email', 'canalPreferido'];

// CU-01: formulario DINÁMICO armado desde el catálogo (RF-02). Sin cuenta. Errores por campo (RF-03).
export function Cotizador() {
  const navegar = useNavigate();
  const [fueraDeNicho, setFueraDeNicho] = useState<string | null>(null);
  const formulario = useQuery({
    queryKey: ['formulario'],
    queryFn: () => api<{ campos: CampoFormulario[]; aseguradoras: string[] }>('/catalogo/formulario'),
  });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Valores>({ defaultValues: { canalPreferido: 'WHATSAPP' } });

  const enviar = useMutation({
    mutationFn: (v: Valores) => {
      const datos: Record<string, string> = {};
      for (const c of formulario.data?.campos ?? [])
        if (v[c.nombre] !== undefined && v[c.nombre] !== '') datos[c.nombre] = v[c.nombre];
      const contacto = Object.fromEntries(CAMPOS_CONTACTO.map((k) => [k, v[k] ?? '']));
      return api<{ fueraDeNicho: boolean; mensaje?: string; cotizacion?: Cotizacion }>('/cotizaciones', {
        cuerpo: { contacto, datos },
      });
    },
    onSuccess: (r) => {
      if (r.fueraDeNicho) setFueraDeNicho(r.mensaje ?? 'Fuera del alcance de la plataforma');
      else navegar(`/cotizacion/${r.cotizacion!.id}`);
    },
    onError: (e) => {
      // RNF-08: los errores del backend se muestran junto a cada campo y no se pierde lo ingresado
      if (e instanceof ErrorApi) {
        for (const [campo, mensaje] of Object.entries(e.errores)) {
          setError(campo.replace(/^contacto\./, ''), { message: mensaje });
        }
      }
    },
  });

  if (formulario.isLoading) return <p className="p-4">Cargando formulario…</p>;
  if (formulario.isError) return <p className="p-4 text-red-700">No se pudo cargar el formulario.</p>;

  const control = (c: CampoFormulario) => {
    const props = { id: c.nombre, className: claseInput, ...register(c.nombre) };
    if (c.tipo === 'LISTA' && c.valores.length) {
      return (
        <select {...props} defaultValue="">
          <option value="" disabled>
            Elige…
          </option>
          {c.valores.map((v) => (
            <option key={v} value={v}>
              {etiquetaValor(v)}
            </option>
          ))}
        </select>
      );
    }
    return <input {...props} inputMode={c.tipo === 'NUMERO' ? 'numeric' : undefined} />;
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-slate-900">Cotiza tu seguro vehicular</h1>
      <p className="mt-1 text-sm text-slate-600">
        Comparamos {formulario.data!.aseguradoras.length} aseguradoras:{' '}
        {formulario.data!.aseguradoras.join(', ')}.
      </p>

      {fueraDeNicho && (
        <div role="alert" className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-amber-900">
          <p className="font-medium">No podemos cotizar este vehículo aquí</p>
          <p className="text-sm">{fueraDeNicho}</p>
        </div>
      )}

      <form onSubmit={handleSubmit((v) => enviar.mutate(v))} className="mt-4 flex flex-col gap-4" noValidate>
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="mb-2 font-medium text-slate-800">Tu vehículo</legend>
          {formulario.data!.campos.map((c) => (
            <Campo
              key={c.nombre}
              id={c.nombre}
              etiqueta={`${etiquetaCampo(c.nombre)}${c.obligatorio ? ' *' : ''}`}
              error={errors[c.nombre]?.message}
            >
              {control(c)}
            </Campo>
          ))}
        </fieldset>

        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="mb-2 font-medium text-slate-800">¿Cómo te contactamos?</legend>
          <Campo id="nombres" etiqueta="Nombres *" error={errors.nombres?.message}>
            <input id="nombres" className={claseInput} {...register('nombres')} />
          </Campo>
          <Campo id="telefono" etiqueta="Celular *" error={errors.telefono?.message}>
            <input id="telefono" inputMode="numeric" className={claseInput} {...register('telefono')} />
          </Campo>
          <Campo id="email" etiqueta="Correo (opcional)" error={errors.email?.message}>
            <input id="email" type="email" className={claseInput} {...register('email')} />
          </Campo>
          <Campo id="canalPreferido" etiqueta="Canal preferido *" error={errors.canalPreferido?.message}>
            <select id="canalPreferido" className={claseInput} {...register('canalPreferido')}>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="LLAMADA">Llamada</option>
            </select>
          </Campo>
        </fieldset>
        <p className="text-xs text-slate-500">
          Usamos tus datos solo para cotizar, vender y hacer seguimiento por el canal que elijas (Ley 29733).
        </p>
        {enviar.isError &&
          !(enviar.error instanceof ErrorApi && Object.keys(enviar.error.errores).length) && (
            <p role="alert" className="text-sm text-red-700">
              {enviar.error.message}
            </p>
          )}
        <button type="submit" className={claseBoton} disabled={enviar.isPending}>
          {enviar.isPending ? 'Cotizando…' : 'Ver precios'}
        </button>
      </form>
    </main>
  );
}
