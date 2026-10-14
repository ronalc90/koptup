/**
 * whatsapp.service (Meta WhatsApp Cloud API, plantilla): fetch simulado,
 * nunca sale un WhatsApp real. Verifica el payload exacto, el saneamiento de
 * las variables, la lectura del JSON de error de Meta, que el éxito exija un
 * wamid, el respaldo hello_world y la firma del webhook.
 */
import crypto from 'crypto';
import {
  DETAIL_MAX,
  TITLE_MAX,
  WhatsAppService,
  sanitizeTemplateParam,
  verifyMetaSignature,
  withoutFinalPeriod,
} from '../../services/whatsapp.service';

const TOKEN = 'EAAG-token-de-prueba-123456';
const ENV = {
  WHATSAPP_API_TOKEN: TOKEN,
  WHATSAPP_PHONE_NUMBER_ID: '109876543210',
  ADMIN_WHATSAPP_NUMBER: '+57 300 123 4567',
  WHATSAPP_GRAPH_URL: 'http://graph.mock',
} as NodeJS.ProcessEnv;

type Call = { url: string; init: any; body: any };

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
const ok = (wamid = 'wamid.HBgM123') => json(200, { messaging_product: 'whatsapp', contacts: [{ input: '573001234567', wa_id: '573001234567' }], messages: [{ id: wamid }] });
const metaError = (status: number, code: number, extra: Record<string, unknown> = {}) =>
  json(status, { error: { message: '(#' + code + ') Error de prueba', type: 'OAuthException', code, fbtrace_id: 'AbCdEf123', ...extra } });

