/**
 * Variables de entorno para las pruebas de Jest del backend.
 *
 * Son valores ficticios, solo válidos en pruebas: nunca pongas aquí claves
 * reales. Si la prueba necesita otro valor, se puede sobrescribir antes de
 * ejecutar Jest (por ejemplo, MONGODB_URI en CI).
 */
const testEnv: Record<string, string> = {
  NODE_ENV: 'test',
  JWT_SECRET: 'test-jwt-secret',
  JWT_REFRESH_SECRET: 'test-jwt-refresh-secret',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/koptup_test',
  REDIS_URL: 'redis://127.0.0.1:6379/15',
  OPENAI_API_KEY: 'sk-test-mock',
};

for (const [key, value] of Object.entries(testEnv)) {
  if (process.env[key] === undefined || key === 'NODE_ENV') {
    process.env[key] = value;
  }
}
