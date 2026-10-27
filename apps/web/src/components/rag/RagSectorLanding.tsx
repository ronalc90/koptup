'use client';

import { Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import DemoAccessBadge from '@/components/demo/DemoAccessBadge';
import { demoSlugFromPath, gatedInfo, useDemoCatalog } from '@/lib/use-demo-catalog';
import Badge from '@/components/ui/Badge';
import Card, { CardContent } from '@/components/ui/Card';
import {
  ArrowRightIcon,
  ClipboardDocumentCheckIcon,
  HeartIcon,
  InformationCircleIcon,
  LifebuoyIcon,
  QuestionMarkCircleIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import {
  RAG_PATH,
  RAG_PAGE_PLANS_ANCHOR,
  RAG_PILOT_CONTACT_PATH,
  RAG_UPLOAD_DEMO_PATH,
  demoRequestPath,
  getRagFaqValues,
  getRagSector,
  ragSampleDemoPath,
  type RagSectorId,
} from '@/lib/rag-page';

/** Pasos del piloto (`ragSectors.pilot.steps.<clave>`), en orden. */
const PILOT_STEPS = ['call', 'deliver', 'result'] as const;

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
 * Landing de un sector (/rag/salud, /rag/legal, /rag/soporte), pensada para
 * quien compra:
 *  1. H1 sin jerga, con los dos siguientes pasos a la vista (probar la demo con
 *     la empresa de ejemplo del sector o cotizar el piloto) y el precio del piloto.
 *  2. 3 casos de uso y qué trae la demo del sector.
 *  3. Ejemplo ilustrativo con un documento ficticio de esa misma demo.
 *  4. Tus datos y qué pasa si la respuesta no está en los documentos.
 *  5. (Salud) Otro producto relacionado, en un bloque aparte.
 *  6. Cómo empieza el piloto: qué entregas, cuánto tarda y cuánto cuesta.
 *  7. Enlace a /rag y CTA final.
 * La metadata y el JSON-LD los declara el `page.tsx` de cada ruta.
 */
export default function RagSectorLanding({ sectorId }: { sectorId: RagSectorId }) {
  const t = useTranslations('ragSectors');
  const locale = useLocale();
  const sector = getRagSector(sectorId);
  const values = getRagFaqValues(locale);
  const Icon = RAG_SECTOR_ICONS[sectorId];
  const cases = asRagCases(t.raw(`${sectorId}.cases`));
  const sampleDemoHref = ragSampleDemoPath(sector.demoCompany);

  // Producto relacionado (salud): según el modo de acceso real de su demo, el
  // botón la abre o lleva al formulario para pedirla (con la demo ya elegida).
  const relatedSlug = sector.relatedDemoPath ? demoSlugFromPath(sector.relatedDemoPath) : null;
  const relatedGate = gatedInfo(useDemoCatalog(), relatedSlug);
  const relatedHref = relatedGate && relatedSlug ? demoRequestPath(relatedSlug) : (sector.relatedDemoPath ?? '');
  const relatedCtaKey = !relatedGate ? 'cta' : relatedGate.mode === 'privado' ? 'ctaInvite' : 'ctaRequest';

  return (
    <>
      {/* 1. H1 + siguientes pasos + precio del piloto */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-900 dark:via-secondary-950 dark:to-black">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-center">
          <Badge variant="primary" size="lg" className="mb-6 gap-2">
            <Icon className="h-5 w-5" aria-hidden="true" />
            {t(`${sectorId}.badge`)}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-6 leading-tight">
            {t(`${sectorId}.title`)}
          </h1>
          <p className="text-lg md:text-2xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
            {t(`${sectorId}.subtitle`)}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href={sampleDemoHref}>{t(`${sectorId}.heroDemo`)}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={RAG_PILOT_CONTACT_PATH}>{t('cta.pilot')}</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm font-medium text-secondary-700 dark:text-secondary-300">{t('hero.price', values)}</p>
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
            {t('hero.uploadPrefix')}{' '}
            <Link
              href={RAG_UPLOAD_DEMO_PATH}
              className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline-offset-2 hover:underline"
            >
              {t('hero.uploadLink')}
            </Link>
          </p>
        </div>
      </section>

      {/* 2. Casos de uso y qué trae la demo del sector */}
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

          <div className="mt-8 max-w-3xl mx-auto rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950/40 p-4 text-sm text-secondary-700 dark:text-secondary-300">
            <p>{t(`${sectorId}.demoNote`)}</p>
            <Link
              href={sampleDemoHref}
              className="mt-2 inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {t(`${sectorId}.heroDemo`)}
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Ejemplo ilustrativo con un documento ficticio de la demo */}
      <section className="py-12 md:py-16 bg-secondary-50 dark:bg-black">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <figure className="rounded-2xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 p-6 md:p-8 shadow-soft">
            <figcaption className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400 mb-4">
              {t('example.title')}
            </figcaption>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-secondary-900 dark:text-white">{t('example.questionLabel')}</dt>
                <dd className="mt-1 text-secondary-700 dark:text-secondary-300">{t(`${sectorId}.example.question`)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-secondary-900 dark:text-white">{t('example.answerLabel')}</dt>
                <dd className="mt-1 text-secondary-700 dark:text-secondary-300">{t(`${sectorId}.example.answer`)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-secondary-900 dark:text-white">{t('example.sourceLabel')}</dt>
                <dd className="mt-1 rounded-lg bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800 p-3">
                  <p className="font-semibold text-primary-800 dark:text-primary-200">{t(`${sectorId}.example.sourceName`)}</p>
                  <p className="mt-1 text-primary-800/80 dark:text-primary-200/80">{t(`${sectorId}.example.sourceQuote`)}</p>
                </dd>
              </div>
            </dl>
            <Link
              href={sampleDemoHref}
              className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {t('example.tryIt')}
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </figure>
        </div>
      </section>

      {/* 4. Tus datos y qué pasa si la respuesta no está */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-10 text-center">
            {t('trust.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="bordered" className="h-full">
              <CardContent className="flex h-full flex-col">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950 rounded-lg flex items-center justify-center mb-4">
                  <ShieldCheckIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">{t(`${sectorId}.data.title`)}</h3>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">{t(`${sectorId}.data.desc`)}</p>
                <Link
                  href={`${RAG_PATH}#seguridad`}
                  className="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  {t('trust.dataLink')}
                  <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
            <Card variant="bordered" className="h-full">
              <CardContent>
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950 rounded-lg flex items-center justify-center mb-4">
                  <QuestionMarkCircleIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">{t(`${sectorId}.notFound.title`)}</h3>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">{t(`${sectorId}.notFound.desc`)}</p>
              </CardContent>
            </Card>
          </div>

          {/* 5. Otro producto relacionado (no es el asistente RAG) */}
          {sector.relatedDemoPath ? (
            <div className="mt-8 rounded-2xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-900 p-6 md:p-8">
              <div className="flex items-start gap-4">
                <span className="hidden sm:inline-flex w-12 h-12 flex-shrink-0 items-center justify-center rounded-lg bg-white dark:bg-secondary-800">
                  <ClipboardDocumentCheckIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-secondary-900 dark:text-white">{t(`${sectorId}.related.title`)}</h3>
                  <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">{t(`${sectorId}.related.desc`)}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={relatedHref}>{t(`${sectorId}.related.${relatedCtaKey}`)}</Link>
                    </Button>
                    {relatedGate ? <DemoAccessBadge mode={relatedGate.mode} activo={relatedGate.activo} /> : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* 6. Cómo empieza: el piloto */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-3">{t('pilot.title', values)}</h2>
            <p className="text-lg text-secondary-600 dark:text-secondary-400">{t('pilot.subtitle')}</p>
          </div>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PILOT_STEPS.map((step, i) => (
              <li
                key={step}
                className="rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 p-6 shadow-soft"
              >
                <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="text-base font-bold text-secondary-900 dark:text-white mb-2">
                  {t(`pilot.steps.${step}.title`, values)}
                </h3>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">{t(`pilot.steps.${step}.desc`, values)}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-center text-sm font-medium text-secondary-700 dark:text-secondary-300 max-w-3xl mx-auto">
            {t('pilot.price', values)}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href={RAG_PILOT_CONTACT_PATH}>{t('cta.pilot')}</Link>
            </Button>
            <Link
              href={`${RAG_PATH}#${RAG_PAGE_PLANS_ANCHOR}`}
              className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {t('pilot.plansLink')}
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Enlace a /rag */}
      <section className="py-12 md:py-16 bg-white dark:bg-secondary-950">
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
              <Link href={RAG_UPLOAD_DEMO_PATH}>{t('cta.demo')}</Link>
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
