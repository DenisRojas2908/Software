import { Controller, Get } from '@nestjs/common';
import { Publico } from '../../seguridad/decoradores';
import { CatalogoService } from './catalogo.service';

@Controller('catalogo')
export class CatalogoController {
  constructor(private readonly catalogo: CatalogoService) {}

  // RF-02: el formulario del cotizador se arma con esto (sin cuenta, CU-01).
  @Publico()
  @Get('formulario')
  async formulario() {
    const [campos, aseguradoras] = await Promise.all([
      this.catalogo.formulario(),
      this.catalogo.aseguradorasActivas(),
    ]);
    return { campos, aseguradoras: aseguradoras.map((a) => a.nombre) };
  }
}
