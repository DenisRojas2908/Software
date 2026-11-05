import { Module } from '@nestjs/common';
import { AdministracionController } from './administracion.controller';
import { AdministracionService } from './administracion.service';
import { UsuariosController } from './usuarios.controller';

@Module({ controllers: [UsuariosController, AdministracionController], providers: [AdministracionService] })
export class AdministracionModule {}
