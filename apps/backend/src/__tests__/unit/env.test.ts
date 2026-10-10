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
    // JWT_REFRESH_SECRET no bloquea el arranque: solo se avisa.
    expect(r.errors.join(' ')).not.toMatch(/JWT_REFRESH_SECRET/);
    expect(r.warnings.some((w) => w.startsWith('JWT_REFRESH_SECRET'))).toBe(true);
  });

  it('producción sin JWT_REFRESH_SECRET: arranca y avisa que el login fallará', () => {
    const { JWT_REFRESH_SECRET: _omit, ...sinRefresh } = base;
    const r = validateEnv({ NODE_ENV: 'production', ...sinRefresh });
    expect(r.ok).toBe(true);
    expect(r.warnings.some((w) => w.startsWith('JWT_REFRESH_SECRET') && /inicio de sesión/.test(w))).toBe(true);
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

  it('avisa por SMTP_USER y SMTP_PASS (las que deciden si sale correo), no por SMTP_HOST', () => {
    const sinCorreo = validateEnv({ NODE_ENV: 'production', ...base });
    expect(sinCorreo.warnings.some((w) => w.startsWith('SMTP_USER y SMTP_PASS') && /no sale ningún correo/.test(w))).toBe(true);
    expect(sinCorreo.warnings.some((w) => w.startsWith('SMTP_HOST'))).toBe(false);

    const soloUsuario = validateEnv({ NODE_ENV: 'production', ...base, SMTP_USER: 'equipo@ejemplo.co' });
    expect(soloUsuario.warnings.some((w) => w.startsWith('SMTP_PASS:') && /no sale ningún correo/.test(w))).toBe(true);

    const conCorreo = validateEnv({ NODE_ENV: 'production', ...base, SMTP_USER: 'equipo@ejemplo.co', SMTP_PASS: 'clave-de-prueba' });
    expect(conCorreo.warnings.some((w) => w.startsWith('SMTP_'))).toBe(false);
    expect(conCorreo.warnings.join(' ')).not.toContain('clave-de-prueba');
  });

  it('avisa si faltan DEMO_UPLOAD_ENABLED, INTERNAL_API_KEY y ADMIN_EMAIL', () => {
    const r = validateEnv({ NODE_ENV: 'production', ...base });
    expect(r.warnings.some((w) => w.startsWith('DEMO_UPLOAD_ENABLED') && /apagada/.test(w))).toBe(true);
    expect(r.warnings.some((w) => w.startsWith('INTERNAL_API_KEY') && /IP/.test(w))).toBe(true);
    expect(r.warnings.some((w) => w.startsWith('ADMIN_EMAIL') && /avisos al equipo/.test(w))).toBe(true);

    const apagadaAPropósito = validateEnv({ NODE_ENV: 'production', ...base, DEMO_UPLOAD_ENABLED: 'false', INTERNAL_API_KEY: 'k'.repeat(32) });
    expect(apagadaAPropósito.warnings.some((w) => w.startsWith('DEMO_UPLOAD_ENABLED'))).toBe(false);
    expect(apagadaAPropósito.warnings.some((w) => w.startsWith('INTERNAL_API_KEY'))).toBe(false);

    const malEscrita = validateEnv({ NODE_ENV: 'production', ...base, DEMO_UPLOAD_ENABLED: 'TRUE' });
    expect(malEscrita.warnings).toContain('DEMO_UPLOAD_ENABLED: debe ser true o false → «Prueba con tu documento» queda apagada');
    expect(malEscrita.warnings.join(' ')).not.toContain('TRUE');
  });

  it('JWT_REFRESH_EXPIRES_IN: avisa si es inválida o mayor de 7 días', () => {
    expect(validateEnv({ NODE_ENV: 'production', ...base, JWT_REFRESH_EXPIRES_IN: '3d' }).warnings.some((w) => w.startsWith('JWT_REFRESH_EXPIRES_IN'))).toBe(false);
    expect(validateEnv({ NODE_ENV: 'production', ...base, JWT_REFRESH_EXPIRES_IN: 'una semana' }).warnings.some((w) => w.startsWith('JWT_REFRESH_EXPIRES_IN') && /inválida/.test(w))).toBe(true);
    expect(validateEnv({ NODE_ENV: 'production', ...base, JWT_REFRESH_EXPIRES_IN: '30d' }).warnings.some((w) => w.startsWith('JWT_REFRESH_EXPIRES_IN') && /7 días/.test(w))).toBe(true);
  });

  it('avisa si los dos secretos JWT son iguales', () => {
    const r = validateEnv({ NODE_ENV: 'production', ...base, JWT_REFRESH_SECRET: base.JWT_SECRET });
    expect(r.warnings.some((w) => w.startsWith('JWT_REFRESH_SECRET'))).toBe(true);
  });
});
