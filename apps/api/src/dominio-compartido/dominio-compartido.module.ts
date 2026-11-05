import { Global, Module } from '@nestjs/common';
import { CatalogoController } from './catalogo/catalogo.controller';
import { CatalogoService } from './catalogo/catalogo.service';
import { RegistroUnicoService } from './cliente/registro-unico.service';

// Catálogo y registro único de cliente/vehículo: lo usan cotización, compra, asesoría y administración.
@Global()
@Module({
  controllers: [CatalogoController],
  providers: [CatalogoService, RegistroUnicoService],
  exports: [CatalogoService, RegistroUnicoService],
})
export class DominioCompartidoModule {}
