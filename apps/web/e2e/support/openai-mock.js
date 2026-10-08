#!/usr/bin/env node
/**
 * Mock local de la API de OpenAI para pruebas (CI y local), sin clave real ni
 * costo. Responde con texto marcado como "simulado" para que nunca se confunda
 * con una respuesta real del modelo.
 *
 * Uso:
 *   node apps/web/e2e/support/openai-mock.js            # 127.0.0.1:3999
 *   OPENAI_MOCK_PORT=4010 node apps/web/e2e/support/openai-mock.js
 * Luego, en el backend o en la web:
 *   OPENAI_BASE_URL=http://127.0.0.1:3999/v1 OPENAI_API_KEY=sk-test-mock
 *   (el SDK oficial de OpenAI lee OPENAI_BASE_URL).
 *
 * Rutas:
 *   POST /v1/chat/completions  texto, stream SSE y response_format
 *                              (json_schema / json_object); las tools se ignoran.
 *                              Si el prompt trae extractos etiquetados ("[1]",
 *                              "[p. 2]", "[fragmento 3]"), la respuesta cita el
 *                              primero, como haría el modelo
 *   POST /v1/embeddings        vectores deterministas de 16 dimensiones
 *                              (float o base64 según encoding_format)
 *   POST /v1/responses         texto
 *   GET  /v1/models            lista fija
 *   GET  /health               estado del mock
 *   GET  /__requests           llamadas recibidas (para comprobar en una
 *                              prueba que la app SÍ llamó al modelo)
 *
 * Variables: OPENAI_MOCK_PORT (o PORT), OPENAI_MOCK_HOST (por defecto
 * 127.0.0.1) y OPENAI_MOCK_LOG (archivo opcional donde se agrega una línea
 * JSON por llamada).
 */
const http = require('http');
const fs = require('fs');

const PORT = Number(process.env.OPENAI_MOCK_PORT || process.env.PORT || 3999);
const HOST = process.env.OPENAI_MOCK_HOST || '127.0.0.1';
const LOG_FILE = process.env.OPENAI_MOCK_LOG || '';
const MAX_KEPT_REQUESTS = 500;

/** @type {Array<{t: string, method: string, url: string, model?: string, stream: boolean}>} */
const received = [];

function record(entry) {
  received.push(entry);
  if (received.length > MAX_KEPT_REQUESTS) received.shift();
  if (LOG_FILE) {
    try {
      fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
    } catch (err) {
      console.error('[openai-mock] no se pudo escribir el log:', err.message);
    }
  }
}

/** Valor de ejemplo que cumple (en lo básico) un JSON Schema. */
function sample(schema, key) {
  if (!schema || typeof schema !== 'object') return 'texto de ejemplo';
  if (schema.enum) return schema.enum[0];
  if (schema.const !== undefined) return schema.const;
  if (schema.anyOf || schema.oneOf) return sample((schema.anyOf || schema.oneOf)[0], key);
  const type = Array.isArray(schema.type) ? schema.type.find((x) => x !== 'null') : schema.type;
  if (type === 'object' || schema.properties) {
    const out = {};
    for (const [k, v] of Object.entries(schema.properties || {})) out[k] = sample(v, k);
    return out;
  }
  if (type === 'array') {
    const n = Math.max(schema.minItems || 1, 1);
    return Array.from({ length: Math.min(n, 3) }, (_, i) => sample(schema.items, `${key}${i}`));
  }
  if (type === 'integer' || type === 'number') return schema.minimum ?? 1;
  if (type === 'boolean') return true;
  return `Ejemplo de ${key || 'texto'} (respuesta simulada)`;
}

function textOf(content) {
  if (typeof content === 'string') return content;
  return (content || []).map((part) => part.text || '').join(' ');
}

function lastUserMessage(messages) {
  const msg = [...(messages || [])].reverse().find((m) => m.role === 'user');
  return msg ? textOf(msg.content) : '';
}

/**
 * Etiqueta del primer extracto que trae el prompt, con el formato que usa el
 * backend: "[1]" (chatbot), "[p. 2]" o "[fragmento 3]" (demo "Prueba con tu
 * documento"). La respuesta simulada la cita, como haría el modelo real, para
 * que las pruebas de citas tengan algo que verificar.
 */
const EXCERPT_LABEL = /\[(?:\d{1,4}|p\.\s*\d{1,4}|fragmento\s+\d{1,4})\]/i;

