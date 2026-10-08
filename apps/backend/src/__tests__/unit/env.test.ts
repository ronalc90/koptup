import { validateEnv } from '../../config/env';

describe('validación de variables de entorno (zod)', () => {
  const base = {
    MONGODB_URI: 'mongodb://127.0.0.1:27017/koptup',
    JWT_SECRET: 'x'.repeat(40),
    JWT_REFRESH_SECRET: 'y'.repeat(40),
  };

  it('producción sin las imprescindibles: falla y nombra las variables (sin valores)', () => {
    const r = validateEnv({ NODE_ENV: 'production' });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/MONGODB_URI/);
    expect(r.errors.join(' ')).toMatch(/JWT_SECRET/);
    expect(r.errors.join(' ')).toMatch(/JWT_REFRESH_SECRET/);
  });

  it('producción completa: arranca y solo avisa de las opcionales', () => {
    const r = validateEnv({ NODE_ENV: 'production', ...base });
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.warnings.some((w) => w.startsWith('REDIS_URL'))).toBe(true);
    expect(r.warnings.join(' ')).not.toContain(base.JWT_SECRET);
  });

  it('desarrollo sin variables: no falla (solo avisa)', () => {
    const r = validateEnv({ NODE_ENV: 'development' });
    expect(r.ok).toBe(true);
    expect(r.warnings.some((w) => w.startsWith('MONGODB_URI'))).toBe(true);
  });

  it('formatos inválidos de opcionales: aviso, no error', () => {
    const r = validateEnv({ NODE_ENV: 'production', ...base, CHATBOT_MONTHLY_BUDGET_USD: 'mucho', ADMIN_EMAIL: 'no-es-email' });
    expect(r.ok).toBe(true);
    expect(r.warnings.some((w) => w.startsWith('CHATBOT_MONTHLY_BUDGET_USD'))).toBe(true);
    expect(r.warnings.some((w) => w.startsWith('ADMIN_EMAIL'))).toBe(true);
  });

  it('MONGODB_URI con formato inválido en producción: error', () => {
    const r = validateEnv({ NODE_ENV: 'production', ...base, MONGODB_URI: 'localhost' });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/^MONGODB_URI/);
  });

  it('avisa si los dos secretos JWT son iguales', () => {
    const r = validateEnv({ NODE_ENV: 'production', ...base, JWT_REFRESH_SECRET: base.JWT_SECRET });
    expect(r.warnings.some((w) => w.startsWith('JWT_REFRESH_SECRET'))).toBe(true);
  });
});
