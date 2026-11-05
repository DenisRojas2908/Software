import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ProveedorSesion, UsuarioSesion } from '../sesion/sesion';

type Respuestas = Record<string, unknown>;

// Para simular un error HTTP: { 'POST /api/x': new RespuestaSimulada(400, { errores: {...} }) }
export class RespuestaSimulada {
  constructor(
    public status: number,
    public cuerpo: unknown,
  ) {}
}
const respuesta = (status: number, cuerpo: unknown) => ({
  ok: status < 400,
  status,
  text: async () => JSON.stringify(cuerpo),
});

// Simula la API: cada ruta (/api/...) responde el JSON indicado. Así las pruebas no necesitan backend.
export function simularApi(respuestas: Respuestas = {}) {
  const fetchFalso = jest.fn(async (url: string, init?: RequestInit) => {
    const clave = `${init?.method ?? 'GET'} ${url}`;
    const cuerpo = clave in respuestas ? respuestas[clave] : respuestas[url];
    // jsdom no trae Response: se devuelve un objeto con lo que usa api() (ok, status, text)
    if (cuerpo === undefined) return respuesta(404, { mensaje: 'no simulado' });
    if (cuerpo instanceof RespuestaSimulada) return respuesta(cuerpo.status, cuerpo.cuerpo);
    return respuesta(200, cuerpo);
  });
  globalThis.fetch = fetchFalso as unknown as typeof fetch;
  return fetchFalso;
}

export function renderizar(
  ui: ReactElement,
  opciones: { ruta?: string; usuario?: UsuarioSesion; api?: Respuestas } = {},
) {
  localStorage.clear();
  const respuestas = { ...(opciones.api ?? {}) };
  if (opciones.usuario) {
    localStorage.setItem('svas.token', 'token-de-prueba');
    respuestas['/api/auth/yo'] = opciones.usuario;
  }
  const fetchFalso = simularApi(respuestas);
  const resultado = render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[opciones.ruta ?? '/']}>
        <ProveedorSesion>{ui}</ProveedorSesion>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...resultado, fetchFalso };
}

export const USUARIO = {
  cliente: { id: 'c1', email: 'cliente@svas.demo', rol: 'CLIENTE' as const },
  asesor: { id: 'a1', email: 'asesor1@svas.demo', rol: 'ASESOR' as const },
  admin: { id: 'd1', email: 'admin@svas.demo', rol: 'ADMINISTRADOR' as const },
};
