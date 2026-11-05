// Una vez por corrida: aplica las migraciones pendientes a la base de pruebas y recarga el seed (que vacía las tablas).
const { execSync } = require('node:child_process');

module.exports = async () => {
  require('./entorno.js');
  const env = { ...process.env, DATABASE_URL: process.env.DATABASE_URL };
  execSync('npx prisma migrate deploy', { stdio: 'ignore', env });
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit', env });
};
