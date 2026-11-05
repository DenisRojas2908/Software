// Seed del SVAS: `npm run db:seed` (prisma db seed) o `npx tsx prisma/seed.ts`.
// Los datos y valores iniciales viven en src/persistencia/seed-datos.ts (RNF-13).
import { crearPrisma } from '../src/persistencia/crear-prisma';
import { sembrar } from '../src/persistencia/seed-datos';

export { USUARIOS_DEMO, PARAMETROS_INICIALES } from '../src/persistencia/seed-datos';

if (require.main === module) {
  try {
    process.loadEnvFile();
  } catch {
    /* sin .env */
  }
  const prisma = crearPrisma();
  // FECHA_SEED permite sembrar con una fecha fija (las pruebas usan 2026-11-05, D-50)
  sembrar(prisma, process.env.FECHA_SEED ? new Date(process.env.FECHA_SEED) : new Date())
    .then(() => console.log('Seed SVAS cargado.'))
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
