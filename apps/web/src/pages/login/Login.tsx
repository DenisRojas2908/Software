import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { api, ErrorApi } from '../../api/cliente';
import { Campo, claseBoton, claseInput } from '../../componentes/Campo';
import { useSesion, UsuarioSesion } from '../../sesion/sesion';

const esquemaLogin = z.object({
  email: z.email('Correo inválido'),
  contrasena: z.string().min(1, 'Ingresa tu contraseña'),
});
const esquemaRegistro = esquemaLogin.extend({
  contrasena: z.string().min(8, 'Mínimo 8 caracteres'),
  nombres: z.string().trim().min(2, 'Ingresa tus nombres'),
  telefono: z.string().regex(/^9\d{8}$/, 'Celular de 9 dígitos que empieza en 9'),
  canalPreferido: z.enum(['LLAMADA', 'WHATSAPP']),
});
type DatosRegistro = z.infer<typeof esquemaRegistro>;

const destinoPorRol = { CLIENTE: '/mis-tramites', ASESOR: '/asesor', ADMINISTRADOR: '/admin' } as const;

// Login y registro mínimo de cliente (RF-11, RF-31). `?volver=` regresa a la pantalla donde estaba (CU-02 paso 2).
export function Login() {
  const [modo, setModo] = useState<'ingresar' | 'registrar'>('ingresar');
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const { iniciar } = useSesion();
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const esquema = modo === 'ingresar' ? esquemaLogin : esquemaRegistro;
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DatosRegistro>({
    resolver: zodResolver(esquema as typeof esquemaRegistro),
    defaultValues: { canalPreferido: 'WHATSAPP' },
  });

  async function enviar(datos: DatosRegistro) {
    setErrorGeneral(null);
    try {
      const r = await api<{ token: string; usuario: UsuarioSesion }>(
        modo === 'ingresar' ? '/auth/login' : '/auth/registro',
        { cuerpo: modo === 'ingresar' ? { email: datos.email, contrasena: datos.contrasena } : datos },
      );
      iniciar(r.token, r.usuario);
      navegar(params.get('volver') ?? destinoPorRol[r.usuario.rol], { replace: true });
    } catch (e) {
      if (e instanceof ErrorApi) {
        Object.entries(e.errores).forEach(([campo, mensaje]) =>
          setError(campo as keyof DatosRegistro, { message: mensaje }),
        );
        setErrorGeneral(e.message);
      } else setErrorGeneral('No se pudo conectar con el servidor');
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <div className="mb-4 flex gap-2" role="tablist">
        {(['ingresar', 'registrar'] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={modo === m}
            onClick={() => setModo(m)}
            className={`flex-1 rounded px-3 py-2 text-sm font-medium ${modo === m ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            {m === 'ingresar' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit(enviar)} className="flex flex-col gap-3" noValidate>
        <Campo id="email" etiqueta="Correo" error={errors.email?.message}>
          <input id="email" type="email" autoComplete="email" className={claseInput} {...register('email')} />
        </Campo>
        <Campo id="contrasena" etiqueta="Contraseña" error={errors.contrasena?.message}>
          <input id="contrasena" type="password" className={claseInput} {...register('contrasena')} />
        </Campo>
        {modo === 'registrar' && (
          <>
            <Campo id="nombres" etiqueta="Nombres" error={errors.nombres?.message}>
              <input id="nombres" className={claseInput} {...register('nombres')} />
            </Campo>
            <Campo id="telefono" etiqueta="Celular" error={errors.telefono?.message}>
              <input id="telefono" inputMode="numeric" className={claseInput} {...register('telefono')} />
            </Campo>
            <Campo
              id="canalPreferido"
              etiqueta="¿Cómo prefieres que te contactemos?"
              error={errors.canalPreferido?.message}
            >
              <select id="canalPreferido" className={claseInput} {...register('canalPreferido')}>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="LLAMADA">Llamada</option>
              </select>
            </Campo>
            <p className="text-xs text-slate-500">
              Tus datos se usan solo para la venta y el seguimiento de tu seguro (Ley 29733). Simulación
              académica.
            </p>
          </>
        )}
        {errorGeneral && (
          <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-800">
            {errorGeneral}
          </p>
        )}
        <button type="submit" className={claseBoton} disabled={isSubmitting}>
          {modo === 'ingresar' ? 'Ingresar' : 'Crear cuenta'}
        </button>
      </form>
    </main>
  );
}
