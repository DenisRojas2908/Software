import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AutenticacionGuard } from './autenticacion.guard';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: (process.env.JWT_EXPIRA ?? '2h') as never },
      }),
    }),
  ],
  controllers: [AuthController],
  // APP_GUARD: el guard se aplica a todas las rutas de la API
  providers: [AuthService, { provide: APP_GUARD, useClass: AutenticacionGuard }],
  exports: [AuthService],
})
export class SeguridadModule {}
