import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { z } from 'zod';
import { validar } from '../comun/validacion';
import { RegistroActividadService } from '../comun/registro-actividad.service';
import { PrismaService } from '../persistencia/prisma.service';
import { AuthService } from '../seguridad/auth.service';
import { Roles, UsuarioActual, UsuarioSesion } from '../seguridad/decoradores';

const esquemaUsuario = z.object({
  email: z.email('Correo inválido'),
  contrasena: z.string().min(8, 'Mínimo 8 caracteres'),
  rol: z.enum(['ASESOR', 'ADMINISTRADOR'], 'Rol ASESOR o ADMINISTRADOR'),
});
const esquemaActivo = z.object({ activo: z.boolean('Indica activo true/false') });

// RF-31: el administrador gestiona usuarios y roles (crea asesores; desactiva, no borra).
@Roles('ADMINISTRADOR')
@Controller('admin/usuarios')
export class UsuariosController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
    private readonly actividad: RegistroActividadService,
  ) {}

  @Get()
  listar() {
    return this.prisma.usuario.findMany({
      select: { id: true, email: true, rol: true, activo: true },
      orderBy: [{ rol: 'asc' }, { email: 'asc' }],
    });
  }

  @Post()
  crear(@Body() body: unknown, @UsuarioActual() admin: UsuarioSesion) {
    const d = validar(esquemaUsuario, body);
    return this.auth.crearUsuarioInterno(d.email, d.contrasena, d.rol, admin.id);
  }

  @Patch(':id')
  cambiarActivo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
    @UsuarioActual() admin: UsuarioSesion,
  ) {
    const { activo } = validar(esquemaActivo, body);
    return this.prisma.$transaction(async (tx) => {
      if (!(await tx.usuario.findUnique({ where: { id } })))
        throw new NotFoundException('Usuario no encontrado');
      const u = await tx.usuario.update({
        where: { id },
        data: { activo },
        select: { id: true, email: true, rol: true, activo: true },
      });
      await this.actividad.registrar(
        activo ? 'ACTIVAR_USUARIO' : 'DESACTIVAR_USUARIO',
        `Usuario#${id}`,
        admin.id,
        tx,
      );
      return u;
    });
  }
}