function chatAnswer(body) {
  const rf = body.response_format;
  if (rf && rf.type === 'json_schema') return JSON.stringify(sample(rf.json_schema && rf.json_schema.schema, 'campo'));
  if (rf && rf.type === 'json_object') return JSON.stringify({ respuesta: 'Respuesta simulada en JSON', ok: true });
  const system = (body.messages || [])
    .filter((m) => m.role === 'system')
    .map((m) => textOf(m.content))
    .join('\n');
  const userText = lastUserMessage(body.messages);
  // El RAG manda "Fragmentos disponibles: … Pregunta del usuario: <pregunta>":
  // la respuesta repite solo la pregunta, no los extractos.
  const asked = /Pregunta del usuario:\s*([\s\S]*)$/.exec(userText);
  const question = (asked ? asked[1] : userText).trim();
  const label = EXCERPT_LABEL.exec(userText) || EXCERPT_LABEL.exec(system);
  const cites = label ? ` ${label[0]}` : '';
  return `Respuesta simulada (mock de OpenAI) a: "${question.slice(0, 200)}".${cites}`;
}

function usage(body, text) {
  const prompt = Math.floor(JSON.stringify(body.messages || body.input || '').length / 4);
  const completion = Math.floor(text.length / 4);
  return { prompt_tokens: prompt, completion_tokens: completion, total_tokens: prompt + completion };
}

/**
 * Vector determinista de 16 dimensiones. Si se pide encoding_format "base64"
 * (lo que hace el SDK oficial por defecto), se devuelve como Float32 en
 * base64, igual que la API real.
 */
function embedding(input, encodingFormat) {
  const s = String(input ?? '');
  const vector = Array.from({ length: 16 }, (_, k) => ((s.charCodeAt(k % Math.max(s.length, 1)) || 0) % 13) / 13);
  if (encodingFormat === 'base64') return Buffer.from(new Float32Array(vector).buffer).toString('base64');
  return vector;
}

const server = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (chunk) => {
    raw += chunk;
  });
  req.on('end', () => {
    let body = {};
    try {
      body = JSON.parse(raw || '{}');
    } catch {
      body = {};
    }
    const url = req.url || '/';
    const json = (code, payload) => {
      res.writeHead(code, { 'content-type': 'application/json' });
      res.end(JSON.stringify(payload));
    };

    if (url === '/health') return json(200, { status: 'ok', mock: 'openai' });
    if (url === '/__requests') return json(200, { count: received.length, requests: received });

    record({ t: new Date().toISOString(), method: req.method, url, model: body.model, stream: !!body.stream });

    if (url.startsWith('/v1/models')) {
      return json(200, {
        object: 'list',
        data: [
          { id: 'gpt-4o-mini', object: 'model' },
          { id: 'gpt-4o', object: 'model' },
        ],
      });
    }

    if (url.startsWith('/v1/embeddings')) {
      const inputs = Array.isArray(body.input) ? body.input : [body.input];
      return json(200, {
        object: 'list',
        model: body.model,
        data: inputs.map((input, index) => ({ object: 'embedding', index, embedding: embedding(input, body.encoding_format) })),
        usage: { prompt_tokens: 10, total_tokens: 10 },
      });
    }

    if (url.startsWith('/v1/responses')) {
      const text = `Respuesta simulada (mock): ${String(typeof body.input === 'string' ? body.input : JSON.stringify(body.input)).slice(0, 120)}`;
      return json(200, {
        id: 'resp_mock',
        object: 'response',
        model: body.model,
        output_text: text,
        output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text }] }],
        usage: { input_tokens: 50, output_tokens: 20, total_tokens: 70 },
      });
    }

    if (url.startsWith('/v1/chat/completions')) {
      const text = chatAnswer(body);
      const id = 'chatcmpl-mock';
      const created = Math.floor(Date.now() / 1000);
      const model = body.model || 'gpt-4o-mini';
      if (body.stream) {
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
        const parts = text.match(/.{1,12}/gs) || [text];
        for (const part of parts) {
          const chunk = { id, object: 'chat.completion.chunk', created, model, choices: [{ index: 0, delta: { content: part }, finish_reason: null }] };
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
        const last = { id, object: 'chat.completion.chunk', created, model, choices: [{ index: 0, delta: {}, finish_reason: 'stop' }], usage: usage(body, text) };
        res.write(`data: ${JSON.stringify(last)}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }
      return json(200, {
        id,
        object: 'chat.completion',
        created,
        model,
        choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }],
        usage: usage(body, text),
      });
    }

    return json(404, { error: { message: `mock: ruta no soportada ${url}` } });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[openai-mock] escuchando en http://${HOST}:${PORT}/v1`);
});

function shutdown() {
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
