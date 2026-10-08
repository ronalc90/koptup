/**
 * Jest de la web (next/jest + jsdom).
 *
 * next/jest carga next.config.js y .env, transforma TS/JSX con SWC y simula
 * CSS, imágenes y fuentes. Aquí se añaden:
 * - el entorno jsdom y la configuración común de jest.setup.ts;
 * - el alias "@/..." → src/... (igual que tsconfig.json);
 * - las carpetas que no son pruebas de Jest (e2e de Playwright y .next).
 *
 * Los mensajes agregados (messages/_demos.*.json y _offerings.*.json) los
 * genera el script "pretest" (scripts/merge-messages.mjs).
 */
const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: __dirname });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // jsdom resuelve la condición "browser" de jspdf, que es un módulo ES que
    // Jest no transforma (está en node_modules). La build UMD es equivalente
    // y se puede cargar con require.
    '^jspdf$': require.resolve('jspdf/dist/jspdf.umd.min.js'),
  },
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/e2e/'],
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/__tests__/**', '!src/test-utils/**'],
  coverageDirectory: '<rootDir>/coverage',
};

module.exports = createJestConfig(config);
