'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import { isKnownDemoSlug } from '@/lib/demo-access-defaults';
import { ragPlanContactHref } from '@/lib/rag-plans';

interface DemoCTAProps {
  demoName?: string;
}

/** Demo del producto principal (sistema RAG): su cierre habla del piloto RAG. */
const RAG_DEMO_SLUG = 'chatbot';

/**
 * Cierre de cada demo (lo pinta app/demo/layout.tsx). "Solicitar demo guiada"
 * abre /solicitar-demo con la demo actual ya elegida (?demos=<slug>). En la
 * demo RAG (/demo/chatbot) el texto y "Cotizar el piloto RAG" llevan a
 * /contact con el servicio y el plan piloto ya elegidos.
 */
export default function DemoCTA({ demoName }: DemoCTAProps) {
  const t = useTranslations('demoCTA');
  const pathname = usePathname();
  const slug = pathname?.split('/')[2] ?? '';
  const requestHref = isKnownDemoSlug(slug) ? `/solicitar-demo?demos=${encodeURIComponent(slug)}` : '/solicitar-demo';
  const rag = slug === RAG_DEMO_SLUG;

  return (
    <section className="bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-800 dark:to-primary-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
          {rag ? t('rag.title') : demoName ? t('titleWithName', { demoName }) : t('title')}
        </h3>
        <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
          {rag ? t('rag.description') : t('description')}
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
          <Button size="lg" variant="outline" className="bg-white text-primary-700 border-white hover:bg-primary-50" asChild>
            <Link href={requestHref}>{t('requestGuidedDemo')}</Link>
          </Button>
          <Button size="lg" variant="outline" className="text-white border-white/50 hover:bg-white/10" asChild>
            <Link href={rag ? ragPlanContactHref('piloto') : '/contact'}>{rag ? t('rag.requestQuote') : t('requestQuote')}</Link>
          </Button>
          <Button size="lg" variant="outline" className="text-white border-white/50 hover:bg-white/10" asChild>
            <Link href="/services#planes-rag">{t('viewPricing')}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
