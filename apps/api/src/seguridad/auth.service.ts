import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CanalContacto, Rol } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { RegistroActividadService } from '../comun/registro-actividad.service';
import { PrismaService } from '../persistencia/prisma.service';

export interface DatosRegistro {
  email: string;
  contrasena: string;
  nombres: string;
  telefono: string;
  canalPreferido: CanalContacto;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly actividad: RegistroActividadService,
  ) {}

  // RF-11/CU-02 paso 2: registro mínimo de CLIENTE. Contraseña con bcrypt (RNF-09).
  async registrarCliente(d: DatosRegistro) {
    const email = d.email.toLowerCase();
    if (await this.prisma.usuario.findUnique({ where: { email } })) {
      throw new ConflictException({
        mensaje: 'Ya existe una cuenta con ese correo',
        errores: { email: 'Correo ya registrado' },
      });
    }
    const usuario = await this.prisma.$transaction(async (tx) => {
      const u = await tx.usuario.create({
        data: { email, hashContrasena: await bcrypt.hash(d.contrasena, 10), rol: 'CLIENTE' },
      });
      await tx.cliente.create({
        data: {
          nombres: d.nombres,
          telefono: d.telefono,
          email,
          canalPreferido: d.canalPreferido,
          usuarioId: u.id,
        },
      });
      await this.actividad.registrar('REGISTRO_CLIENTE', `Usuario#${u.id}`, u.id, tx);
      return u;
    });
    return this.emitirSesion(usuario);
  }

  async login(email: string, contrasena: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });
    const valida = usuario && usuario.activo && (await bcrypt.compare(contrasena, usuario.hashContrasena));
    if (!valida) throw new UnauthorizedException('Correo o contraseña incorrectos');
    return this.emitirSesion(usuario);
  }

  // Admin crea cuentas de ASESOR o ADMINISTRADOR (RF-31)
  async crearUsuarioInterno(email: string, contrasena: string, rol: Rol, adminId: string) {
    const correo = email.toLowerCase();
    if (await this.prisma.usuario.findUnique({ where: { email: correo } })) {
      throw new ConflictException({
        mensaje: 'Ya existe una cuenta con ese correo',
        errores: { email: 'Correo ya registrado' },
      });
    }
    return this.prisma.$transaction(async (tx) => {
      const u = await tx.usuario.create({
        data: { email: correo, hashContrasena: await bcrypt.hash(contrasena, 10), rol },
        select: { id: true, email: true, rol: true, activo: true },
      });
      await this.actividad.registrar(`CREAR_USUARIO_${rol}`, `Usuario#${u.id}`, adminId, tx);
      return u;
    });
  }

  async perfil(usuarioId: string) {
    return this.prisma.usuario.findUniqueOrThrow({
      where: { id: usuarioId },
      select: { id: true, email: true, rol: true, cliente: { select: { nombres: true, apellidos: true } } },
    });
  }

  private emitirSesion(u: { id: string; email: string; rol: Rol }) {
    // RNF-09: el token expira (JWT_EXPIRA, p. ej. 2h)
    const token = this.jwt.sign({ sub: u.id, email: u.email, rol: u.rol });
    return { token, usuario: { id: u.id, email: u.email, rol: u.rol } };
  }
}
