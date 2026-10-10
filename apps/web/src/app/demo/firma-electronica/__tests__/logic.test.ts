/**
 * Reglas de la demo de firma electrónica: hashes, cadena de evidencia,
 * turnos de firma, indicadores, validaciones y CSV.
 */
import esMessages from '../../../../../messages/demos/firma-electronica.es.json';
import enMessages from '../../../../../messages/demos/firma-electronica.en.json';
import { remind, sendEnvelope, senderWhere, signEnvelope, expireIfDue, markViewed } from '../lib/actions';
import { BUILTIN_TEMPLATE_IDS, type BuiltinTemplateId } from '../lib/data';
import { addDays, fmtDate, fmtDateTime, fmtDuration } from '../lib/dates';
import {
  canAct,
  computeMetrics,
  countPdfPages,
  detectVars,
  formatNit,
  isCoMobile,
  isPdf,
  nitDv,
  parseCsv,
  readBulk,
  renderTemplate,
  sampleDate,
  validateStep,
  verifyChain,
  whoIsNext,
} from '../lib/logic';
import { buildSeed, emptyDraft, type TemplateText } from '../lib/seed';
import { hmacSha256Hex, sha256Hex } from '../lib/sha256';
import type { Envelope } from '../lib/types';

const items = esMessages.demoSign.templates.items as Record<BuiltinTemplateId, { body: string; sample: Record<string, string> }>;
const text: TemplateText = { body: (id) => items[id].body, sample: (id) => items[id].sample };
const NOW = '2026-10-10T15:30:00';

describe('SHA-256 y HMAC en JavaScript', () => {
  it('coincide con los vectores de prueba de FIPS 180-4', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe('248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
  });
  it('HMAC-SHA256 coincide con el vector conocido', () => {
    expect(hmacSha256Hex('key', 'The quick brown fox jumps over the lazy dog')).toBe('f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8');
  });
});

describe('datos colombianos', () => {
  it('calcula el dígito de verificación del NIT', () => {
    expect(nitDv('901537284')).toBe(9);
    expect(formatNit('901537284')).toBe('901.537.284-9');
    expect(nitDv('900418263')).toBe(0);
    expect(nitDv('901662471')).toBe(4);
  });
  it('valida celulares colombianos', () => {
    expect(isCoMobile('300 555 0123')).toBe(true);
    expect(isCoMobile('+57 300 555 0123')).toBe(true);
    expect(isCoMobile('6015550123')).toBe(false);
    expect(isCoMobile('30055501')).toBe(false);
  });
  it('formatea fechas sin depender de la zona del navegador', () => {
    expect(fmtDate('2026-10-08T09:05:00', 'es')).toBe('8 oct. 2026');
    expect(fmtDateTime('2026-10-08T15:05:09', 'es', true)).toBe('8 oct. 2026, 3:05:09 p. m.');
    expect(fmtDateTime('2026-10-08T00:05:00', 'en')).toBe('Oct 8, 2026, 12:05 AM');
    expect(fmtDuration(200, 'es')).toBe('3 h 20 min');
    expect(fmtDuration(4320, 'es')).toBe('3 días');
  });
  it('calcula las fechas de ejemplo a partir de hoy', () => {
    expect(sampleDate('nextMonthStart', NOW, 'es')).toBe('1 de noviembre de 2026');
    expect(sampleDate('prevMonthEnd', NOW, 'es')).toBe('30 de septiembre de 2026');
    expect(sampleDate('nextMonthStart', '2026-12-20T10:00:00', 'en')).toBe('January 1, 2027');
  });
});

describe('plantillas', () => {
  it('detecta y reemplaza variables', () => {
    expect(detectVars('Hola {nombre}, tu cargo es {cargo}. {nombre}')).toEqual(['nombre', 'cargo']);
    expect(renderTemplate('Hola {nombre} ({cargo})', { nombre: 'Ana' })).toBe('Hola Ana ([cargo])');
  });
  it('las plantillas de ejemplo usan las mismas variables en español e inglés', () => {
    const en = enMessages.demoSign.templates.items as Record<BuiltinTemplateId, { body: string }>;
    for (const id of BUILTIN_TEMPLATE_IDS) expect(detectVars(en[id].body).sort()).toEqual(detectVars(items[id].body).sort());
  });
});

