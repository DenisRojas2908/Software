import { Rol } from '@prisma/client';

// Inventario de endpoints protegidos (RNF-10). Un uuid inexistente basta: el permiso se revisa antes que el dato.
const X = '00000000-0000-0000-0000-000000000000';
type Metodo = 'get' | 'post' | 'patch' | 'put' | 'delete';
export interface EndpointProtegido {
  metodo: Metodo;
  ruta: string;
  permitidos: Rol[];
}

const TODOS: Rol[] = ['CLIENTE', 'ASESOR', 'ADMINISTRADOR'];
const ADMIN: Rol[] = ['ADMINISTRADOR'];
const CLIENTE: Rol[] = ['CLIENTE'];

export const ENDPOINTS_PROTEGIDOS: EndpointProtegido[] = [
  // F2 · seguridad y usuarios
  { metodo: 'get', ruta: '/api/auth/yo', permitidos: TODOS },
  { metodo: 'get', ruta: '/api/admin/usuarios', permitidos: ADMIN },
  { metodo: 'post', ruta: '/api/admin/usuarios', permitidos: ADMIN },
  { metodo: 'patch', ruta: `/api/admin/usuarios/${X}`, permitidos: ADMIN },
  // F4 · compra y pólizas (CU-02)
  { metodo: 'post', ruta: '/api/compras', permitidos: CLIENTE },
  { metodo: 'get', ruta: `/api/compras/${X}`, permitidos: CLIENTE },
  { metodo: 'patch', ruta: `/api/compras/${X}/datos`, permitidos: CLIENTE },
  { metodo: 'post', ruta: `/api/compras/${X}/confirmar`, permitidos: CLIENTE },
  { metodo: 'post', ruta: `/api/compras/${X}/pagar`, permitidos: CLIENTE },
  { metodo: 'get', ruta: '/api/polizas/mias', permitidos: CLIENTE },
  { metodo: 'get', ruta: `/api/polizas/${X}/pdf`, permitidos: CLIENTE },
];
