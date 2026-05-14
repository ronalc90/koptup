import OfferingsCatalog from '@/components/offerings/OfferingsCatalog';

/**
 * `/pricing` — catálogo unificado de OFFERINGS. Comparte componente con
 * `/services`. Mantenemos esta URL para no romper enlaces externos: la
 * misma página, mismo contenido, una sola fuente de verdad.
 */
export default function PricingPage() {
  return <OfferingsCatalog />;
}
