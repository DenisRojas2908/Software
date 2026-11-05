import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { z } from 'zod';
import { validar } from '../comun/validacion';
import { AuthService } from './auth.service';
import { Publico, UsuarioActual, UsuarioSesion } from './decoradores';

export const esquemaRegistro = z.object({
  email: z.email('Correo inválido'),
  contrasena: z.string().min(8, 'Mínimo 8 caracteres'),
  nombres: z.string().trim().min(2, 'Ingresa tus nombres'),
  telefono: z.string().regex(/^9\d{8}$/, 'Celular de 9 dígitos que empieza en 9'),
  canalPreferido: z.enum(['LLAMADA', 'WHATSAPP'], 'Elige LLAMADA o WHATSAPP'),
});
const esquemaLogin = z.object({
  email: z.string().min(1, 'Ingresa tu correo'),
  contrasena: z.string().min(1, 'Ingresa tu contraseña'),
});

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Publico()
  @Post('registro')
  registro(@Body() body: unknown) {
    return this.auth.registrarCliente(validar(esquemaRegistro, body));
  }

  @Publico()
  @Post('login')
  @HttpCode(200)
  login(@Body() body: unknown) {
    const d = validar(esquemaLogin, body);
    return this.auth.login(d.email, d.contrasena);
  }

  @Get('yo')
  yo(@UsuarioActual() u: UsuarioSesion) {
    return this.auth.perfil(u.id);
  }
}
