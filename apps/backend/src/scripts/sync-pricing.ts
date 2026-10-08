/**
 * Regenera src/data/pricing.data.ts desde los precios públicos de la web.
 *
 *   npm run sync:pricing --workspace=apps/backend
 *   (o: npx ts-node --transpile-only src/scripts/sync-pricing.ts [ruta/a/apps/web])
 *
 * ts-node carga los .ts de la web (rag-plans.ts y services-catalog.ts no
 * importan nada) y los mensajes de messages/offerings.
 */
import fs from 'fs';
import path from 'path';
import { defaultWebRoot, extractPricing, loadWebPricingSources, renderPricingDataModule } from '../data/pricing.extract';

function main(): void {
  const webRoot = process.argv[2] ? path.resolve(process.argv[2]) : defaultWebRoot();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const data = extractPricing(loadWebPricingSources(webRoot, (file) => require(file)));
  const out = path.resolve(__dirname, '../data/pricing.data.ts');
  fs.writeFileSync(out, renderPricingDataModule(data), 'utf8');
  console.log(`Precios sincronizados: ${data.ragPlans.length} planes RAG y ${data.offerings.length} productos → ${path.relative(process.cwd(), out)}`);
}

main();
