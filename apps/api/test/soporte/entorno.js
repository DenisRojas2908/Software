// Antes de cada archivo de prueba: lee apps/api/.env y apunta DATABASE_URL a la base de pruebas.
try {
  process.loadEnvFile();
} catch {
  /* CI: variables del entorno */
}
if (process.env.DATABASE_URL_TEST) process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto-de-pruebas';
