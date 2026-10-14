#!/usr/bin/env node
/**
 * Mock local de Resend (correo) y de la Graph API de Meta (WhatsApp Cloud API)
 * para pruebas (CI y local): el backend le manda los avisos al dueño y aquí se
 * capturan, sin enviar nunca un correo ni un WhatsApp real y sin claves reales.
 *
 * Uso:
 *   node apps/web/e2e/support/notify-mock.js            # 127.0.0.1:3998
 *   NOTIFY_MOCK_PORT=4011 node apps/web/e2e/support/notify-mock.js
 * Luego, en el backend (valores ficticios, nunca los reales):
 *   RESEND_API_KEY=re_test_mock RESEND_API_URL=http://127.0.0.1:3998
 *   WHATSAPP_API_TOKEN=solo-pruebas WHATSAPP_PHONE_NUMBER_ID=100000000000001
 *   WHATSAPP_GRAPH_URL=http://127.0.0.1:3998
 *   NOTIFY_EMAIL=dueno@e2e.koptup.test ADMIN_WHATSAPP_NUMBER=573000000000
 *
 * Rutas que imitan a los proveedores:
 *   POST /emails                          Resend: exige `Authorization: Bearer …`
 *                                         y `User-Agent` (sin él Resend real
 *                                         responde 403); valida from, to,
 *                                         subject y html/text; responde
 *                                         200 { id } (id "mock-email-<n>").
 *   POST /<versión>/<phone-id>/messages   WhatsApp Cloud API: exige
 *                                         `Authorization: Bearer …`,
 *                                         messaging_product "whatsapp" y `to`;
 *                                         con type "template" valida los
 *                                         parámetros como Meta (sin saltos de
 *                                         línea ni tabs, sin más de 4 espacios
 *                                         seguidos, no vacíos: si no, 400 con
 *                                         el código 132018 de Meta); responde
 *                                         200 { messages: [{ id: "wamid.MOCK…" }] }.
 *
 * Rutas de control (solo para las pruebas):
 *   GET    /health                    estado del mock
 *   GET    /__requests                todo lo capturado; filtros opcionales:
 *                                     ?kind=email|whatsapp y ?q=<texto> (busca
 *                                     en el cuerpo JSON de cada llamada)
 *   DELETE /__requests                borra lo capturado (también
 *                                     POST /__reset). Ojo: con pruebas en
 *                                     paralelo, mejor filtrar con ?q= que
 *                                     borrar.
 *
 * Cada llamada capturada guarda: t, kind, method, url, status (lo que
 * respondió el mock), headers relevantes (si había Bearer, User-Agent,
 * Idempotency-Key; nunca el valor de la clave) y el cuerpo JSON.
 *
 * Variables: NOTIFY_MOCK_PORT (o PORT), NOTIFY_MOCK_HOST (por defecto
 * 127.0.0.1) y NOTIFY_MOCK_LOG (archivo opcional con una línea JSON por
 * llamada).
 */
const http = require('http');
const fs = require('fs');

const PORT = Number(process.env.NOTIFY_MOCK_PORT || process.env.PORT || 3998);
const HOST = process.env.NOTIFY_MOCK_HOST || '127.0.0.1';
const LOG_FILE = process.env.NOTIFY_MOCK_LOG || '';
const MAX_KEPT_REQUESTS = 1000;
const MAX_BODY_BYTES = 1024 * 1024;

/** @type {Array<Record<string, unknown>>} */
let received = [];
let counter = 0;

function record(entry) {
  received.push(entry);
  if (received.length > MAX_KEPT_REQUESTS) received.shift();
  if (LOG_FILE) {
    try {
      fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
    } catch (err) {
      console.error('[notify-mock] no se pudo escribir el log:', err.message);
    }
  }
}

function hasBearer(req) {
  return /^Bearer\s+\S+/.test(String(req.headers.authorization || ''));
}

/** Errores de un parámetro de plantilla según las reglas de Meta (132018). */
function templateParamProblem(text) {
  if (typeof text !== 'string' || text.trim() === '') return 'parámetro vacío';
  if (/[\n\r\t]/.test(text)) return 'el parámetro tiene saltos de línea o tabs';
  if (/ {5,}/.test(text)) return 'el parámetro tiene más de 4 espacios seguidos';
  return null;
}

function validateEmail(body) {
  const to = Array.isArray(body.to) ? body.to : [body.to];
  if (!body.from) return 'Missing `from` field.';
  if (!to.length || to.some((x) => typeof x !== 'string' || !x.includes('@'))) return 'Invalid `to` field.';
  if (!body.subject) return 'Missing `subject` field.';
  if (!body.html && !body.text) return 'Missing `html` or `text` field.';
  return null;
}

