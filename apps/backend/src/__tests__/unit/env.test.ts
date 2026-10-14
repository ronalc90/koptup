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

  it('correo: sin RESEND_API_KEY ni SMTP avisa que no sale ningún correo; SMTP sin Resend advierte el bloqueo de Railway', () => {
    const sinCorreo = validateEnv({ NODE_ENV: 'production', ...base });
    expect(sinCorreo.warnings.some((w) => w.startsWith('RESEND_API_KEY') && /no sale ningún correo/.test(w))).toBe(true);
    // SMTP es solo respaldo: sin ninguna de sus variables no se avisa por ellas.
    expect(sinCorreo.warnings.some((w) => w.startsWith('SMTP_'))).toBe(false);

    const soloUsuario = validateEnv({ NODE_ENV: 'production', ...base, SMTP_USER: 'equipo@ejemplo.co' });
    expect(soloUsuario.warnings.some((w) => w.startsWith('SMTP_PASS:') && /respaldo SMTP/.test(w))).toBe(true);

    const conSmtp = validateEnv({ NODE_ENV: 'production', ...base, SMTP_USER: 'equipo@ejemplo.co', SMTP_PASS: 'clave-de-prueba' });
    expect(conSmtp.warnings.some((w) => w.startsWith('SMTP_USER y SMTP_PASS sin RESEND_API_KEY') && /Railway/.test(w) && /Hobby/.test(w))).toBe(true);
    expect(conSmtp.warnings.some((w) => w.startsWith('RESEND_API_KEY'))).toBe(false);
    expect(conSmtp.warnings.join(' ')).not.toContain('clave-de-prueba');

    const conResend = validateEnv({ NODE_ENV: 'production', ...base, RESEND_API_KEY: 're_clave_de_prueba', NOTIFY_EMAIL: 'dueno@ejemplo.co' });
    expect(conResend.warnings.some((w) => w.startsWith('RESEND_API_KEY') || w.startsWith('SMTP_') || w.startsWith('NOTIFY_EMAIL'))).toBe(false);
    expect(conResend.warnings.join(' ')).not.toContain('re_clave_de_prueba');
  });

  it('destino de los avisos: NOTIFY_EMAIL o, si falta, ADMIN_EMAIL; acepta una lista separada por comas', () => {
    expect(validateEnv({ NODE_ENV: 'production', ...base }).warnings.some((w) => w.startsWith('NOTIFY_EMAIL') && /nuevos contactos/.test(w))).toBe(true);
    expect(validateEnv({ NODE_ENV: 'production', ...base, ADMIN_EMAIL: 'admin@ejemplo.co' }).warnings.some((w) => w.startsWith('NOTIFY_EMAIL'))).toBe(false);
    expect(validateEnv({ NODE_ENV: 'production', ...base, NOTIFY_EMAIL: 'a@ejemplo.co, b@ejemplo.co' }).warnings.some((w) => w.startsWith('NOTIFY_EMAIL'))).toBe(false);
    const mala = validateEnv({ NODE_ENV: 'production', ...base, NOTIFY_EMAIL: 'a@ejemplo.co, no-es-email' });
    expect(mala.warnings.some((w) => w.startsWith('NOTIFY_EMAIL') && /separados por coma/.test(w))).toBe(true);
    expect(mala.warnings.join(' ')).not.toContain('no-es-email');
  });

  it('WhatsApp: variables de Meta, proveedor heredado no soportado, webhook y formatos', () => {
    const sinWa = validateEnv({ NODE_ENV: 'production', ...base });
    expect(sinWa.warnings).toContain('WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID, ADMIN_WHATSAPP_NUMBER: no están definidas → avisos por WhatsApp apagados');

    const twilio = validateEnv({ NODE_ENV: 'production', ...base, WHATSAPP_PROVIDER: 'twilio' });
    expect(twilio.warnings.some((w) => w.startsWith('WHATSAPP_PROVIDER') && /no soportado/.test(w) && /meta/.test(w))).toBe(true);
    expect(validateEnv({ NODE_ENV: 'production', ...base, WHATSAPP_PROVIDER: 'ultramsg' }).warnings.some((w) => w.startsWith('WHATSAPP_PROVIDER'))).toBe(true);

    const meta = { WHATSAPP_API_TOKEN: 'EAAG-token-de-prueba', WHATSAPP_PHONE_NUMBER_ID: '123456789012345', ADMIN_WHATSAPP_NUMBER: '+57 300 123 4567' };
    const sinWebhook = validateEnv({ NODE_ENV: 'production', ...base, ...meta });
    expect(sinWebhook.warnings.some((w) => w.startsWith('WHATSAPP_API_TOKEN'))).toBe(false);
    expect(sinWebhook.warnings.some((w) => w.startsWith('WHATSAPP_APP_SECRET y WHATSAPP_WEBHOOK_VERIFY_TOKEN') && /webhook/.test(w))).toBe(true);
    expect(sinWebhook.warnings.join(' ')).not.toContain('EAAG-token-de-prueba');

    const completo = validateEnv({ NODE_ENV: 'production', ...base, ...meta, WHATSAPP_PROVIDER: 'whatsapp-business', WHATSAPP_APP_SECRET: 's'.repeat(32), WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'v'.repeat(20) });
    expect(completo.warnings.some((w) => w.startsWith('WHATSAPP'))).toBe(false);

    const formatos = validateEnv({
      NODE_ENV: 'production',
      ...base,
      ...meta,
      ADMIN_WHATSAPP_NUMBER: '300-abc',
      WHATSAPP_GRAPH_VERSION: '25',
      WHATSAPP_TEMPLATE_NAME: 'Koptup Aviso',
      NOTIFY_HEARTBEAT_DAYS: '-1',
      NOTIFY_JOBS_ENABLED: 'no',
    });
    for (const name of ['ADMIN_WHATSAPP_NUMBER', 'WHATSAPP_GRAPH_VERSION', 'WHATSAPP_TEMPLATE_NAME', 'NOTIFY_HEARTBEAT_DAYS', 'NOTIFY_JOBS_ENABLED']) {
      expect(formatos.warnings.some((w) => w.startsWith(`${name}:`))).toBe(true);
    }
    expect(formatos.ok).toBe(true);

    expect(validateEnv({ NODE_ENV: 'production', ...base, NOTIFY_JOBS_ENABLED: 'false' }).warnings.some((w) => w.startsWith('NOTIFY_JOBS_ENABLED') && /latido/.test(w))).toBe(true);
  });

  it('RESEND_API_URL y WHATSAPP_GRAPH_URL: avisa siempre (solo pruebas) y en producción ignora un host que no sea localhost', () => {
    const remote = validateEnv({ NODE_ENV: 'production', ...base, RESEND_API_URL: 'http://evil.example.com', WHATSAPP_GRAPH_URL: 'https://otro.example.com' });
    expect(remote.errors).toEqual([]);
    expect(remote.warnings.some((w) => w.startsWith('RESEND_API_URL') && /se ignora en producción/.test(w) && /api\.resend\.com/.test(w))).toBe(true);
    expect(remote.warnings.some((w) => w.startsWith('WHATSAPP_GRAPH_URL') && /se ignora en producción/.test(w))).toBe(true);
    expect(remote.warnings.join('\n')).not.toContain('evil.example.com');
    const local = validateEnv({ NODE_ENV: 'production', ...base, RESEND_API_URL: 'http://127.0.0.1:3998' });
    expect(local.warnings.some((w) => w.startsWith('RESEND_API_URL') && /servidor de pruebas/.test(w))).toBe(true);
    // Proveedor retirado: también nombra lo que falta de Meta.
    const twilio = validateEnv({ NODE_ENV: 'production', ...base, WHATSAPP_PROVIDER: 'twilio' });
    expect(twilio.warnings.some((w) => w.startsWith('WHATSAPP_PROVIDER') && /WHATSAPP_API_TOKEN/.test(w))).toBe(true);
  });

  it('avisa si faltan DEMO_UPLOAD_ENABLED, INTERNAL_API_KEY y ADMIN_EMAIL', () => {
    const r = validateEnv({ NODE_ENV: 'production', ...base });
    expect(r.warnings.some((w) => w.startsWith('DEMO_UPLOAD_ENABLED') && /apagada/.test(w))).toBe(true);
    expect(r.warnings.some((w) => w.startsWith('INTERNAL_API_KEY') && /IP/.test(w))).toBe(true);
    expect(r.warnings.some((w) => w.startsWith('ADMIN_EMAIL') && /admin/.test(w) && /NOTIFY_EMAIL/.test(w))).toBe(true);

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
