// Jest para la web (D-04): TS con ts-jest, DOM simulado con jsdom.
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }] },
  moduleNameMapper: { '\\.(css)$': '<rootDir>/src/test/estilo-vacio.cjs' },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.cjs'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/main.tsx', '!src/test/**'],
  // RNF-16 (meta): cobertura mínima de la web
  coverageThreshold: { global: { lines: 70 } },
};
