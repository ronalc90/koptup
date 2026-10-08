/**
 * Jest del backend (ts-jest).
 *
 * - Transforma TypeScript con ts-jest usando tsconfig.test.json (incluye los
 *   tipos de Jest, que el tsconfig.json de producción no carga).
 * - Busca pruebas en cualquier carpeta __tests__ bajo src/.
 * - setup-env.ts fija variables de entorno de prueba (sin secretos reales)
 *   antes de cargar cada suite.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['<rootDir>/src/test/setup-env.ts'],
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/__tests__/**',
    '!src/test/**',
    '!src/scripts/**',
    '!src/db/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
};
