/**
 * Demo CMS headless: datos de ejemplo, permisos verificados en la lógica,
 * flujo editorial (borrador → revisión → aprobada → programada/publicada),
 * webhooks, API de entrega, chequeos SEO y asistente del sitio.
 */
import { entryJson, listJson } from '../lib/api';
import { assistantDocs, searchFaqs } from '../lib/assistant';
import { hasUnpublishedChanges } from '../lib/models';
import { blockingIssues, mediaUsage, reducer, type Action } from '../lib/reducer';
import { seoChecks } from '../lib/seo';
import { buildState } from '../lib/seed';
import { slugify, stripHtml, textToHtml, toCsv } from '../lib/text';
import { fromLocalInput, iso, toLocalInput } from '../lib/time';
import type { AppState, Entry, EntryContent } from '../lib/types';

const NOW = Date.UTC(2026, 9, 8, 15, 0); // 8 oct 2026, 10:00 a. m. en Colombia
const now = iso(NOW);

function run(s: AppState, ...actions: Action[]): AppState {
  return actions.reduce(reducer, s);
}
const who = (userId: string): Action => ({ type: 'user.switch', userId });
const WRITER = 'u-valentina';
const EDITOR = 'u-andres';
const ADMIN = 'u-natalia';

function entry(s: AppState, id: string): Entry {
  const e = s.entries.find((x) => x.id === id);
  if (!e) throw new Error(`No existe ${id}`);
  return e;
}

function withField(e: Entry, field: string, value: EntryContent['fields'][string]): EntryContent {
  return { ...e.content, fields: { ...e.content.fields, [field]: value } };
}

describe('CMS · datos de ejemplo', () => {
  it('genera lo mismo para el mismo momento y nada con fecha futura salvo lo programado', () => {
    const a = buildState(NOW);
    expect(JSON.stringify(a)).toBe(JSON.stringify(buildState(NOW)));
    expect(a.entries).toHaveLength(21);
    for (const e of a.entries) {
      expect(Date.parse(e.updatedAt)).toBeLessThanOrEqual(NOW);
      expect(Date.parse(e.createdAt)).toBeLessThanOrEqual(NOW);
      if (e.publishedAt) expect(Date.parse(e.publishedAt)).toBeLessThanOrEqual(NOW);
      if (e.status === 'scheduled') expect(Date.parse(e.scheduledAt ?? '')).toBeGreaterThan(NOW);
      expect(!!e.live).toBe(e.status === 'published');
    }
  });

  it('usa datos ficticios: teléfonos 555 y dominios .example', () => {
    const s = buildState(NOW);
    for (const e of s.entries.filter((x) => x.type === 'location')) expect(String(e.content.fields.whatsapp)).toMatch(/^\+57 300 555 01\d\d$/);
    expect(s.webhooks.every((w) => w.url.includes('.example/'))).toBe(true);
  });
});

describe('CMS · permisos verificados en la lógica (no solo en botones)', () => {
  it('redacción no aprueba, no publica ni cambia modelos', () => {
    const s0 = buildState(NOW);
    const s1 = run(s0, who(WRITER), { type: 'entry.approve', id: 'loc-cabecera', now }, { type: 'entry.publish', id: 'faq-ecografia', now });
    expect(entry(s1, 'loc-cabecera').status).toBe('review');
    expect(entry(s1, 'faq-ecografia').status).toBe('approved');
    const s2 = run(s1, { type: 'model.addField', typeId: 'location', field: { id: 'parqueadero', kind: 'boolean', required: false, localized: false }, now });
    expect(s2).toBe(s1);
  });

  it('redacción edita una publicada como borrador; el sitio sigue con la publicada', () => {
    const s0 = run(buildState(NOW), who(WRITER));
    const e = entry(s0, 'loc-chapinero');
    const s1 = reducer(s0, { type: 'entry.edit', id: e.id, content: withField(e, 'hours', { es: 'Lunes a domingo', en: 'Every day' }), now });
    const after = entry(s1, 'loc-chapinero');
    expect(after.status).toBe('draft');
    expect(hasUnpublishedChanges(after)).toBe(true);
    expect((after.live?.fields.hours as { es: string }).es).toMatch(/^Lunes a viernes/);
    // en revisión ya no puede editar
    const s2 = run(s1, { type: 'entry.submit', id: e.id, now });
    const s3 = reducer(s2, { type: 'entry.edit', id: e.id, content: withField(entry(s2, e.id), 'city', 'Cali'), now });
    expect(entry(s3, e.id).content.fields.city).toBe('Bogotá');
  });

  it('administración agrega un campo que llega a las entradas y a la API', () => {
    const s = run(buildState(NOW), who(ADMIN), { type: 'model.addField', typeId: 'location', field: { id: 'parqueadero', kind: 'boolean', required: false, localized: false, custom: { label: { es: 'Parqueadero', en: 'Parking' } } }, now });
    expect(entry(s, 'loc-usaquen').content.fields.parqueadero).toBe(false);
    const json = entryJson(s, entry(s, 'loc-usaquen'), 'es', true) as { fields: Record<string, unknown> };
    expect(json.fields.parqueadero).toBe(false);
  });
});

