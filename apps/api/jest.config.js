// Pruebas de la api (D-04).
// - src/**/*.spec.ts  → unitarias (dominio puro, sin BD)
// - test/**/*.e2e-spec.ts → integración con PostgreSQL (base svas_test), vía HTTP con Supertest
// En el job de Windows del CI no hay Postgres: SIN_BD=true corre solo las unitarias.
const sinBd = process.env.SIN_BD === 'true';

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  roots: sinBd ? ['<rootDir>/src'] : ['<rootDir>/src', '<rootDir>/test'],
  testRegex: '.*\\.(spec|e2e-spec)\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  testEnvironment: 'node',
  passWithNoTests: true,
  setupFiles: ['<rootDir>/test/soporte/entorno.js'],
  globalSetup: sinBd ? undefined : '<rootDir>/test/soporte/preparar-bd.js',
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
};