describe('datos de ejemplo y evidencia', () => {
  const seed = buildSeed(NOW, 'es', text);
  const byId = (id: string) => seed.envelopes.find((e) => e.id === id) as Envelope;

  it('arma 8 sobres con fechas anteriores a hoy y cadenas de hashes válidas', () => {
    expect(seed.envelopes).toHaveLength(8);
    for (const e of seed.envelopes) {
      expect(verifyChain(e.doc.hash, e.events).ok).toBe(true);
      for (const ev of e.events) expect(ev.at <= NOW).toBe(true);
    }
    expect(byId('SOB-0001').status).toBe('completed');
    expect(byId('SOB-0002').status).toBe('partial');
    expect(byId('SOB-0006').status).toBe('expired');
    expect(byId('SOB-0007').status).toBe('draft');
  });

  it('la evidencia es distinta en cada sobre', () => {
    const hashes = new Set(seed.envelopes.filter((e) => e.events.length).map((e) => e.events[0].hash));
    expect(hashes.size).toBe(seed.envelopes.filter((e) => e.events.length).length);
  });

  it('detecta un evento alterado', () => {
    const e = byId('SOB-0001');
    const altered = e.events.map((x, i) => (i === 2 ? { ...x, ip: '198.51.100.99' } : x));
    expect(verifyChain(e.doc.hash, altered)).toEqual({ ok: false, checked: 2, brokenAt: 2 });
  });

  it('respeta el orden secuencial y completa el sobre al firmar todos', () => {
    let e = byId('SOB-0002');
    const [worker, legal] = e.signers;
    expect(canAct(e, worker.id)).toBe(false);
    expect(canAct(e, legal.id)).toBe(true);
    expect(whoIsNext(e).map((s) => s.id)).toEqual([legal.id]);
    e = signEnvelope(e, legal.id, NOW, senderWhere('Chrome · Linux'), { kind: 'type', text: legal.name });
    expect(e.status).toBe('completed');
    expect(e.events.map((x) => x.type).slice(-3)).toEqual(['signed', 'completed', 'sealed']);
    expect(verifyChain(e.doc.hash, e.events).ok).toBe(true);
  });

  it('en paralelo todos pueden firmar y el aprobador no dibuja firma', () => {
    const base = { ...byId('SOB-0007'), mode: 'parallel' as const };
    const sent = sendEnvelope(base, NOW, senderWhere('Chrome · Linux'));
    expect(sent.events.filter((x) => x.type === 'sent')).toHaveLength(2);
    expect(sent.signers.every((s) => canAct(sent, s.id))).toBe(true);
    const approver = sent.signers.find((s) => s.role === 'approver');
    const done = signEnvelope(sent, approver!.id, NOW, senderWhere('x'), { kind: 'approve' });
    expect(done.events[done.events.length - 1].type).toBe('approved');
    expect(done.status).toBe('partial');
  });

  it('los recordatorios y las aperturas quedan en la evidencia', () => {
    let e = byId('SOB-0008');
    e = remind(e, NOW, senderWhere('Chrome · Linux'));
    e = markViewed(e, e.signers[0].id, NOW, senderWhere('Chrome · Linux'));
    expect(e.events.slice(-2).map((x) => x.type)).toEqual(['reminder', 'viewed']);
  });

  it('vence los sobres cuya fecha límite pasó', () => {
    const e = byId('SOB-0003');
    expect(expireIfDue(e, NOW)).toBe(e);
    const expired = expireIfDue(e, addDays(NOW, 30));
    expect(expired.status).toBe('expired');
    expect(expired.events[expired.events.length - 1].at).toBe(e.expiresAt);
  });

  it('los indicadores salen de la lista de sobres', () => {
    const m = computeMetrics(seed.envelopes, NOW);
    expect(m.pending).toBe(3);
    expect(m.drafts).toBe(1);
    expect(m.expired).toBe(1);
    expect(m.completed).toBe(3);
    expect(m.signedMonth).toBe(2);
    expect(m.rate).toBe(75);
    const after = computeMetrics(
      seed.envelopes.map((e) => (e.id === 'SOB-0003' ? expireIfDue(e, addDays(NOW, 30)) : e)),
      NOW,
    );
    expect(after.pending).toBe(2);
    expect(after.rate).toBe(60);
  });
});