describe('CMS · flujo editorial, webhooks y programación', () => {
  it('enviar → aprobar → publicar copia el borrador a la versión publicada y avisa a sitio y app', () => {
    let s = run(buildState(NOW), who(WRITER));
    const e = entry(s, 'loc-chapinero');
    s = run(s, { type: 'entry.edit', id: e.id, content: withField(e, 'address', 'Calle 63 # 9-47'), now }, { type: 'entry.submit', id: e.id, now }, who(EDITOR), { type: 'entry.approve', id: e.id, now }, { type: 'entry.publish', id: e.id, now });
    const p = entry(s, e.id);
    expect(p.status).toBe('published');
    expect(p.live?.fields.address).toBe('Calle 63 # 9-47');
    expect(s.deliveries.map((d) => d.target).sort()).toEqual(['app', 'site']);
    expect(s.deliveries.find((d) => d.target === 'site')?.paths).toEqual(['/sedes/chapinero', '/sedes']);
    expect(p.versions[p.versions.length - 1].reason).toBe('published');
  });

  it('publicar una pregunta frecuente avisa también al asistente', () => {
    const s = run(buildState(NOW), who(EDITOR), { type: 'entry.publish', id: 'faq-ecografia', now });
    expect(s.deliveries.map((d) => d.target).sort()).toEqual(['app', 'assistant', 'site']);
  });

  it('un webhook desactivado no recibe entregas', () => {
    const s = run(buildState(NOW), who(ADMIN), { type: 'webhook.toggle', id: 'app', now }, { type: 'entry.publish', id: 'faq-ecografia', now });
    expect(s.deliveries.some((d) => d.target === 'app')).toBe(false);
  });

  it('la publicación programada sale sola cuando llega la hora, con esa fecha', () => {
    const at = iso(NOW + 60_000);
    let s = run(buildState(NOW), who(EDITOR), { type: 'entry.schedule', id: 'faq-ecografia', at, now });
    expect(entry(s, 'faq-ecografia').status).toBe('scheduled');
    s = reducer(s, { type: 'scheduler.tick', now: iso(NOW + 30_000) });
    expect(entry(s, 'faq-ecografia').status).toBe('scheduled');
    s = reducer(s, { type: 'scheduler.tick', now: iso(NOW + 65_000) });
    const e = entry(s, 'faq-ecografia');
    expect(e.status).toBe('published');
    expect(e.publishedAt).toBe(at);
    expect(s.deliveries.every((d) => d.auto)).toBe(true);
  });

  it('no deja programar en el pasado', () => {
    const s0 = run(buildState(NOW), who(EDITOR));
    const s1 = reducer(s0, { type: 'entry.schedule', id: 'faq-ecografia', at: iso(NOW - 1000), now });
    expect(entry(s1, 'faq-ecografia').status).toBe('approved');
  });

  it('bloquea enviar con campos obligatorios vacíos o slug repetido', () => {
    let s = run(buildState(NOW), who(WRITER), { type: 'entry.create', id: 'e-nueva', entryType: 'location', title: 'Sede Chapinero', slug: 'chapinero', now });
    const e = entry(s, 'e-nueva');
    expect(e.content.slug).toBe('chapinero-2');
    expect(blockingIssues(s, e)).toEqual(expect.arrayContaining(['city', 'address', 'hours', 'whatsapp']));
    s = reducer(s, { type: 'entry.submit', id: 'e-nueva', now });
    expect(entry(s, 'e-nueva').status).toBe('draft');
    s = reducer(s, { type: 'entry.edit', id: 'e-nueva', content: { ...entry(s, 'e-nueva').content, slug: 'usaquen' }, now });
    expect(blockingIssues(s, entry(s, 'e-nueva'))).toContain('slug.taken');
  });

  it('eliminar quita las referencias en otras entradas y avisa si estaba publicada', () => {
    const s = run(buildState(NOW), who(ADMIN), { type: 'entry.delete', id: 'svc-fisioterapia', now });
    expect(s.entries.some((e) => e.id === 'svc-fisioterapia')).toBe(false);
    expect((entry(s, 'loc-usaquen').content.fields.services as string[]).includes('svc-fisioterapia')).toBe(false);
    expect(s.deliveries.every((d) => d.event === 'entry.deleted')).toBe(true);
  });

  it('una imagen en uso no se puede borrar', () => {
    const s0 = run(buildState(NOW), who(ADMIN));
    expect(mediaUsage(s0, 'm-fachada-chapinero').length).toBeGreaterThan(0);
    expect(reducer(s0, { type: 'media.remove', id: 'm-fachada-chapinero', now })).toBe(s0);
  });

  it('restaurar una versión vuelve al contenido guardado', () => {
    let s = run(buildState(NOW), who(EDITOR));
    const e = entry(s, 'svc-laboratorio');
    s = reducer(s, { type: 'entry.edit', id: e.id, content: withField(e, 'priceFrom', 1), now });
    const v = entry(s, e.id).versions[0];
    s = reducer(s, { type: 'entry.restore', id: e.id, versionId: v.id, now });
    expect(entry(s, e.id).content.fields.priceFrom).toBe(35000);
  });
});

