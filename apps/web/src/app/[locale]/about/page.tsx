'use client';

import { Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import DemoAccessBadge from '@/components/demo/DemoAccessBadge';
import { DEMO_COUNT } from '@/lib/demos';
import { RAG_PLANS, RAG_PLANS_PATH, formatRagCOP, getRagPlan } from '@/lib/rag-plans';
import { RAG_UPLOAD_DEMO_PATH } from '@/lib/rag-page';
import { demoSlugFromPath, gatedInfo, useDemoCatalog } from '@/lib/use-demo-catalog';
import {
  RocketLaunchIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  CodeBracketIcon,
  SparklesIcon,
  CheckCircleIcon,
  CpuChipIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  WrenchScrewdriverIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  TruckIcon,
  HeartIcon,
  BuildingOffice2Icon,
  CommandLineIcon,
  UsersIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

/**
 * /about — Nosotros.
 *
 * Solo afirmaciones que se pueden comprobar en el propio sitio (número de
 * demos, planes y precios publicados, la demo RAG) o que se formulan como
 * servicio a construir. Sin años de experiencia, año de fundación, cifras de
 * clientes ni casos sin respaldo: el dueño debe aportarlos para publicarlos.
 * Textos en `messages/{es,en}.json` › `aboutPage`.
 */

type TechItem = { name: string; note: string };

const PILOT = getRagPlan('piloto');

/** Tarjetas de "Lo que puedes comprobar hoy": cada una enlaza a donde se verifica. */
const FACTS = [
  { key: 'demos', href: '/demo', gradient: 'from-primary-500 to-primary-700' },
  { key: 'prices', href: '/services', gradient: 'from-secondary-500 to-secondary-800' },
  { key: 'pilot', href: RAG_PLANS_PATH, gradient: 'from-emerald-500 to-emerald-700' },
  { key: 'ragDemo', href: RAG_UPLOAD_DEMO_PATH, gradient: 'from-amber-500 to-orange-700' },
  { key: 'base', href: '/contact', gradient: 'from-fuchsia-500 to-rose-700' },
] as const;

/** Lo que se puede probar hoy con IA real en las demos. */
const AI_TRY = [
  { key: 'rag', href: RAG_UPLOAD_DEMO_PATH },
  { key: 'builder', href: '/demo/chatbot?mode=builder' },
  { key: 'content', href: '/demo/linkedin-ads' },
] as const;

/** Sectores con una demo que lo muestra (datos de ejemplo). */
const SECTORS = [
  { key: 'health', icon: HeartIcon, href: '/demo/telemedicina' },
  { key: 'legal', icon: DocumentTextIcon, href: '/demo/firma-electronica' },
  { key: 'commerce', icon: ShoppingBagIcon, href: '/demo/ecommerce' },
  { key: 'logistics', icon: TruckIcon, href: '/demo/wms-logistica' },
  { key: 'education', icon: AcademicCapIcon, href: '/demo/lms' },
  { key: 'sales', icon: BriefcaseIcon, href: '/demo/crm-ia' },
  { key: 'finance', icon: CreditCardIcon, href: '/demo/facturacion-electronica' },
  { key: 'operations', icon: BuildingOffice2Icon, href: '/demo/erp' },
  { key: 'support', icon: ChatBubbleLeftRightIcon, href: '/demo/helpdesk-ia' },
] as const;

const FOUNDER_STACK = ['Next.js', 'Node.js', 'TypeScript', 'MongoDB', 'OpenAI'];

function asTechItems(value: unknown): TechItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((i): i is TechItem => !!i && typeof i.name === 'string' && typeof i.note === 'string');
}

function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

export default function AboutPage() {
  const t = useTranslations('aboutPage');
  const locale = useLocale();
  const catalog = useDemoCatalog();
  const pilotWeeks = PILOT.weeks.max;
  const pilotPrice = formatRagCOP(PILOT.setup.cop, locale);
  const strong = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

  const heroStats = [
    { value: String(DEMO_COUNT), label: t('hero.stats.demos') },
    { value: String(RAG_PLANS.length), label: t('hero.stats.plans') },
    { value: t('hero.stats.pilotValue', { weeks: pilotWeeks }), label: t('hero.stats.pilot') },
    { value: t('hero.stats.baseValue'), label: t('hero.stats.base') },
  ];

  const factValue = (key: (typeof FACTS)[number]['key']) =>
    key === 'demos' ? String(DEMO_COUNT) : key === 'pilot' ? t('facts.pilot.value', { weeks: pilotWeeks }) : t(`facts.${key}.value`);

  const techCategories = [
    { id: 'site', icon: CodeBracketIcon, items: asTechItems(t.raw('tech.site.items')) },
    { id: 'project', icon: WrenchScrewdriverIcon, items: asTechItems(t.raw('tech.project.items')) },
  ] as const;

  const methodSteps = (t.raw('method.steps') as Array<{ title: string; description: string }>) ?? [];
  const tooling = (t.raw('tooling.groups') as Array<{ label: string; items: string[] }>) ?? [];

  return (
    <>
      {/* Hero con foto de fondo */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&h=1080&fit=crop&q=80&auto=format')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/95 via-primary-800/90 to-secondary-950/95" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-white w-full">
          <div className="max-w-4xl">
            <Badge variant="outline" size="lg" className="mb-6 border-white/40 text-white">
              {t('badge')}
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">{t('hero.title')}</h1>
            <p className="text-2xl md:text-3xl mb-8 max-w-3xl text-primary-50">
              {t('hero.subtitle', { demoCount: DEMO_COUNT })}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="outline" className="bg-white text-primary-700 hover:bg-primary-50" asChild>
                <Link href="/demo">{t('hero.ctaDemos', { demoCount: DEMO_COUNT })}</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10" asChild>
                <Link href="/contact">{t('hero.ctaContact')}</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            {heroStats.map((s) => (
              <div key={s.label} className="text-center md:text-left">
                <div className="text-4xl md:text-5xl font-bold mb-2">{s.value}</div>
                <div className="text-sm md:text-base text-primary-100">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Datos verificables */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <ChartBarIcon className="h-14 w-14 mx-auto text-primary-600 dark:text-primary-400 mb-3" />
            <Badge variant="primary" size="md" className="mb-4">
              {t('facts.badge')}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">{t('facts.title')}</h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">{t('facts.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {FACTS.map((m) => (
              <Link
                key={m.key}
                href={m.href}
                className={`group relative overflow-hidden rounded-3xl p-8 text-white bg-gradient-to-br ${m.gradient} shadow-xl hover:scale-[1.02] transition-transform flex flex-col`}
              >
                <div className="text-5xl md:text-6xl font-extrabold mb-3 leading-none">{factValue(m.key)}</div>
                <div className="text-lg font-bold mb-2">{t(`facts.${m.key}.label`)}</div>
                <div className="text-sm text-white/85 mb-4">
                  {m.key === 'pilot' ? t('facts.pilot.sub', { price: pilotPrice }) : t(`facts.${m.key}.sub`)}
                </div>
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold underline decoration-white/50 underline-offset-4 group-hover:decoration-white">
                  {t(`facts.${m.key}.cta`)}
                  <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                <SparklesIcon className="absolute -top-4 -right-4 h-24 w-24 text-white/10" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ¿Quiénes somos? */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="primary" size="md" className="mb-4">
                {t('whoWeAre.badge')}
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-6">{t('whoWeAre.title')}</h2>
              <p className="text-lg text-secondary-700 dark:text-secondary-300 mb-6">{t.rich('whoWeAre.p1', { strong })}</p>
              <p className="text-lg text-secondary-700 dark:text-secondary-300 mb-6">
                {t.rich('whoWeAre.p2', { strong, demoCount: DEMO_COUNT })}
              </p>
              <div className="space-y-3">
                {asStrings(t.raw('whoWeAre.points')).map((point) => (
                  <div key={point} className="flex items-center gap-3">
                    <CheckCircleIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                    <span className="text-secondary-700 dark:text-secondary-300">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary-600 to-secondary-800 flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <SparklesIcon className="h-20 w-20 mx-auto mb-6 opacity-90" />
                  <div className="text-3xl font-bold mb-2">{t('whoWeAre.cardName')}</div>
                  <div className="text-primary-100 mb-6">{t('whoWeAre.cardRole')}</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {FOUNDER_STACK.map((s) => (
                      <span key={s} className="px-3 py-1 bg-white/15 backdrop-blur rounded-full text-sm font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-2 sm:-right-6 w-32 h-32 bg-primary-600 rounded-2xl flex items-center justify-center shadow-xl">
                <RocketLaunchIcon className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <UsersIcon className="h-14 w-14 mx-auto text-primary-600 dark:text-primary-400 mb-3" />
            <Badge variant="primary" size="md" className="mb-4">
              {t('team.badge')}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">{t('team.title')}</h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">{t('team.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {(
              [
                { key: 'founder', initials: 'RC', gradient: 'from-primary-500 to-primary-800' },
                { key: 'collaborators', initials: 'C+', gradient: 'from-emerald-500 to-emerald-800' },
              ] as const
            ).map((member) => (
              <Card key={member.key} variant="bordered" className="hover:shadow-large transition-shadow overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      aria-hidden
                      className={`w-20 h-20 rounded-2xl flex-shrink-0 bg-gradient-to-br ${member.gradient} flex items-center justify-center text-white text-2xl font-extrabold shadow-lg`}
                    >
                      {member.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-secondary-900 dark:text-white leading-tight">
                        {t(`team.${member.key}.name`)}
                      </h3>
                      <div className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-1">
                        {t(`team.${member.key}.role`)}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-secondary-700 dark:text-secondary-300">{t(`team.${member.key}.bio`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tecnologías */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <CodeBracketIcon className="h-14 w-14 mx-auto text-primary-600 dark:text-primary-400 mb-3" />
            <Badge variant="primary" size="md" className="mb-4">
              {t('tech.badge')}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">{t('tech.title')}</h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">{t('tech.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {techCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Card key={cat.id} variant="bordered" className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-1">
                          {t(`tech.${cat.id}.title`)}{' '}
                          <span className="text-sm font-normal text-secondary-500 dark:text-secondary-400">({cat.items.length})</span>
                        </h3>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400">{t(`tech.${cat.id}.description`)}</p>
                      </div>
                    </div>

                    <ul className="flex flex-wrap gap-2">
                      {cat.items.map((item) => (
                        <li
                          key={item.name}
                          title={item.note}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 text-sm font-medium text-secondary-800 dark:text-secondary-200"
                        >
                          {item.name}
                          <span className="sr-only">: {item.note}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* IA: lo que se puede probar y lo que se construye */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <CpuChipIcon className="h-14 w-14 mx-auto text-primary-600 dark:text-primary-400 mb-3" />
            <Badge variant="primary" size="md" className="mb-4">
              {t('ai.badge')}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">{t('ai.title')}</h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">{t('ai.subtitle')}</p>
          </div>

          <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-6">{t('ai.tryTitle')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {AI_TRY.map((item) => {
              const gate = gatedInfo(catalog, demoSlugFromPath(item.href));
              return (
                <Card key={item.key} variant="bordered" className="hover:shadow-medium transition-shadow">
                  <CardContent className="p-6 flex h-full flex-col">
                    <div className="flex items-start gap-3 mb-3">
                      <SparklesIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                      <h4 className="text-lg font-bold text-secondary-900 dark:text-white">{t(`ai.try.${item.key}.title`)}</h4>
                    </div>
                    <p className="text-secondary-700 dark:text-secondary-300 text-sm mb-4">{t(`ai.try.${item.key}.desc`)}</p>
                    <div className="mt-auto flex flex-wrap items-center gap-2">
                      <Link
                        href={item.href}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        {t(`ai.try.${item.key}.cta`)}
                        <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      {gate && <DemoAccessBadge mode={gate.mode} activo={gate.activo} />}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-6">{t('ai.buildTitle')}</h3>
          <Card variant="bordered">
            <CardContent className="p-6">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {asStrings(t.raw('ai.build')).map((item) => (
                  <li key={item} className="flex items-start gap-3 text-secondary-700 dark:text-secondary-300">
                    <CheckCircleIcon className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-secondary-500 dark:text-secondary-400">{t('ai.buildNote')}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Sectores con demo */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="primary" size="md" className="mb-4">
              {t('sectors.badge')}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">{t('sectors.title')}</h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">{t('sectors.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SECTORS.map((v) => {
              const Icon = v.icon;
              const gate = gatedInfo(catalog, demoSlugFromPath(v.href));
              return (
                <Card key={v.key} variant="bordered" className="hover:shadow-medium transition-shadow">
                  <CardContent className="p-6 flex h-full flex-col">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">{t(`sectors.items.${v.key}.title`)}</h3>
                    <p className="text-secondary-700 dark:text-secondary-300 text-sm mb-4">{t(`sectors.items.${v.key}.desc`)}</p>
                    <div className="mt-auto flex flex-wrap items-center gap-2">
                      <Link
                        href={v.href}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        {t('sectors.cta')}
                        <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      {gate && <DemoAccessBadge mode={gate.mode} activo={gate.activo} />}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cómo trabajamos */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <ShieldCheckIcon className="h-14 w-14 mx-auto text-primary-600 dark:text-primary-400 mb-3" />
            <Badge variant="primary" size="md" className="mb-4">
              {t('method.badge')}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">{t('method.title')}</h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">{t('method.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {methodSteps.map((m, i) => (
              <Card key={m.title} variant="bordered" className="hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-3">{String(i + 1).padStart(2, '0')}</div>
                  <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">{m.title}</h3>
                  <p className="text-secondary-700 dark:text-secondary-300 text-sm">{m.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Herramientas de trabajo */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <CommandLineIcon className="h-14 w-14 mx-auto text-primary-600 dark:text-primary-400 mb-3" />
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">{t('tooling.title')}</h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">{t('tooling.subtitle')}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {tooling.map((g) => (
              <Card key={g.label} variant="bordered">
                <CardContent className="p-5">
                  <div className="text-xs uppercase tracking-wide text-secondary-500 dark:text-secondary-400 font-semibold mb-3">
                    {g.label}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {g.items.map((i) => (
                      <Badge key={i} variant="secondary" size="sm">
                        {i}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final con foto/gradiente */}
      <section className="relative py-32 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1920&h=1080&fit=crop&q=80&auto=format')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/95 via-primary-700/95 to-secondary-900/95" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <GlobeAltIcon className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-4xl md:text-6xl font-bold mb-6">{t('cta.title')}</h2>
          <p className="text-xl mb-10 text-white/90">{t('cta.subtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo"
              className="bg-white text-primary-700 px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition shadow-xl"
            >
              {t('cta.ctaDemos', { demoCount: DEMO_COUNT })}
            </Link>
            <Link
              href="/contact"
              className="bg-white/15 border-2 border-white/30 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/25 transition"
            >
              {t('cta.ctaContact')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
