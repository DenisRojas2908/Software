// Cliente HTTP mínimo hacia /api (RNF-18). Agrega el token de la sesión y traduce los errores.
export class ErrorApi extends Error {
  constructor(
    public readonly status: number,
    mensaje: string,
    public readonly errores: Record<string, string> = {},
  ) {
    super(mensaje);
  }
}

export const almacenSesion = {
  leer(): string | null {
    try {
      return localStorage.getItem('svas.token');
    } catch {
      return null;
    }
  },
  guardar(token: string | null) {
    try {
      if (token) localStorage.setItem('svas.token', token);
      else localStorage.removeItem('svas.token');
    } catch {
      /* sin almacenamiento: la sesión dura lo que la pestaña */
    }
  },
};

export async function api<T>(ruta: string, opciones: { metodo?: string; cuerpo?: unknown } = {}): Promise<T> {
  const token = almacenSesion.leer();
  const res = await fetch(`/api${ruta}`, {
    method: opciones.metodo ?? (opciones.cuerpo ? 'POST' : 'GET'),
    headers: {
      ...(opciones.cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opciones.cuerpo !== undefined ? JSON.stringify(opciones.cuerpo) : undefined,
  });
  const texto = await res.text();
  const datos = texto ? JSON.parse(texto) : null;
  if (!res.ok) {
    const mensaje =
      datos?.mensaje ?? (Array.isArray(datos?.message) ? datos.message.join(', ') : datos?.message);
    throw new ErrorApi(res.status, mensaje ?? 'Ocurrió un error', datos?.errores ?? {});
  }
  return datos as T;
}