describe('CMS · API de entrega', () => {
  it('sin vista previa solo entrega lo publicado', () => {
    const s = buildState(NOW);
    expect(entryJson(s, entry(s, 'faq-ecografia'), 'es', false)).toBeNull();
    expect(entryJson(s, entry(s, 'faq-ecografia'), 'es', true)).not.toBeNull();
    const list = listJson(s, { type: 'location', locale: 'es', preview: false }) as { meta: { total: number } };
    expect(list.meta.total).toBe(5);
  });

  it('marca el respaldo en español cuando falta la traducción', () => {
    const s = buildState(NOW);
    const json = entryJson(s, entry(s, 'loc-alto-prado'), 'en', false) as { localeFallback?: string[]; fields: Record<string, unknown> };
    expect(json.localeFallback).toEqual(['description']);
    expect(json.fields.description).toBe('Sede climatizada con sala de espera para niños.');
  });
});

describe('CMS · chequeos SEO reales', () => {
  it('marca la imagen sin texto alternativo y el título corto', () => {
    const s = buildState(NOW);
    const e = entry(s, 'loc-cabecera');
    const checks = Object.fromEntries(seoChecks(s, e, e.content, 'es').map((c) => [c.id, c]));
    expect(checks.imageAlt.ok).toBe(false);
    expect(checks.imageAlt.value).toBe('bucaramanga-cabecera.jpg');
    expect(checks.titleLength.ok).toBe(false);
    expect(checks.descriptionLength.ok).toBe(false);
  });

  it('detecta un H1 en los bloques y el enlace interno', () => {
    const s = buildState(NOW);
    const e = entry(s, 'page-nosotros');
    const base = Object.fromEntries(seoChecks(s, e, e.content, 'es').map((c) => [c.id, c.ok]));
    expect(base.singleH1).toBe(true);
    expect(base.internalLink).toBe(true);
    const withH1: EntryContent = { ...e.content, blocks: [{ id: 'x', kind: 'heading', level: 1, text: { es: 'Otro', en: '' } }] };
    const after = Object.fromEntries(seoChecks(s, e, withH1, 'es').map((c) => [c.id, c.ok]));
    expect(after.singleH1).toBe(false);
    expect(after.internalLink).toBe(false);
  });
});

describe('CMS · asistente del sitio (momento RAG)', () => {
  it('solo cita preguntas frecuentes publicadas', () => {
    let s = buildState(NOW);
    expect(searchFaqs('¿Cómo me preparo para una ecografía?', assistantDocs(s, 'es'))).toBeNull();
    s = run(s, who(EDITOR), { type: 'entry.publish', id: 'faq-ecografia', now });
    const hit = searchFaqs('¿Cómo me preparo para unas ecografías?', assistantDocs(s, 'es'));
    expect(hit?.doc.id).toBe('faq-ecografia');
    expect(searchFaqs('¿Venden seguros de carro?', assistantDocs(s, 'es'))).toBeNull();
  });
});

describe('CMS · utilidades de texto y fechas', () => {
  it('slug, HTML seguro y CSV sin fórmulas', () => {
    expect(slugify('Sede Ñuñoa — Bogotá')).toBe('sede-nunoa-bogota');
    expect(stripHtml('<p>Hola <strong>mundo</strong></p><ul><li>uno</li></ul>')).toBe('Hola mundo\n• uno');
    expect(textToHtml('<b>x</b>\n\nfin')).toBe('<p>&lt;b&gt;x&lt;/b&gt;</p><p>fin</p>');
    expect(toCsv([['=SUM(A1)', 'a,b']])).toBe('﻿\'=SUM(A1),"a,b"');
  });

  it('las fechas del formulario se leen en hora de Colombia', () => {
    expect(toLocalInput(NOW)).toBe('2026-10-08T10:00');
    expect(fromLocalInput('2026-10-08T10:00')).toBe(NOW);
  });
});
