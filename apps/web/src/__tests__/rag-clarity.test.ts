/**
 * Textos y cálculos de claridad del producto RAG:
 *  - el total con IVA y el primer año salen de rag-plans.ts (nunca a mano);
 *  - el "Ejemplo ilustrativo" de cada landing por sector cita un documento
 *    que existe de verdad en la empresa de ejemplo que abre su botón de demo;
 *  - la pregunta "fuera de los documentos" de cada empresa no comparte
 *    palabras con sus documentos (así la búsqueda por palabras responde
 *    «No encontré» de verdad);
 *  - la lista "Fragmentos consultados" marca primero los que la respuesta cita.
 */
import ragPageEs from '../../messages/offerings/_rag-page.es.json';
import ragPageEn from '../../messages/offerings/_rag-page.en.json';
import { RAG_PLANS, getRagPlan, ragFirstYearCop, withRagVat } from '@/lib/rag-plans';
import { RAG_SECTORS, getRagFaqValues, ragSampleDemoPath } from '@/lib/rag-page';
import {
  SAMPLE_COMPANY_KEYS,
  getSampleCompany,
  isSampleCompanyKey,
  type SampleLocale,
} from '@/app/[locale]/demo/chatbot/components/sampleKnowledge';
import { citedIndexes, orderByCited } from '@/app/[locale]/demo/chatbot/components/ChatPanel';

/** Mismo criterio que el backend (services/rag-pipeline.ts › tokenize). */
function tokens(text: string): string[] {
  return (text.toLowerCase().match(/[a-záéíóúñüäöüß0-9]+/gi) ?? []).filter((t) => t.length > 2);
}

describe('precios con IVA y primer año', () => {
  it('suma el IVA general del 19 % al valor en COP', () => {
    expect(withRagVat(getRagPlan('piloto').setup.cop)).toBe(4_641_000);
    expect(withRagVat(getRagPlan('esencial').setup.cop)).toBe(11_781_000);
    expect(withRagVat(getRagPlan('esencial').monthly!.cop)).toBe(1_773_100);
  });

  it('calcula el primer año (implementación + 12 mensualidades) solo para planes con mensualidad fija', () => {
    expect(ragFirstYearCop(getRagPlan('esencial'))).toBe(27_780_000);
    expect(ragFirstYearCop(getRagPlan('profesional'))).toBe(60_780_000);
    expect(ragFirstYearCop(getRagPlan('piloto'))).toBeNull();
    expect(ragFirstYearCop(getRagPlan('empresarial'))).toBeNull();
  });

  it('las preguntas frecuentes reciben esos valores ya formateados', () => {
    const es = getRagFaqValues('es');
    expect(es.pilotPriceVat).toBe('COP 4.641.000');
    expect(es.essentialFirstYear).toBe('COP 27.780.000');
    expect(getRagFaqValues('en').proFirstYear).toBe('COP 60,780,000');
    expect(RAG_PLANS).toHaveLength(4);
  });
});

describe('landings por sector y empresas de ejemplo de la demo', () => {
  const sectorsByLocale: Record<SampleLocale, typeof ragPageEs.ragSectors> = {
    es: ragPageEs.ragSectors,
    en: ragPageEn.ragSectors as typeof ragPageEs.ragSectors,
  };

  it.each(RAG_SECTORS.map((s) => s.id))('%s abre la demo con una empresa que existe', (id) => {
    const sector = RAG_SECTORS.find((s) => s.id === id)!;
    expect(isSampleCompanyKey(sector.demoCompany)).toBe(true);
    expect(ragSampleDemoPath(sector.demoCompany)).toBe(`/demo/chatbot?empresa=${sector.demoCompany}`);
  });

  it.each(
    RAG_SECTORS.flatMap((s) => (['es', 'en'] as const).map((locale) => [s.id, locale] as const)),
  )('el ejemplo ilustrativo de %s (%s) cita un documento real de la demo', (id, locale) => {
    const sector = RAG_SECTORS.find((s) => s.id === id)!;
    const example = sectorsByLocale[locale][id].example;
    const company = getSampleCompany(sector.demoCompany, locale);
    // La pregunta es una de las sugeridas de esa empresa.
    expect(company.questions).toContain(example.question);
    // La fuente es un documento de la empresa y la cita sale de su texto.
    const fileName = example.sourceName.replace(/^\[\d+\]\s*/, '');
    const doc = company.docs.find((d) => d.fileName === fileName);
    expect(doc).toBeDefined();
    const quote = example.sourceQuote.replace(/^[«“]/, '').replace(/[»”]$/, '').replace(/…$/, '');
    expect(doc!.text).toContain(quote);
  });

  it.each(SAMPLE_COMPANY_KEYS.flatMap((k) => (['es', 'en'] as const).map((locale) => [k, locale] as const)))(
    'la pregunta fuera de los documentos de %s (%s) no comparte palabras con ellos',
    (key, locale) => {
      const company = getSampleCompany(key, locale);
      const docTokens = new Set(company.docs.flatMap((d) => tokens(d.text)));
      expect(tokens(company.outOfScope).filter((t) => docTokens.has(t))).toEqual([]);
    },
  );

  it('rechaza empresas desconocidas en ?empresa=', () => {
    expect(isSampleCompanyKey('legal')).toBe(true);
    expect(isSampleCompanyKey('acme')).toBe(false);
    expect(isSampleCompanyKey(null)).toBe(false);
  });
});

describe('fragmentos consultados', () => {
  it('marca como citados los [n] de la respuesta y los pone primero', () => {
    const sources = [1, 2, 3, 4, 5].map((index) => ({ index }));
    const cited = citedIndexes('Son 15 días hábiles [3], por escrito [1].');
    expect([...cited].sort()).toEqual([1, 3]);
    expect(orderByCited(sources, cited).map((m) => [m.source.index, m.cited])).toEqual([
      [1, true],
      [3, true],
      [2, false],
      [4, false],
      [5, false],
    ]);
  });
});