function validateWhatsapp(body) {
  if (body.messaging_product !== 'whatsapp') return { code: 100, message: '(#100) messaging_product must be whatsapp' };
  if (!body.to || !/^\d{8,15}$/.test(String(body.to))) return { code: 100, message: '(#100) Invalid parameter: to' };
  if (body.type === 'template') {
    const tpl = body.template || {};
    if (!tpl.name || !tpl.language || !tpl.language.code) return { code: 132000, message: 'Template name or language missing' };
    for (const component of tpl.components || []) {
      for (const param of component.parameters || []) {
        const problem = templateParamProblem(param && param.text);
        if (problem) return { code: 132018, message: `(#132018) There was an issue with the parameters in your template: ${problem}` };
      }
    }
  }
  return null;
}

const server = http.createServer((req, res) => {
  let raw = '';
  let tooBig = false;
  req.on('data', (chunk) => {
    if (raw.length + chunk.length > MAX_BODY_BYTES) {
      tooBig = true;
      return;
    }
    raw += chunk;
  });
  req.on('end', () => {
    const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);
    const json = (code, payload) => {
      res.writeHead(code, { 'content-type': 'application/json' });
      res.end(JSON.stringify(payload));
    };
    if (tooBig) return json(413, { message: 'cuerpo demasiado grande' });

    let body = {};
    try {
      body = JSON.parse(raw || '{}');
    } catch {
      body = { _raw: raw.slice(0, 500) };
    }

    // --- Control ---------------------------------------------------------
    if (url.pathname === '/health') return json(200, { status: 'ok', mock: 'notify', capturadas: received.length });
    if (url.pathname === '/__requests' && req.method === 'GET') {
      const kind = url.searchParams.get('kind');
      const q = url.searchParams.get('q');
      const list = received.filter((r) => (!kind || r.kind === kind) && (!q || JSON.stringify(r.body).includes(q)));
      return json(200, { count: list.length, requests: list });
    }
    if ((url.pathname === '/__requests' && req.method === 'DELETE') || (url.pathname === '/__reset' && req.method === 'POST')) {
      const cleared = received.length;
      received = [];
      return json(200, { cleared });
    }

    const headers = {
      bearer: hasBearer(req),
      userAgent: req.headers['user-agent'] || null,
      idempotencyKey: req.headers['idempotency-key'] || null,
    };
    const base = { t: new Date().toISOString(), method: req.method, url: url.pathname, headers, body };

    // --- Resend: POST /emails ---------------------------------------------
    if (url.pathname === '/emails' && req.method === 'POST') {
      if (!headers.bearer) {
        record({ ...base, kind: 'email', status: 401 });
        return json(401, { statusCode: 401, name: 'missing_api_key', message: 'Missing API key in the authorization header.' });
      }
      if (!headers.userAgent) {
        record({ ...base, kind: 'email', status: 403 });
        return json(403, { statusCode: 403, name: 'missing_user_agent', message: 'Missing `User-Agent` header.' });
      }
      const problem = validateEmail(body);
      if (problem) {
        record({ ...base, kind: 'email', status: 422 });
        return json(422, { statusCode: 422, name: 'validation_error', message: problem });
      }
      counter += 1;
      const id = `mock-email-${counter}`;
      record({ ...base, kind: 'email', status: 200, id });
      return json(200, { id });
    }

    // --- WhatsApp Cloud API: POST /<versión>/<phone-id>/messages ------------
    const wa = /^\/(v\d+(?:\.\d+)?)\/([^/]+)\/messages$/.exec(url.pathname);
    if (wa && req.method === 'POST') {
      if (!headers.bearer) {
        record({ ...base, kind: 'whatsapp', status: 401 });
        return json(401, { error: { message: 'Invalid OAuth access token.', type: 'OAuthException', code: 190, fbtrace_id: 'mock-trace' } });
      }
      const problem = validateWhatsapp(body);
      if (problem) {
        record({ ...base, kind: 'whatsapp', status: 400 });
        return json(400, {
          error: { message: problem.message, type: 'OAuthException', code: problem.code, error_data: { messaging_product: 'whatsapp', details: problem.message }, fbtrace_id: 'mock-trace' },
        });
      }
      counter += 1;
      const id = `wamid.MOCK${String(counter).padStart(6, '0')}`;
      record({ ...base, kind: 'whatsapp', status: 200, id, graphVersion: wa[1], phoneNumberId: wa[2] });
      return json(200, { messaging_product: 'whatsapp', contacts: [{ input: String(body.to), wa_id: String(body.to) }], messages: [{ id }] });
    }

    record({ ...base, kind: 'unknown', status: 404 });
    return json(404, { message: `mock: ruta no soportada ${req.method} ${url.pathname}` });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[notify-mock] escuchando en http://${HOST}:${PORT} (Resend: /emails · WhatsApp: /<versión>/<phone-id>/messages)`);
});

function shutdown() {
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
