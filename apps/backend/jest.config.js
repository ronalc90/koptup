/**
 * Jest del backend (ts-jest).
 *
 * - Transforma TypeScript con ts-jest usando tsconfig.test.json (incluye los
 *   tipos de Jest, que el tsconfig.json de producción no carga).
 * - Busca pruebas en cualquier carpeta __tests__ bajo src/.
 * - setup-env.ts fija variables de entorno de prueba (sin secretos reales)
 *   antes de cargar cada suite.
 * - global-setup.js detecta MongoDB (MONGODB_URI_TEST) y Redis
 *   (REDIS_URL_TEST) para las pruebas de integración de
 *   src/__tests__/integration; sin ellos, esas pruebas se omiten.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    // tsconfig.jest.json = tsconfig.test.json + isolatedModules (transpila sin
    // chequear tipos; los tipos los revisa `npm run typecheck`).
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['<rootDir>/src/test/setup-env.ts'],
  // Detecta MongoDB/Redis para las pruebas de integración (se omiten si no hay).
  globalSetup: '<rootDir>/src/test/global-setup.js',
  clearMocks: true,
  // Las pruebas de integración cargan la app completa (todas las rutas).
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/__tests__/**',
    '!src/test/**',
    '!src/scripts/**',
    '!src/db/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
};
