import { Injectable } from '@nestjs/common';
import { CanalContacto, Prisma, UsoVehiculo } from '@prisma/client';
import { UsuarioSesion } from '../../seguridad/decoradores';

export interface Contacto {
  nombres: string;
  telefono: string;
  email?: string;
  canalPreferido: CanalContacto;
}

export interface DatosVehiculoRegistro {
  uso: UsoVehiculo;
  marca: string;
  modelo: string;
  anio: number;
  clase?: string;
  tipo?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  adicionales: Record<string, string | number>;
}

type Tx = Prisma.TransactionClient;

// RF-07 + D-16 + D-46: registro único de cliente y vehículo.
// - CLIENTE con sesión → su propio Cliente.
// - Invitado → se reutiliza un Cliente SIN cuenta con el mismo correo o teléfono; si no hay, se crea.
//   (Un invitado nunca se "cuelga" de un cliente con cuenta: no podría ver su propia cotización.)
@Injectable()
export class RegistroUnicoService {
  async buscarCliente(tx: Tx, contacto: Contacto, usuario?: UsuarioSesion) {
    if (usuario?.rol === 'CLIENTE') return tx.cliente.findUnique({ where: { usuarioId: usuario.id } });
    const o: Prisma.ClienteWhereInput[] = [{ telefono: contacto.telefono }];
    if (contacto.email) o.push({ email: contacto.email.toLowerCase() });
    return tx.cliente.findFirst({ where: { usuarioId: null, OR: o }, orderBy: { id: 'asc' } });
  }

  // RN-05: cuántos vehículos de ese uso tendría el cliente si se registra este
  async vehiculosConUso(tx: Tx, clienteId: string | undefined, v: DatosVehiculoRegistro): Promise<number> {
    if (!clienteId) return 1;
    const existentes = await tx.vehiculo.findMany({ where: { clienteId, uso: v.uso } });
    const yaEsta = existentes.some((e) => this.mismoVehiculo(e, v));
    return existentes.length + (yaEsta ? 0 : 1);
  }

  async registrar(tx: Tx, contacto: Contacto, v: DatosVehiculoRegistro, usuario?: UsuarioSesion) {
    let cliente = await this.buscarCliente(tx, contacto, usuario);
    const datosContacto = {
      nombres: contacto.nombres,
      telefono: contacto.telefono,
      email: contacto.email?.toLowerCase() || undefined,
      canalPreferido: contacto.canalPreferido,
    };
    cliente = cliente
      ? await tx.cliente.update({ where: { id: cliente.id }, data: datosContacto })
      : await tx.cliente.create({ data: datosContacto });

    const candidatos = await tx.vehiculo.findMany({ where: { clienteId: cliente.id, uso: v.uso } });
    const existente = candidatos.find((e) => this.mismoVehiculo(e, v));
    const datosVehiculo = {
      clase: v.clase ?? null,
      tipo: v.tipo ?? null,
      datosAdicionales: v.adicionales as Prisma.InputJsonValue,
    };
    const vehiculo = existente
      ? await tx.vehiculo.update({ where: { id: existente.id }, data: datosVehiculo })
      : await tx.vehiculo.create({
          data: {
            ...datosVehiculo,
            uso: v.uso,
            marca: v.marca,
            modelo: v.modelo,
            anio: v.anio,
            clienteId: cliente.id,
          },
        });
    if (v.departamento && v.provincia && v.distrito) {
      const ubicacion = { departamento: v.departamento, provincia: v.provincia, distrito: v.distrito };
      await tx.ubicacionUso.upsert({
        where: { vehiculoId: vehiculo.id },
        create: { ...ubicacion, vehiculoId: vehiculo.id },
        update: ubicacion,
      });
    }
    return { cliente, vehiculo };
  }

  private mismoVehiculo(e: { marca: string; modelo: string; anio: number }, v: DatosVehiculoRegistro) {
    return e.marca === v.marca && e.modelo.toLowerCase() === v.modelo.toLowerCase() && e.anio === v.anio;
  }
}
