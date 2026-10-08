/**
 * La copia de precios del backend (data/pricing.data.ts) debe ser idéntica a
 * los precios públicos de la web (rag-plans.ts, services-catalog.ts y los
 * nombres de messages/offerings). Si esta prueba falla, alguien cambió un
 * precio o un nombre en la web: regenera la copia con
 *
 *   npm run sync:pricing --workspace=apps/backend
 */
import fs from 'fs';
import path from 'path';
import { PRICING_DATA } from '../../data/pricing.data';
import { defaultWebRoot, extractPricing, loadWebPricingSources } from '../../data/pricing.extract';

describe('precios del backend sincronizados con la web', () => {
  const webRoot = defaultWebRoot();

  it('encuentra las fuentes de precios de la web', () => {
    expect(fs.existsSync(path.join(webRoot, 'src', 'lib', 'rag-plans.ts'))).toBe(true);
    expect(fs.existsSync(path.join(webRoot, 'src', 'lib', 'services-catalog.ts'))).toBe(true);
  });

  it('data/pricing.data.ts coincide con la web (si falla: npm run sync:pricing)', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fromWeb = extractPricing(loadWebPricingSources(webRoot, (file) => require(file)));
    expect(PRICING_DATA).toEqual(fromWeb);
  });

  it('tiene los precios publicados de los planes RAG y la TRM de referencia', () => {
    const plan = (id: string) => PRICING_DATA.ragPlans.find((p) => p.id === id)!;
    expect(PRICING_DATA.trmReferencia).toBe(3300);
    expect(plan('piloto').setup).toEqual({ cop: 3_900_000, usd: 1_200 });
    expect(plan('esencial').monthly).toEqual({ cop: 1_490_000, usd: 450 });
    expect(plan('profesional').setup).toEqual({ cop: 24_900_000, usd: 7_490 });
    expect(plan('empresarial').setupIsFrom).toBe(true);
    expect(PRICING_DATA.offerings.length).toBeGreaterThanOrEqual(20);
    for (const o of PRICING_DATA.offerings) expect(o.tiers.map((t) => t.key)).toEqual(['basico', 'profesional', 'avanzado', 'enterprise']);
  });
});
