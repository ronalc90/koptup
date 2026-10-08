/**
 * Variables de entorno para las pruebas de Jest del backend.
 *
 * Son valores ficticios, solo válidos en pruebas: nunca pongas aquí claves
 * reales. Si la prueba necesita otro valor, se puede sobrescribir antes de
 * ejecutar Jest (por ejemplo, MONGODB_URI en CI).
 */
import os from 'os';
import path from 'path';

const testEnv: Record<string, string> = {
  NODE_ENV: 'test',
  JWT_SECRET: 'test-jwt-secret',
  JWT_REFRESH_SECRET: 'test-jwt-refresh-secret',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/koptup_test',
  // Las pruebas de integración usan REDIS_URL_TEST si está definida.
  REDIS_URL: process.env.REDIS_URL_TEST || 'redis://127.0.0.1:6379/15',
  OPENAI_API_KEY: 'sk-test-mock',
  // La API cuenta peticiones por IP; las pruebas hacen muchas desde 127.0.0.1.
  RATE_LIMIT_MAX_REQUESTS: '100000',
  CHATBOT_RATE_LIMIT_MAX: '100000',
  CHATBOT_CREATE_LIMIT_PER_HOUR: '100000',
  // Estado del chatbot aislado por proceso de prueba (no toca data/chatbots).
  CHATBOT_STATE_DIR: path.join(os.tmpdir(), `koptup-chatbot-test-${process.pid}-${Date.now()}`),
};

for (const [key, value] of Object.entries(testEnv)) {
  if (process.env[key] === undefined || key === 'NODE_ENV') {
    process.env[key] = value;
  }
}
