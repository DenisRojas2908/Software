import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ErrorApi } from '../../api/cliente';

// Mutación del panel admin: llama a la API y refresca las consultas indicadas.
export function useCambio<T = unknown>(claves: string[][]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ruta,
      metodo,
      cuerpo,
    }: {
      ruta: string;
      metodo: 'POST' | 'PATCH' | 'PUT';
      cuerpo: unknown;
    }) => api<T>(ruta, { metodo, cuerpo }),
    onSuccess: () => claves.forEach((k) => qc.invalidateQueries({ queryKey: k })),
  });
}

export function MensajeError({ error }: { error: Error | null }) {
  if (!error) return null;
  const texto =
    error instanceof ErrorApi && Object.keys(error.errores).length
      ? Object.entries(error.errores)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' · ')
      : error.message;
  return (
    <p role="alert" className="text-sm text-red-700">
      {texto}
    </p>
  );
}
