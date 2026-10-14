/**
 * email.service con Resend (API HTTPS): fetch simulado, nunca sale un correo
 * real. Verifica headers, cuerpo, reply_to, Idempotency-Key, el respaldo
 * onboarding@resend.dev ante un dominio no verificado, el reintento único
 * ante 429/5xx/red y el timeout.
 */
import { EmailService, RESEND_ONBOARDING_FROM, parseEmailList } from '../../services/email.service';

const KEY = 're_clave_de_prueba_1234567890';
const ENV = {
  RESEND_API_KEY: KEY,
  RESEND_API_URL: 'http://resend.mock/',
  NOTIFY_EMAIL: 'dueno@koptup-prueba.co',
  ADMIN_EMAIL: 'admin@koptup-prueba.co',
} as NodeJS.ProcessEnv;

type Call = { url: string; init: RequestInit & { headers: Record<string, string> }; body: any };

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('email.service con Resend', () => {
  let calls: Call[];
  let replies: Array<Response | Error | ((init: RequestInit) => Promise<Response>)>;

  beforeEach(() => {
    calls = [];
    replies = [];
    jest.spyOn(global, 'fetch').mockImplementation(async (input: any, init?: any) => {
      calls.push({ url: String(input), init, body: JSON.parse(String(init?.body ?? '{}')) });
      const next = replies.shift() ?? json(200, { id: 're_default' });
      if (next instanceof Error) throw next;
      if (typeof next === 'function') return next(init);
      return next;
    });
  });

  afterEach(() => jest.restoreAllMocks());

  const msg = {
    to: 'dueno@koptup-prueba.co',
    subject: 'Nuevo contacto:\r\nAna',
    html: '<p>Hola</p>',
    text: 'Hola',
    replyTo: 'ana@cliente.co',
    idempotencyKey: 'contact-abc-email',
    ownerNotice: true,
  };

  it('POST /emails con Bearer, User-Agent, Idempotency-Key y el cuerpo exacto (reply_to incluido)', async () => {
    replies.push(json(200, { id: 're_123' }));
    const svc = new EmailService(ENV);
    expect(svc.getProvider()).toBe('resend');
    expect(svc.isOwnerNoticeConfigured()).toBe(true);
    const r = await svc.send(msg);
    expect(r).toEqual({ ok: true, configurado: true, proveedor: 'resend', id: 're_123', status: 200 });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('http://resend.mock/emails');
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.headers).toEqual({
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'koptup-backend/1.0',
      'Idempotency-Key': 'contact-abc-email',
    });
    expect(calls[0].body).toEqual({
      from: 'KopTup <avisos@koptup.com>',
      to: ['dueno@koptup-prueba.co'],
      subject: 'Nuevo contacto: Ana',
      html: '<p>Hola</p>',
      text: 'Hola',
      reply_to: 'ana@cliente.co',
    });
    expect(calls[0].init.signal).toBeDefined();
  });

  it('sin Idempotency-Key ni reply_to cuando el llamador no los da; EMAIL_FROM propio', async () => {
    const svc = new EmailService({ ...ENV, EMAIL_FROM: 'Equipo <hola@koptup.com>' });
    await svc.sendMail({ to: 'x@cliente.co', subject: 'Hola', html: '<p>h</p>', text: 'h' });
    expect(calls[0].init.headers['Idempotency-Key']).toBeUndefined();
    expect(calls[0].body.reply_to).toBeUndefined();
    expect(calls[0].body.from).toBe('Equipo <hola@koptup.com>');
  });

  it('403 por dominio no verificado en un aviso al dueño: reintenta desde onboarding@resend.dev con otra Idempotency-Key', async () => {
    replies.push(json(403, { statusCode: 403, name: 'validation_error', message: 'The koptup.com domain is not verified. Please, add and verify your domain on https://resend.com/domains' }));
    replies.push(json(200, { id: 're_onb' }));
    const r = await new EmailService(ENV).send(msg);
    expect(calls).toHaveLength(2);
    expect(calls[1].body.from).toBe(RESEND_ONBOARDING_FROM);
    expect(calls[1].init.headers['Idempotency-Key']).toBe('contact-abc-email-onboarding');
    expect(r).toMatchObject({ ok: true, id: 're_onb', respaldo: 'onboarding@resend.dev' });
    expect(r.error).toMatch(/not verified/);
  });

  it('403 de dominio en un correo a terceros: no usa el respaldo', async () => {
    replies.push(json(403, { name: 'validation_error', message: 'The koptup.com domain is not verified.' }));
    const r = await new EmailService(ENV).send({ ...msg, ownerNotice: false });
    expect(calls).toHaveLength(1);
    expect(r).toMatchObject({ ok: false, status: 403 });
  });

  it('429 y 5xx: un único reintento inmediato; 4xx no se reintenta', async () => {
    replies.push(json(429, { name: 'rate_limit_exceeded', message: 'Too many requests' }), json(200, { id: 're_2' }));
    expect(await new EmailService(ENV).send(msg)).toMatchObject({ ok: true, id: 're_2' });
    expect(calls).toHaveLength(2);
    // Misma Idempotency-Key en el reintento.
    expect(calls[1].init.headers['Idempotency-Key']).toBe('contact-abc-email');

    calls.length = 0;
    replies.push(json(500, { message: 'boom' }), json(503, { message: 'boom' }));
    const fail = await new EmailService(ENV).send(msg);
    expect(calls).toHaveLength(2);
    expect(fail).toMatchObject({ ok: false, configurado: true, proveedor: 'resend', status: 503 });

    calls.length = 0;
    replies.push(json(422, { name: 'validation_error', message: 'Invalid `to` field' }));
    const invalid = await new EmailService(ENV).send(msg);
    expect(calls).toHaveLength(1);
    expect(invalid.error).toMatch(/Resend 422: validation_error: Invalid/);
  });

  it('error de red: reintenta una vez; el error no expone la key y enmascara correos', async () => {
    replies.push(new Error(`connect ECONNREFUSED (Bearer ${KEY})`), json(401, { name: 'missing_api_key', message: `bad key ${KEY} for dueno@koptup-prueba.co` }));
    const r = await new EmailService(ENV).send(msg);
    expect(calls).toHaveLength(2);
    expect(r.ok).toBe(false);
    expect(r.error).not.toContain(KEY);
    expect(r.error).not.toContain('dueno@koptup-prueba.co');
    expect(r.error).toContain('du***@koptup-prueba.co');
  });

  it('timeout real con AbortSignal: sin respuesta → reintento → fallo con el motivo', async () => {
    const hang = (init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject((init.signal as AbortSignal).reason));
      });
    replies.push(hang, hang);
    const r = await new EmailService(ENV, { timeoutMs: 50 }).send(msg);
    expect(calls).toHaveLength(2);
    expect(r).toMatchObject({ ok: false, configurado: true });
    expect(r.error).toMatch(/sin respuesta/);
  });

  it('reply_to solo con un correo ASCII simple (Resend rechaza con 422 los demás y el aviso no saldría nunca)', async () => {
    const svc = new EmailService(ENV);
    for (const replyTo of ['"a b"@example.com', 'josé@ejemplo.co', 'ñandú@correo.com.co']) {
      calls.length = 0;
      expect((await svc.send({ ...msg, replyTo })).ok).toBe(true);
      expect(calls[0].body.reply_to).toBeUndefined();
    }
    calls.length = 0;
    await svc.send({ ...msg, replyTo: 'Ana.Perez+demo@cliente-prueba.co' });
    expect(calls[0].body.reply_to).toBe('Ana.Perez+demo@cliente-prueba.co');
  });

  it('logLabel: el log usa la etiqueta y no el asunto (que lleva el nombre de la persona)', async () => {
    const { logger } = await import('../../utils/logger');
    const info = jest.spyOn(logger, 'info');
    await new EmailService(ENV).send({ ...msg, subject: '🔔 Nuevo contacto: Juana Pérez Gómez - ERP', logLabel: 'aviso del contacto 123' });
    const lines = info.mock.calls.map((c) => String(c[0]));
    expect(lines.some((l) => l.includes('aviso del contacto 123'))).toBe(true);
    expect(lines.some((l) => l.includes('Juana'))).toBe(false);
  });

  it('RESEND_API_URL: en producción solo se acepta localhost (si no, va a api.resend.com con la key)', async () => {
    await new EmailService({ ...ENV, NODE_ENV: 'production', RESEND_API_URL: 'http://evil.example.com' }).send(msg);
    expect(calls[0].url).toBe('https://api.resend.com/emails');
    await new EmailService({ ...ENV, NODE_ENV: 'production', RESEND_API_URL: 'http://localhost:3998/' }).send(msg);
    expect(calls[1].url).toBe('http://localhost:3998/emails');
  });

  it('2xx sin id no cuenta como enviado', async () => {
    replies.push(json(200, {}), json(200, {}));
    const r = await new EmailService(ENV).send(msg);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/sin id/);
  });

  it('sin RESEND_API_KEY ni SMTP: no configurado y no llama a nadie', async () => {
    const svc = new EmailService({ NOTIFY_EMAIL: 'dueno@koptup-prueba.co' } as NodeJS.ProcessEnv);
    expect(svc.isConfigured()).toBe(false);
    expect(svc.missingForOwnerNotice()).toEqual(['RESEND_API_KEY']);
    const r = await svc.send(msg);
    expect(r).toMatchObject({ ok: false, configurado: false, proveedor: null });
    expect(calls).toHaveLength(0);
  });

  it('destino: NOTIFY_EMAIL (lista) y, si falta, ADMIN_EMAIL', () => {
    expect(new EmailService({ ...ENV, NOTIFY_EMAIL: 'a@x.co, b@x.co ,a@x.co, malo' }).getNotifyEmails()).toEqual(['a@x.co', 'b@x.co']);
    expect(new EmailService({ ...ENV, NOTIFY_EMAIL: '' }).getNotifyEmails()).toEqual(['admin@koptup-prueba.co']);
    const sinDestino = new EmailService({ RESEND_API_KEY: KEY } as NodeJS.ProcessEnv);
    expect(sinDestino.isOwnerNoticeConfigured()).toBe(false);
    expect(sinDestino.missingForOwnerNotice()).toEqual(['NOTIFY_EMAIL']);
    expect(parseEmailList(undefined)).toEqual([]);
  });

  it('con RESEND_API_KEY no se crea el transporte SMTP aunque haya SMTP_USER y SMTP_PASS', () => {
    const svc = new EmailService({ ...ENV, SMTP_USER: 'u@x.co', SMTP_PASS: 'p' });
    expect(svc.getProvider()).toBe('resend');
    expect((svc as unknown as { transporter: unknown }).transporter).toBeNull();
    const smtp = new EmailService({ SMTP_USER: 'u@x.co', SMTP_PASS: 'p' } as NodeJS.ProcessEnv);
    expect(smtp.getProvider()).toBe('smtp');
    const opts = (smtp as unknown as { transporter: { options: Record<string, unknown> } }).transporter.options;
    expect(opts).toMatchObject({ connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000 });
  });
});
