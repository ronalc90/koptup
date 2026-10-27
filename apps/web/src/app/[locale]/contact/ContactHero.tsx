'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';
import { parseContactQuote } from '@/lib/contact-quote';

/**
 * Encabezado de /contact (badge, h1 e introducción). Sin plan RAG elegido dice
 * el texto genérico; con uno, el de la cotización.
 */
export function ContactHeroView({ planLabel }: { planLabel: string | null }) {
  const t = useTranslations('contactPage');
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white">
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${planLabel ? 'py-12 md:py-20' : 'py-20 md:py-32'}`}>
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="outline" size="lg" className="mb-6 border-white/30 text-white">
            {t('badge')}
          </Badge>
          {/* Con un plan RAG elegido, el encabezado habla de ese plan (no del hero genérico). */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {planLabel ? t('hero.quoteTitle', { plan: planLabel }) : t('hero.title')}
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-primary-100">
            {planLabel ? t('hero.quoteSubtitle') : t('hero.subtitle')}
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * Lo único del encabezado que depende de la URL: el plan RAG de la cotización.
 * page.tsx lo envuelve en Suspense y usa ContactHeroView como fallback, así que
 * el h1 genérico sale en el HTML del servidor.
 */
export default function ContactHero() {
  const tRag = useTranslations('ragPlans');
  const searchParams = useSearchParams();
  const quote = parseContactQuote(searchParams);
  const planLabel = quote?.kind === 'rag' && quote.plan ? tRag(`plans.${quote.plan}.name`) : null;
  return <ContactHeroView planLabel={planLabel} />;
}
