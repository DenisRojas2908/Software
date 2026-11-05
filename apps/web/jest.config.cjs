// Jest para la web (D-04): TS con ts-jest, DOM simulado con jsdom.
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }] },
  moduleNameMapper: { '\\.(css)$': '<rootDir>/src/test/estilo-vacio.cjs' },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
};
