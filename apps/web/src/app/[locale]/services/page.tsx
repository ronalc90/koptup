import OfferingsCatalog from '@/components/offerings/OfferingsCatalog';
import RagPlansSection from '@/components/offerings/RagPlansSection';

/**
 * `/services` — arriba de todo, los planes RAG (`#planes-rag`, adonde apuntan
 * los botones "Ver planes" y la redirección de `/pricing`); debajo, el
 * catálogo "Otras soluciones a medida" con la opción de comprar el software o
 * suscribirse al SaaS mensual.
 */
export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      <RagPlansSection />
      <OfferingsCatalog />
    </div>
  );
}
