import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Prisma 7 se conecta a PostgreSQL mediante un "driver adapter" (pg). Conexión directa → transacciones reales (D-03).
export function opcionesPrisma(url = process.env.DATABASE_URL) {
  return { adapter: new PrismaPg({ connectionString: url }) };
}

export function crearPrisma(url?: string): PrismaClient {
  return new PrismaClient(opcionesPrisma(url));
}
