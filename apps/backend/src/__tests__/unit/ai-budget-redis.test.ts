import { EventEmitter } from 'events';

/**
 * getReadyRedis al arrancar: `getRedisClient` devuelve el cliente apenas abre
 * la conexión, antes del evento `ready`. Antes, esa primera consulta fallaba
 * ("Redis no está listo") y dejaba las funciones con IA apagadas 30 s después
 * de cada despliegue.
 */

class FakeRedisClient extends EventEmitter {
  isReady = false;
  becomeReady(): void {
    this.isReady = true;
    this.emit('ready');
  }
}

const fake = { client: new FakeRedisClient() };

jest.mock('../../config/redis', () => ({
  getRedisClient: jest.fn(async () => fake.client),
}));

import { getReadyRedis, resetRedisCooldownForTests } from '../../services/ai-budget.service';

describe('getReadyRedis', () => {
  beforeEach(() => {
    fake.client = new FakeRedisClient();
    resetRedisCooldownForTests();
  });

  it('espera a que un cliente recién abierto quede listo en vez de fallar', async () => {
    setTimeout(() => fake.client.becomeReady(), 50);
    await expect(getReadyRedis()).resolves.toBe(fake.client);
    // No quedan oyentes colgados del evento `ready`.
    expect(fake.client.listenerCount('ready')).toBe(0);
  });

  it('devuelve de inmediato un cliente que ya está listo', async () => {
    fake.client.becomeReady();
    await expect(getReadyRedis()).resolves.toBe(fake.client);
  });

  it('si Redis nunca queda listo, falla cerrado (null) y no reintenta durante el enfriamiento', async () => {
    jest.useFakeTimers();
    try {
      const pending = getReadyRedis();
      await jest.advanceTimersByTimeAsync(7_000);
      await expect(pending).resolves.toBeNull();
      expect(fake.client.listenerCount('ready')).toBe(0);
      // Ahora sí está listo, pero dentro del enfriamiento de 30 s no se reintenta.
      fake.client.becomeReady();
      await expect(getReadyRedis()).resolves.toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });
});
