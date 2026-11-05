import { Module } from '@nestjs/common';
import { PolizasModule } from '../polizas/polizas.module';
import { CompraController } from './compra.controller';
import { CompraService } from './compra.service';

@Module({
  imports: [PolizasModule],
  controllers: [CompraController],
  providers: [CompraService],
  exports: [CompraService],
})
export class CompraModule {}
