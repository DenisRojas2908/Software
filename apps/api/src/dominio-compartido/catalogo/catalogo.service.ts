import { Injectable } from '@nestjs/common';
import { UsoVehiculo } from '@prisma/client';
import { PrismaService } from '../../persistencia/prisma.service';
import { CampoFormulario, unirCampos } from './formulario';

// Lee la configuración de negocio desde la BD (RNF-13): nada de esto está escrito en el código.
@Injectable()
export class CatalogoService {
  constructor(private readonly prisma: PrismaService) {}

  // RN-16: solo aseguradoras y planes activos participan en nuevas cotizaciones.
  aseguradorasActivas() {
    return this.prisma.aseguradora.findMany({
      where: { activa: true },
      include: { planes: { where: { activo: true }, orderBy: { nombre: 'asc' } } },
      orderBy: { nombre: 'asc' },
    });
  }

  async formulario(): Promise<CampoFormulario[]> {
    const campos = await this.prisma.campoRequerido.findMany({
      where: { activo: true, aseguradora: { activa: true } },
      include: { valores: { orderBy: { valor: 'asc' } } },
    });
    return unirCampos(
      campos.map((c) => ({
        nombre: c.nombre,
        tipo: c.tipo,
        obligatorio: c.obligatorio,
        valores: c.valores.map((v) => v.valor),
      })),
    );
  }

  // RN-25: ids de aseguradoras que exigen inspección para este uso
  async aseguradorasConInspeccion(uso: UsoVehiculo): Promise<Set<string>> {
    const reglas = await this.prisma.reglaInspeccion.findMany({ where: { uso, requiereInspeccion: true } });
    return new Set(reglas.map((r) => r.aseguradoraId));
  }

  parametros() {
    return this.prisma.parametrosComerciales.findFirstOrThrow();
  }
}
