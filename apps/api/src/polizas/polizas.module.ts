import { Module } from '@nestjs/common';
import { PolizaService } from './poliza.service';
import { PolizasController } from './polizas.controller';

@Module({ controllers: [PolizasController], providers: [PolizaService], exports: [PolizaService] })
export class PolizasModule {}
