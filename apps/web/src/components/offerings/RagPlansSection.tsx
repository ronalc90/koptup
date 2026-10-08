'use client';

import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';
import RagPlans from '@/components/rag/RagPlans';
import { RAG_PLANS_ANCHOR } from '@/lib/rag-plans';

/**
 * Primera sección de /services (`/services#planes-rag`): encabezado con el H1
 * de la página y la tabla de planes RAG. Debajo va el catálogo "Otras
 * soluciones a medida" (`OfferingsCatalog`).
 */
export default function RagPlansSection() {
  const t = useTranslations('ragPlans');

  return (
    <section id={RAG_PLANS_ANCHOR} className="scroll-mt-16 md:scroll-mt-20">
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-24 sm:pb-28">
          <Badge variant="outline" size="md" className="border-white/30 text-white mb-4">
            {t('badge')}
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{t('title')}</h1>
          <p className="mt-4 text-base sm:text-lg text-white/90 max-w-3xl">{t('subtitle')}</p>
          <p className="mt-3 text-sm font-medium text-white/80">{t('taxNote')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
        <RagPlans />
      </div>
    </section>
  );
}
