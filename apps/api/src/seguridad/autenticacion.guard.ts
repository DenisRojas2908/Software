import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Rol } from '@prisma/client';
import { PrismaService } from '../persistencia/prisma.service';
import { CLAVE_PUBLICO, CLAVE_ROLES, UsuarioSesion } from './decoradores';

// Guard global (se aplica a TODAS las rutas): primero autentica (JWT), luego autoriza por rol.
// RF-31, RF-32, RNF-10: el control vive en el backend; ocultar botones en la UI no basta.
@Injectable()
export class AutenticacionGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const objetivos = [ctx.getHandler(), ctx.getClass()];
    const publico = this.reflector.getAllAndOverride<boolean>(CLAVE_PUBLICO, objetivos);
    const roles = this.reflector.getAllAndOverride<Rol[]>(CLAVE_ROLES, objetivos);

    req.usuario = await this.usuarioActivo(this.leerToken(req.headers.authorization));
    if (publico) return true;
    if (!req.usuario) throw new UnauthorizedException('Inicia sesión para continuar');
    if (roles?.length && !roles.includes(req.usuario.rol)) {
      throw new ForbiddenException('No tienes permiso para esta operación');
    }
    return true;
  }

  // RF-31: desactivar a un usuario corta su acceso de inmediato (aunque su token aún no expire)
  private async usuarioActivo(u?: UsuarioSesion): Promise<UsuarioSesion | undefined> {
    if (!u) return undefined;
    const fila = await this.prisma.usuario.findUnique({
      where: { id: u.id },
      select: { activo: true, rol: true },
    });
    return fila?.activo ? { ...u, rol: fila.rol } : undefined;
  }

  private leerToken(cabecera?: string): UsuarioSesion | undefined {
    if (!cabecera?.startsWith('Bearer ')) return undefined;
    try {
      const p = this.jwt.verify(cabecera.slice(7));
      return { id: p.sub, email: p.email, rol: p.rol };
    } catch {
      return undefined; // token vencido o alterado → como invitado (y 401 si la ruta no es pública)
    }
  }
}
