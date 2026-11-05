import 'reflect-metadata';
import { crearApp } from './app';

// Carga apps/api/.env sin dependencias extra (Node ≥ 20.12). Si no existe, se usan las variables del entorno.
try {
  process.loadEnvFile();
} catch {
  /* sin .env: variables del sistema */
}

async function iniciar() {
  const app = await crearApp();
  const puerto = Number(process.env.PORT ?? 3000);
  await app.listen(puerto);
  console.log(`SVAS api escuchando en http://localhost:${puerto}/api`);
}
void iniciar();
