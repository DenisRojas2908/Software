import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../api/cliente';
import { Campo, claseBoton, claseInput } from '../../componentes/Campo';
import { MensajeError, useCambio } from './util';

const CAMPOS = [
  ['descuentoPrimeraCompra', 'Descuento por primera compra (%) · RN-08'],
  ['descuentoMaximo', 'Descuento máximo de negociación (%) · RN-07'],
  ['maxIntentos', 'Máximo de intentos de seguimiento · RN-10'],
  ['diasSeguimiento', 'Días de seguimiento · RN-10'],
  ['maxCuotas', 'Máximo de cuotas · RN-14'],
  ['vigenciaEnlaceDias', 'Vigencia del enlace de retoma (días) · RN-12'],
] as const;
type Parametros = Record<(typeof CAMPOS)[number][0], number>;

// RF-29 / RNF-13: parámetros comerciales editables sin tocar código.
export function Parametros() {
  const q = useQuery({
    queryKey: ['admin', 'parametros'],
    queryFn: () => api<Parametros>('/admin/parametros'),
  });
  if (q.isLoading || !q.data) return <p>Cargando…</p>;
  return <FormularioParametros iniciales={q.data} />;
}

function FormularioParametros({ iniciales }: { iniciales: Parametros }) {
  const cambio = useCambio([['admin', 'parametros']]);
  const [valores, setValores] = useState<Record<string, string>>(() =>
    Object.fromEntries(CAMPOS.map(([k]) => [k, String(iniciales[k])])),
  );
  return (
    <form
      className="grid max-w-xl gap-3 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        cambio.mutate({ ruta: '/admin/parametros', metodo: 'PUT', cuerpo: valores });
      }}
    >
      {CAMPOS.map(([k, etiqueta]) => (
        <Campo key={k} id={k} etiqueta={etiqueta}>
          <input
            id={k}
            inputMode="decimal"
            className={claseInput}
            value={valores[k] ?? ''}
            onChange={(e) => setValores({ ...valores, [k]: e.target.value })}
          />
        </Campo>
      ))}
      <MensajeError error={cambio.error} />
      {cambio.isSuccess && <p className="text-green-700">Parámetros guardados.</p>}
      <button className={claseBoton}>Guardar parámetros</button>
    </form>
  );
}
