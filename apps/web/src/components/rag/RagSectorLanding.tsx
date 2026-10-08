'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import DemoAccessBadge from '@/components/demo/DemoAccessBadge';
import { demoSlugFromPath, gatedInfo, useDemoCatalog } from '@/lib/use-demo-catalog';
import Badge from '@/components/ui/Badge';
import Card, { CardContent } from '@/components/ui/Card';
import {
  ArrowRightIcon,
  HeartIcon,
  InformationCircleIcon,
  LifebuoyIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';
import {
  RAG_DEMO_PATH,
  RAG_PATH,
  RAG_PILOT_CONTACT_PATH,
  getRagFaqValues,
  getRagSector,
  type RagSectorId,
} from '@/lib/rag-page';

/** Ícono de cada sector (también lo usan las tarjetas de /rag). */
export const RAG_SECTOR_ICONS: Record<RagSectorId, typeof HeartIcon> = {
  salud: HeartIcon,
  legal: ScaleIcon,
  soporte: LifebuoyIcon,
};

interface RagCase {
  title: string;
  desc: string;
}

/** Lee `ragSectors.<id>.cases` (lista de { title, desc }). */
export function asRagCases(value: unknown): RagCase[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (c): c is RagCase =>
      !!c && typeof c === 'object' && typeof c.title === 'string' && typeof c.desc === 'string',
  );
}

/**
 * Landing corta de un sector (/rag/salud, /rag/legal, /rag/soporte):
 * H1, 3 casos de uso, enlace a /rag y CTA. La metadata y el JSON-LD los
 * declara el `page.tsx` de cada ruta.
 */
export default function RagSectorLanding({ sectorId }: { sectorId: RagSectorId }) {
  const t = useTranslations('ragSectors');
  const locale = useLocale();
  const sector = getRagSector(sectorId);
  // Modo de acceso real de la demo enlazada (p. ej. «Solo por invitación»).
  const demoGate = gatedInfo(useDemoCatalog(), sector.demo ? demoSlugFromPath(sector.demo.path) : null);
  const Icon = RAG_SECTOR_ICONS[sectorId];
  const cases = asRagCases(t.raw(`${sectorId}.cases`));
  const values = getRagFaqValues(locale);

  return (
    <>
      {/* H1 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-900 dark:via-secondary-950 dark:to-black">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <Badge variant="primary" size="lg" className="mb-6 gap-2">
            <Icon className="h-5 w-5" aria-hidden="true" />
            {t(`${sectorId}.badge`)}
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary-900 dark:text-white mb-6 leading-tight">
            {t(`${sectorId}.title`)}
          </h1>
          <p className="text-xl md:text-2xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
            {t(`${sectorId}.subtitle`)}
          </p>
        </div>
      </section>

      {/* 3 casos de uso */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-12 text-center">
            {t('casesTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cases.map((c, i) => (
              <Card key={c.title} variant="bordered" className="hover:shadow-medium transition-shadow">
                <CardContent className="flex h-full flex-col">
                  <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center mb-4 text-white font-bold text-lg">
                    {i + 1}
                  </div>
                  <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">{c.title}</h3>
                  <p className="text-secondary-600 dark:text-secondary-400">{c.desc}</p>
                  {sector.demo && sector.demo.caseIndex === i ? (
                    <div className="mt-4 flex flex-col items-start gap-2">
                      <Link
                        href={sector.demo.path}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        {t(`${sectorId}.demoLink`)}
                        <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      {demoGate && <DemoAccessBadge mode={demoGate.mode} activo={demoGate.activo} />}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>

          {sector.hasDisclaimer ? (
            <p className="mt-8 flex items-start justify-center gap-2 text-sm text-secondary-500 dark:text-secondary-400 text-center">
              <InformationCircleIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span>{t(`${sectorId}.disclaimer`)}</span>
            </p>
          ) : null}
        </div>
      </section>

      {/* Enlace a /rag */}
      <section className="py-12 md:py-16 bg-secondary-50 dark:bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-secondary-900 dark:to-secondary-950 border border-primary-100 dark:border-secondary-800 p-8 md:p-10 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-secondary-900 dark:text-white mb-3">
              {t('ragLink.title')}
            </h2>
            <p className="text-secondary-600 dark:text-secondary-400 mb-6 max-w-2xl mx-auto">{t('ragLink.desc')}</p>
            <Link
              href={RAG_PATH}
              className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {t('ragLink.cta')}
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">{t('cta.title')}</h2>
          <p className="text-xl text-primary-100 mb-10">{t('cta.subtitle', values)}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50" asChild>
              <Link href={RAG_DEMO_PATH}>{t('cta.demo')}</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10" asChild>
              <Link href={RAG_PILOT_CONTACT_PATH}>{t('cta.pilot')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