describe('validación del asistente', () => {
  it('pide documento, datos válidos, campos de firma y plazos coherentes', () => {
    const d = emptyDraft();
    expect(validateStep(d, 0, []).map((e) => e.key)).toEqual(['docRequired']);
    const withSigners = {
      ...d,
      signers: [
        { id: 's1', name: 'Al', email: 'malo', phone: '', channel: 'whatsapp' as const, role: 'signer' as const, state: 'pending' as const },
        { id: 's2', name: 'Ana Ruiz', email: 'ana@correo.example', phone: '', channel: 'email' as const, role: 'signer' as const, state: 'pending' as const },
      ],
    };
    expect(validateStep(withSigners, 1, []).map((e) => e.key)).toEqual(['nameInvalid', 'emailInvalid', 'phoneInvalid']);
    expect(validateStep(withSigners, 2, []).map((e) => e.key)).toEqual(['signatureMissing', 'signatureMissing']);
    expect(validateStep({ ...d, expiryDays: 5, reminderDays: 5 }, 3, []).map((e) => e.key)).toEqual(['reminderBeforeExpiry']);
    expect(
      validateStep({ ...d, redlines: true, comments: [{ id: 'c', author: 'x', text: 'y', status: 'open' }] }, 3, []).map((e) => e.key),
    ).toEqual(['openComments']);
  });
});

describe('CSV y PDF', () => {
  it('lee CSV con punto y coma, comillas y BOM', () => {
    expect(parseCsv('﻿Nombre;Correo\r\n"Ruiz; Ana";ana@correo.example\r\n\r\n')).toEqual([
      ['Nombre', 'Correo'],
      ['Ruiz; Ana', 'ana@correo.example'],
    ]);
    expect(parseCsv('a,b\n"x ""y""",2')).toEqual([
      ['a', 'b'],
      ['x "y"', '2'],
    ]);
  });
  it('valida las filas del envío masivo', () => {
    const aliases = { name: ['Nombre'], email: ['Correo'], phone: ['Celular'], idNumber: ['Número de documento'] };
    const table = parseCsv('Nombre;Correo;Celular;Numero de documento\nAna Ruiz;ana@correo.example;300 555 0101;123\nBo;malo;123;\nLuis Gil;ana@correo.example;;9');
    const res = readBulk(table, aliases, ['name', 'idNumber'], 50);
    expect(res.missingColumns).toEqual([]);
    expect(res.rows.map((r) => r.errors)).toEqual([[], ['name', 'email', 'phone', 'var:idNumber'], ['duplicate']]);
    expect(res.rows[0].vars).toEqual({ name: 'Ana Ruiz', idNumber: '123' });
    expect(readBulk(parseCsv('Nombre;Otro\nAna;x'), aliases, ['name'], 50).missingColumns).toEqual(['email']);
  });
  it('reconoce un PDF por su firma y cuenta sus páginas', () => {
    const pdf = new TextEncoder().encode('%PDF-1.4\n1 0 obj << /Type /Pages /Count 2 >>\n2 0 obj << /Type /Page >>\n3 0 obj << /Type /Page >>');
    expect(isPdf(pdf)).toBe(true);
    expect(isPdf(new TextEncoder().encode('hola'))).toBe(false);
    expect(countPdfPages(pdf)).toBe(2);
  });
});
