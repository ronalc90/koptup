/**
 * Chatbot: propiedad por bot (token del propietario), lista filtrada, chat
 * público solo para bots existentes, límites, lista blanca de modelos,
 * ingesta real de PDF/DOCX y bloqueo de URLs internas (SSRF).
 *
 * No necesita MongoDB ni Redis: el estado del chatbot vive en memoria y en
 * un archivo JSON (CHATBOT_STATE_DIR aislado por prueba).
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import type { Express } from 'express';
// jszip viene con mammoth (dependencia del backend).
import JSZip from 'jszip';

const OWNER_HEADER = 'X-Bot-Owner-Token';
const LEGACY_BOT_ID = 'kbot_legacy0000000001';

/** PDF mínimo válido (PDF 1.4, una página) con el texto indicado. */
function makePdf(lines: string[]): Buffer {
  const content = lines.map((l, i) => `BT /F1 12 Tf 72 ${720 - i * 20} Td (${l.replace(/[()\\]/g, '')}) Tj ET`).join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

/** DOCX mínimo válido con el texto indicado. */
async function makeDocx(text: string): Promise<Buffer> {
  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  );
  zip.file(
    '_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  );
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`,
  );
  return zip.generateAsync({ type: 'nodebuffer' });
}

const b64 = (buf: Buffer) => buf.toString('base64');

describe('chatbot: propiedad, límites e ingesta (integración)', () => {
  let app: Express;
  let stateDir: string;
  const prevKey = process.env.OPENAI_API_KEY;

  beforeAll(async () => {
    // Estado previo con un bot creado ANTES del control de propiedad (sin hash).
    stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'koptup-chatbot-it-'));
    process.env.CHATBOT_STATE_DIR = stateDir;
    const now = new Date().toISOString();
    fs.writeFileSync(
      path.join(stateDir, 'state.json'),
      JSON.stringify({
        bots: [[LEGACY_BOT_ID, { botId: LEGACY_BOT_ID, name: 'Bot antiguo', color: '#000000', position: 'br', avatar: '🤖', welcome: 'Hola', systemPrompt: 'x', tone: 'professional', languages: ['es'], createdAt: now, updatedAt: now, docs: [] }]],
        docs: [[LEGACY_BOT_ID, []]],
        chunks: [],
        conversations: [],
        updatedAt: now,
      }),
    );
    // Sin clave de OpenAI: el chat responde en modo extractivo (no gasta).
    delete process.env.OPENAI_API_KEY;
    const { createApp } = await import('../../app');
    app = createApp();
  });

  afterAll(async () => {
    if (prevKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = prevKey;
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  async function createBot(body: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
    const res = await request(app).post('/api/chatbot/bots').set(headers).send({ name: 'Mi bot', ...body });
    expect(res.status).toBe(201);
    expect(typeof res.body.ownerToken).toBe('string');
    expect(res.body.ownerTokenHash).toBeUndefined();
    return res.body as { botId: string; ownerToken: string };
  }

  it('crear devuelve ownerToken y la lista solo muestra bots del propietario', async () => {
    const a = await createBot({ name: 'Bot A' });
    const b = await createBot({ name: 'Bot B' });

    expect((await request(app).get('/api/chatbot/bots')).body).toEqual([]);

    const mine = await request(app).get('/api/chatbot/bots').set(OWNER_HEADER, a.ownerToken);
    expect(mine.body.map((x: { botId: string }) => x.botId)).toEqual([a.botId]);

    const both = await request(app).get('/api/chatbot/bots').set(OWNER_HEADER, `${a.ownerToken},${b.ownerToken}`);
    expect(both.body).toHaveLength(2);
  });

  it('un mismo token puede ser la llave de varios bots del navegador', async () => {
    const first = await createBot({ name: 'Uno' });
    const second = await createBot({ name: 'Dos' }, { [OWNER_HEADER]: first.ownerToken });
    expect(second.ownerToken).toBe(first.ownerToken);
    const list = await request(app).get('/api/chatbot/bots').set(OWNER_HEADER, first.ownerToken);
    expect(list.body.map((x: { name: string }) => x.name).sort()).toEqual(['Dos', 'Uno']);
  });

  it('editar, borrar, subir docs y ver conversaciones exigen el token del dueño', async () => {
    const bot = await createBot();
    const other = await createBot();
    const routes: Array<[string, string, Record<string, unknown>?]> = [
      ['patch', `/api/chatbot/bots/${bot.botId}`, { name: 'x' }],
      ['post', `/api/chatbot/bots/${bot.botId}/docs`, { files: [{ name: 'a.txt', mime: 'text/plain', contentBase64: b64(Buffer.from('hola')) }] }],
      ['post', `/api/chatbot/bots/${bot.botId}/urls`, { urls: ['https://example.com'] }],
      ['get', `/api/chatbot/bots/${bot.botId}/conversations`],
      ['delete', `/api/chatbot/bots/${bot.botId}/conversations`],
      ['delete', `/api/chatbot/bots/${bot.botId}/docs/doc_x`],
      ['delete', `/api/chatbot/bots/${bot.botId}`],
    ];
    for (const [method, url, body] of routes) {
      const anon = await (request(app) as any)[method](url).send(body ?? {});
      expect([method, url, anon.status]).toEqual([method, url, 401]);
      const wrong = await (request(app) as any)[method](url).set(OWNER_HEADER, other.ownerToken).send(body ?? {});
      expect([method, url, wrong.status]).toEqual([method, url, 403]);
    }
    const ok = await request(app).patch(`/api/chatbot/bots/${bot.botId}`).set(OWNER_HEADER, bot.ownerToken).send({ name: 'Renombrado' });
    expect(ok.status).toBe(200);
    expect(ok.body.name).toBe('Renombrado');
  });

  it('crear con el botId de un bot ajeno no lo sobrescribe', async () => {
    const victim = await createBot({ name: 'Víctima' });
    const res = await request(app).post('/api/chatbot/bots').send({ botId: victim.botId, name: 'Pirata' });
    expect(res.status).toBe(401);
    const view = await request(app).get(`/api/chatbot/bots/${victim.botId}`).set(OWNER_HEADER, victim.ownerToken);
    expect(view.body.name).toBe('Víctima');
  });

  it('GET de un bot: vista pública sin prompt ni documentos; completa para el dueño', async () => {
    const bot = await createBot({ systemPrompt: 'Prompt secreto del negocio' });
    const pub = await request(app).get(`/api/chatbot/bots/${bot.botId}`);
    expect(pub.status).toBe(200);
    expect(pub.body.systemPrompt).toBe('');
    expect(pub.body.owned).toBe(false);
    const own = await request(app).get(`/api/chatbot/bots/${bot.botId}`).set(OWNER_HEADER, bot.ownerToken);
    expect(own.body.systemPrompt).toBe('Prompt secreto del negocio');
    expect(own.body.owned).toBe(true);
  });

  it('migración: un bot sin token guardado queda del primer token que lo usa', async () => {
    const claimer = 'a'.repeat(43);
    const first = await request(app).patch(`/api/chatbot/bots/${LEGACY_BOT_ID}`).set(OWNER_HEADER, claimer).send({ name: 'Reclamado' });
    expect(first.status).toBe(200);
    const intruder = await request(app).patch(`/api/chatbot/bots/${LEGACY_BOT_ID}`).set(OWNER_HEADER, 'b'.repeat(43)).send({ name: 'Intruso' });
    expect(intruder.status).toBe(403);
    // Persistido en disco: solo el hash, nunca el token.
    const saved = fs.readFileSync(path.join(stateDir, 'state.json'), 'utf-8');
    expect(saved).not.toContain(claimer);
    expect(saved).toMatch(/ownerTokenHash/);
  });

  it('valida campos de configuración', async () => {
    const res = await request(app).post('/api/chatbot/bots').send({ systemPrompt: 'x'.repeat(4001) });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: 'field_too_long', field: 'systemPrompt' });
    expect((await request(app).post('/api/chatbot/bots').send({ color: 'red; background:url(x)' })).status).toBe(400);
  });

  it('ingesta: PDF y DOCX se parsean de verdad; binarios se rechazan', async () => {
    const bot = await createBot();
    const pdf = makePdf(['La politica de vacaciones otorga 15 dias habiles.']);
    const docx = await makeDocx('El soporte atiende de lunes a viernes de 8 a 6.');
    const res = await request(app)
      .post(`/api/chatbot/bots/${bot.botId}/docs`)
      .set(OWNER_HEADER, bot.ownerToken)
      .send({
        files: [
          { name: 'politica.pdf', mime: 'application/pdf', contentBase64: b64(pdf) },
          { name: 'soporte.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', contentBase64: b64(docx) },
          { name: 'foto.png', mime: 'image/png', contentBase64: b64(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0])) },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.added.map((d: { name: string }) => d.name)).toEqual(['politica.pdf', 'soporte.docx']);
    expect(res.body.errors).toEqual([{ name: 'foto.png', reason: 'unsupported_format' }]);

    const chat = await request(app).post(`/api/chatbot/bots/${bot.botId}/chat`).send({ message: '¿Cuántos días de vacaciones hay?' });
    expect(chat.status).toBe(200);
    expect(chat.body.model).toBe('extractive-bm25');
    expect(chat.body.sources[0].name).toBe('politica.pdf');
    expect(chat.body.sources[0].chunk).toContain('15 dias habiles');

    const chat2 = await request(app).post(`/api/chatbot/bots/${bot.botId}/chat`).send({ message: 'horario de soporte lunes viernes' });
    expect(chat2.body.sources[0].name).toBe('soporte.docx');
  });

  it('ingesta: límites de cantidad y tamaño', async () => {
    const bot = await createBot();
    const six = Array.from({ length: 6 }, (_, i) => ({ name: `${i}.txt`, mime: 'text/plain', contentBase64: b64(Buffer.from('texto')) }));
    expect((await request(app).post(`/api/chatbot/bots/${bot.botId}/docs`).set(OWNER_HEADER, bot.ownerToken).send({ files: six })).status).toBe(400);
    const big = Buffer.alloc(5 * 1024 * 1024 + 10, 0x61);
    const res = await request(app)
      .post(`/api/chatbot/bots/${bot.botId}/docs`)
      .set(OWNER_HEADER, bot.ownerToken)
      .send({ files: [{ name: 'grande.txt', mime: 'text/plain', contentBase64: b64(big) }] });
    expect(res.status).toBe(422);
    expect(res.body.errors).toEqual([{ name: 'grande.txt', reason: 'file_too_large' }]);
  });

  it('URLs: bloquea IPs privadas, loopback, metadatos y puertos no estándar', async () => {
    const bot = await createBot();
    const res = await request(app)
      .post(`/api/chatbot/bots/${bot.botId}/urls`)
      .set(OWNER_HEADER, bot.ownerToken)
      .send({ urls: ['http://127.0.0.1/', 'http://169.254.169.254/latest/meta-data/', 'http://10.1.2.3/', 'http://[::1]/', 'http://localhost:8080/'] });
    expect(res.status).toBe(200);
    expect(res.body.added).toEqual([]);
    expect(res.body.errors.map((e: { reason: string }) => e.reason)).toEqual([
      'blocked_address',
      'blocked_address',
      'blocked_address',
      'blocked_address',
      'blocked_port',
    ]);
    const tooMany = await request(app)
      .post(`/api/chatbot/bots/${bot.botId}/urls`)
      .set(OWNER_HEADER, bot.ownerToken)
      .send({ urls: Array.from({ length: 6 }, (_, i) => `https://example.com/${i}`) });
    expect(tooMany.status).toBe(400);
  });

  it('chat público: 404 para bots que no existen y límites de mensaje e historial', async () => {
    expect((await request(app).post('/api/chatbot/bots/kbot_noexiste/chat').send({ message: 'hola' })).status).toBe(404);
    const bot = await createBot();
    expect((await request(app).post(`/api/chatbot/bots/${bot.botId}/chat`).send({ message: 'x'.repeat(2001) })).status).toBe(400);
    const history = Array.from({ length: 51 }, () => ({ role: 'user', content: 'hola' }));
    expect((await request(app).post(`/api/chatbot/bots/${bot.botId}/chat`).send({ message: 'hola', history })).status).toBe(400);
  });

  it('catálogo de modelos = la lista blanca que ofrece la demo', async () => {
    const models = await request(app).get('/api/chatbot/models');
    expect(models.status).toBe(200);
    expect(models.body.available.map((m: { id: string }) => m.id)).toEqual(['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo']);
  });
});
