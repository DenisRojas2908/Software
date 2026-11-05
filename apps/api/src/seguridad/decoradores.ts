import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Rol } from '@prisma/client';

export interface UsuarioSesion {
  id: string;
  email: string;
  rol: Rol;
}

export const CLAVE_PUBLICO = 'publico';
export const CLAVE_ROLES = 'roles';

// Ruta accesible sin sesión (p. ej. cotizar como invitado, CU-01). Si llega un token válido, igual se lee.
export const Publico = () => SetMetadata(CLAVE_PUBLICO, true);

// RF-31/RF-32: roles que pueden usar la ruta. Sin @Roles ni @Publico basta con estar autenticado.
export const Roles = (...roles: Rol[]) => SetMetadata(CLAVE_ROLES, roles);

// Inyecta el usuario de la sesión (o undefined si es invitado) en el método del controlador.
export const UsuarioActual = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UsuarioSesion | undefined => ctx.switchToHttp().getRequest().usuario,
);