describe('whatsapp.service (Meta, plantilla)', () => {
  let calls: Call[];
  let replies: Array<Response | Error>;

  beforeEach(() => {
    calls = [];
    replies = [];
    jest.spyOn(global, 'fetch').mockImplementation(async (input: any, init?: any) => {
      calls.push({ url: String(input), init, body: JSON.parse(String(init?.body ?? '{}')) });
      const next = replies.shift() ?? ok();
      if (next instanceof Error) throw next;
      return next;
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it('payload exacto de la plantilla koptup_aviso (es) a v25.0 con el número en dígitos', async () => {
    const svc = new WhatsAppService(ENV);
    expect(svc.isConfigured()).toBe(true);
    const r = await svc.sendTemplate('Nuevo contacto de Ana', 'Servicio: RAG · Email: ana@cliente.co');
    expect(r).toEqual({ ok: true, configurado: true, id: 'wamid.HBgM123' });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('http://graph.mock/v25.0/109876543210/messages');
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.headers).toEqual({ Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' });
    expect(calls[0].body).toEqual({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '573001234567',
      type: 'template',
      template: {
        name: 'koptup_aviso',
        language: { code: 'es' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: 'Nuevo contacto de Ana' },
              { type: 'text', text: 'Servicio: RAG · Email: ana@cliente.co' },
            ],
          },
        ],
      },
    });
  });

  it('versión, plantilla e idioma configurables; por defecto graph.facebook.com', async () => {
    const svc = new WhatsAppService({ ...ENV, WHATSAPP_GRAPH_VERSION: 'v26.0', WHATSAPP_TEMPLATE_NAME: 'otro_aviso', WHATSAPP_TEMPLATE_LANG: 'es_CO' });
    await svc.sendTemplate('a', 'b');
    expect(calls[0].url).toBe('http://graph.mock/v26.0/109876543210/messages');
    expect(calls[0].body.template.name).toBe('otro_aviso');
    expect(calls[0].body.template.language.code).toBe('es_CO');
    const { WHATSAPP_GRAPH_URL: _omit, ...sinUrl } = ENV;
    await new WhatsAppService(sinUrl as NodeJS.ProcessEnv).sendTemplate('a', 'b');
    expect(calls[1].url).toBe('https://graph.facebook.com/v25.0/109876543210/messages');
  });

  it('saneamiento: sin saltos de línea ni tabs, sin espacios repetidos, recortado y nunca vacío', async () => {
    expect(sanitizeTemplateParam('Hola\nmundo\r\n\r\nfin', 100)).toBe('Hola · mundo · fin');
    expect(sanitizeTemplateParam('a\tb      c', 100)).toBe('a b c');
    expect(sanitizeTemplateParam('\n\n  ', 100)).toBe('-');
    expect(sanitizeTemplateParam(null, 100)).toBe('-');
    const long = sanitizeTemplateParam('x'.repeat(2000), DETAIL_MAX);
    expect(Array.from(long)).toHaveLength(DETAIL_MAX);
    expect(long.endsWith('…')).toBe(true);
    await new WhatsAppService(ENV).sendTemplate(`Título\n${'t'.repeat(300)}`, `Mensaje:\n\tlínea 1\n\nlínea     2`);
    const [p1, p2] = calls[0].body.template.components[0].parameters.map((p: { text: string }) => p.text);
    expect(Array.from(p1).length).toBeLessThanOrEqual(TITLE_MAX);
    expect(p1).not.toMatch(/[\n\t]/);
    expect(p2).toBe('Mensaje: · línea 1 · línea 2');
    expect(p2).not.toMatch(/ {5,}/);
  });

  it('error de Meta: lee code, error_subcode, details y fbtrace_id, sin el token; no reintenta un 4xx', async () => {
    replies.push(metaError(400, 131030, { error_subcode: 2494010, error_data: { messaging_product: 'whatsapp', details: `Recipient not in allowed list (token ${TOKEN})` } }));
    const r = await new WhatsAppService(ENV).sendTemplate('a', 'b');
    expect(calls).toHaveLength(1);
    expect(r.ok).toBe(false);
    expect(r.codigo).toBe(131030);
    expect(r.error).toContain('Meta 400 código 131030/2494010');
    expect(r.error).toContain('Recipient not in allowed list');
    expect(r.error).toContain('fbtrace_id AbCdEf123');
    expect(r.error).toContain('lista de destinatarios permitidos');
    expect(r.error).not.toContain(TOKEN);
  });

  it('éxito solo con wamid: 200 sin messages[0].id es fallo', async () => {
    replies.push(json(200, { messaging_product: 'whatsapp' }));
    const r = await new WhatsAppService(ENV).sendTemplate('a', 'b');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/wamid/);
  });

  it('5xx, 429 y errores de red: un único reintento', async () => {
    replies.push(metaError(500, 1), ok('wamid.2'));
    expect(await new WhatsAppService(ENV).sendTemplate('a', 'b')).toMatchObject({ ok: true, id: 'wamid.2' });
    expect(calls).toHaveLength(2);
    calls.length = 0;
    replies.push(new Error('socket hang up'), metaError(429, 130429));
    const r = await new WhatsAppService(ENV).sendTemplate('a', 'b');
    expect(calls).toHaveLength(2);
    expect(r).toMatchObject({ ok: false, codigo: 130429 });
  });

  it('error de plantilla (132001): respaldo hello_world en_US sin parámetros, y el resultado lo indica', async () => {
    replies.push(metaError(404, 132001, { error_data: { details: 'template name (koptup_aviso) does not exist in es' } }), ok('wamid.hello'));
    const r = await new WhatsAppService(ENV).sendTemplate('a', 'b');
    expect(calls).toHaveLength(2);
    expect(calls[1].body).toEqual({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '573001234567',
      type: 'template',
      template: { name: 'hello_world', language: { code: 'en_US' } },
    });
    expect(r).toMatchObject({ ok: true, id: 'wamid.hello', respaldo: 'hello_world', codigo: 132001 });
    expect(r.error).toMatch(/132001/);
  });

  it('sin respaldo con WHATSAPP_HELLO_WORLD_FALLBACK=false o con errores que no son de plantilla', async () => {
    replies.push(metaError(404, 132001));
    expect(await new WhatsAppService({ ...ENV, WHATSAPP_HELLO_WORLD_FALLBACK: 'false' }).sendTemplate('a', 'b')).toMatchObject({ ok: false, codigo: 132001 });
    expect(calls).toHaveLength(1);
    calls.length = 0;
    replies.push(metaError(401, 190));
    const r = await new WhatsAppService(ENV).sendTemplate('a', 'b');
    expect(calls).toHaveLength(1);
    expect(r.error).toMatch(/token venció/);
  });

  it('proveedor heredado (twilio/ultramsg): no configurado y sin llamadas; whatsapp-business se acepta', async () => {
    for (const provider of ['twilio', 'ultramsg']) {
      const svc = new WhatsAppService({ ...ENV, WHATSAPP_PROVIDER: provider });
      expect(svc.isConfigured()).toBe(false);
      expect(svc.getStatus()).toMatchObject({ proveedor: null, configurado: false, proveedorNoSoportado: true, faltan: ['WHATSAPP_PROVIDER'] });
      expect(await svc.sendTemplate('a', 'b')).toMatchObject({ ok: false, configurado: false });
    }
    expect(calls).toHaveLength(0);
    expect(new WhatsAppService({ ...ENV, WHATSAPP_PROVIDER: 'whatsapp-business' }).isConfigured()).toBe(true);
    expect(new WhatsAppService({} as NodeJS.ProcessEnv).getStatus()).toMatchObject({
      proveedor: null,
      configurado: false,
      faltan: ['WHATSAPP_API_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'ADMIN_WHATSAPP_NUMBER'],
    });
  });

  it('estado sin secretos y con el destino enmascarado', () => {
    const status = new WhatsAppService({ ...ENV, WHATSAPP_APP_SECRET: 's', WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'v' }).getStatus();
    expect(status).toEqual({
      proveedor: 'meta',
      configurado: true,
      destino: '+57 *** *** 4567',
      plantilla: 'koptup_aviso',
      webhook: true,
      faltan: [],
      proveedorNoSoportado: false,
    });
    expect(JSON.stringify(status)).not.toContain(TOKEN);
  });

  it('sendTeamMessage y sendOrderNotification pasan por la plantilla', async () => {
    const svc = new WhatsAppService(ENV);
    expect(await svc.sendTeamMessage('Propuesta aceptada', 'línea 1\nlínea 2')).toBe(true);
    expect(calls[0].body.template.components[0].parameters).toEqual([
      { type: 'text', text: 'Propuesta aceptada' },
      { type: 'text', text: 'línea 1 · línea 2' },
    ]);
    expect(
      await svc.sendOrderNotification({ orderId: 'ORD-1', name: 'Web', clientName: 'Ana', clientEmail: 'a@b.co', amount: 10, items: [{ name: 'x', quantity: 2, price: 5 }], hasAttachments: true }),
    ).toBe(true);
    expect(calls[1].body.template.components[0].parameters[0].text).toBe('Nuevo pedido ORD-1');
    expect(calls[1].body.template.components[0].parameters[1].text).toContain('Monto: USD 10.00');
  });

  it('132018 (variables con saltos o espacios): respaldo hello_world y pista de qué revisar', async () => {
    replies.push(metaError(400, 132018), ok('wamid.hello'));
    const r = await new WhatsAppService(ENV).sendTemplate('a', 'b');
    expect(r).toMatchObject({ ok: true, respaldo: 'hello_world', codigo: 132018 });
    expect(r.error).toMatch(/saltos de línea, tabs o más de 4 espacios/);
  });

  it('saneamiento: espacios Unicode (NBSP, finos, separadores) cuentan como espacio; sin «..» al final de cada variable', async () => {
    const nbsp = ' '.repeat(6);
    expect(sanitizeTemplateParam(`a\nb${nbsp}c d     e`, 700)).toBe('a · b c · d e');
    expect(withoutFinalPeriod('Gracias.  ')).toBe('Gracias');
    expect(withoutFinalPeriod('Hola…')).toBe('Hola…');
    await new WhatsAppService(ENV).sendTemplate('Título.', 'Mensaje: Hola, quiero una cotización. Gracias.');
    expect(calls[0].body.template.components[0].parameters).toEqual([
      { type: 'text', text: 'Título' },
      { type: 'text', text: 'Mensaje: Hola, quiero una cotización. Gracias' },
    ]);
  });

  it('proveedor retirado con variables de Meta incompletas: nombra WHATSAPP_PROVIDER y también lo que falta de Meta', () => {
    const status = new WhatsAppService({ WHATSAPP_PROVIDER: 'twilio', ADMIN_WHATSAPP_NUMBER: '+573000000000' } as NodeJS.ProcessEnv).getStatus();
    expect(status).toMatchObject({ proveedorNoSoportado: true, configurado: false, faltan: ['WHATSAPP_PROVIDER', 'WHATSAPP_API_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID'] });
  });

  it('WHATSAPP_GRAPH_URL: en producción solo se acepta localhost (si no, va a graph.facebook.com con el token)', async () => {
    await new WhatsAppService({ ...ENV, NODE_ENV: 'production', WHATSAPP_GRAPH_URL: 'http://evil.example.com' }).sendTemplate('a', 'b');
    expect(calls[0].url).toBe('https://graph.facebook.com/v25.0/109876543210/messages');
    const svc = new WhatsAppService({ ...ENV, NODE_ENV: 'production', WHATSAPP_GRAPH_URL: 'http://127.0.0.1:3998' });
    expect(svc.getGraphUrlOverride()).toEqual({ custom: true, ignored: false });
    await svc.sendTemplate('a', 'b');
    expect(calls[1].url).toBe('http://127.0.0.1:3998/v25.0/109876543210/messages');
  });

  it('firma X-Hub-Signature-256: válida, inválida o ausente', () => {
    const body = Buffer.from('{"entry":[]}');
    const sig = `sha256=${crypto.createHmac('sha256', 'secreto').update(body).digest('hex')}`;
    expect(verifyMetaSignature(body, sig, 'secreto')).toBe(true);
    expect(verifyMetaSignature(body, sig, 'otro')).toBe(false);
    expect(verifyMetaSignature(Buffer.from('{"entry":[1]}'), sig, 'secreto')).toBe(false);
    expect(verifyMetaSignature(body, undefined, 'secreto')).toBe(false);
    expect(verifyMetaSignature(body, 'sha256=zz', 'secreto')).toBe(false);
    expect(verifyMetaSignature(body, sig, '')).toBe(false);
  });
});
