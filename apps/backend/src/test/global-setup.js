/**
 * globalSetup de Jest: averigua si hay MongoDB y Redis para las pruebas de
 * integración (src/__tests__/integration). Sin MONGODB_URI_TEST, o si no
 * responde, esas pruebas se omiten con un aviso (no fallan).
 *
 *   MONGODB_URI_TEST=mongodb://127.0.0.1:27017/koptup_test \
 *   REDIS_URL_TEST=redis://127.0.0.1:6379/15 npm test
 *
 * Cada archivo de pruebas usa su propia base (sufijo) y la borra al terminar.
 * En Redis solo se tocan claves de prueba y se restauran las de gasto.
 */
module.exports = async () => {
  process.env.INTEGRATION_MONGO_OK = '0';
  process.env.INTEGRATION_REDIS_OK = '0';

  const mongoUri = process.env.MONGODB_URI_TEST;
  if (!mongoUri) {
    console.warn('\n[integración] MONGODB_URI_TEST no está definida: se omiten las pruebas de integración.');
  } else {
    try {
      const mongoose = require('mongoose');
      const conn = await mongoose.createConnection(mongoUri, { serverSelectionTimeoutMS: 3000 }).asPromise();
      await conn.close();
      process.env.INTEGRATION_MONGO_OK = '1';
    } catch (err) {
      console.warn(`\n[integración] MongoDB no responde en MONGODB_URI_TEST (${err && err.message}): se omiten las pruebas de integración.`);
    }
  }

  const redisUrl = process.env.REDIS_URL_TEST;
  if (!redisUrl) {
    console.warn('[integración] REDIS_URL_TEST no está definida: se omiten las pruebas de presupuesto y rate-limit en Redis.');
  } else {
    try {
      const { createClient } = require('redis');
      const client = createClient({ url: redisUrl, socket: { connectTimeout: 3000, reconnectStrategy: false } });
      client.on('error', () => {});
      await client.connect();
      await client.ping();
      await client.quit();
      process.env.INTEGRATION_REDIS_OK = '1';
    } catch (err) {
      console.warn(`[integración] Redis no responde en REDIS_URL_TEST (${err && err.message}): se omiten las pruebas de presupuesto.`);
    }
  }
};
