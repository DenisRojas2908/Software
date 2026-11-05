import { defineConfig } from 'prisma/config';

// Prisma 7: la URL de la BD se define aquí (no en schema.prisma). Lee apps/api/.env si existe.
try {
  process.loadEnvFile();
} catch {
  /* sin .env */
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
  datasource: { url: process.env.DATABASE_URL ?? '' },
});
