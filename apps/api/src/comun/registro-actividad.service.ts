import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../persistencia/prisma.service';
import { RELOJ, Reloj } from './reloj';

type Cliente = PrismaService | Prisma.TransactionClient;

// RNF-12: registra acciones críticas con usuario y fecha. Recibe la transacción en curso
// para que la acción y su registro se guarden juntos (o ninguno).
@Injectable()
export class RegistroActividadService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(RELOJ) private readonly reloj: Reloj,
  ) {}

  registrar(accion: string, entidad: string, usuarioId: string | null, tx: Cliente = this.prisma) {
    return tx.registroActividad.create({ data: { accion, entidad, usuarioId, fecha: this.reloj.ahora() } });
  }
}
