'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  CalendarDaysIcon,
  SparklesIcon,
  PhotoIcon,
  ArrowRightIcon,
  RocketLaunchIcon,
  Squares2X2Icon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  BeakerIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import Calendar from './components/Calendar';
import PostGenerator from './components/PostGenerator';
import DemoCapture from './components/DemoCapture';
import { ANGULOS, CALENDARIO_30_DIAS, TONOS, type AnguloPost } from './components/data';
import { useCatalogo } from './components/useLinkedinData';

type Tab = 'overview' | 'calendar' | 'generator' | 'capture';

const TABS: { key: Tab; Icon: typeof CalendarDaysIcon }[] = [
  { key: 'overview', Icon: Squares2X2Icon },
  { key: 'calendar', Icon: CalendarDaysIcon },
  { key: 'generator', Icon: SparklesIcon },
  { key: 'capture', Icon: PhotoIcon },
];

export default function LinkedInAdsDemoPage() {
  const t = useTranslations('demoLinkedinAds');
  const demos = useCatalogo();
  const [tab, setTab] = useState<Tab>('overview');
  // Las pestañas visitadas quedan montadas (ocultas) para no perder lo que hiciste en ellas.
  const [visitadas, setVisitadas] = useState<Tab[]>(['overview']);
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);
  const [demoId, setDemoId] = useState<string>(demos[0].id);
  const [angulo, setAngulo] = useState<AnguloPost>('lanzamiento');
  const [imagen, setImagen] = useState<string | null>(null);

  const irA = (destino: Tab) => {
    setTab(destino);
    setVisitadas((v) => (v.includes(destino) ? v : [...v, destino]));
  };

  const handleSelectDia = (dia: number) => {
    const plan = CALENDARIO_30_DIAS.find((d) => d.dia === dia);
    if (!plan) return;
    setDiaSeleccionado(dia);
    setDemoId(plan.demoId);
    setAngulo(plan.angulo);
    irA('generator');
  };

  const planDia = diaSeleccionado ? CALENDARIO_30_DIAS.find((d) => d.dia === diaSeleccionado) ?? null : null;

  const counts = { demos: demos.length, days: CALENDARIO_30_DIAS.length, angles: ANGULOS.length, tones: TONOS.length };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50 pb-20 dark:from-secondary-950 dark:via-black dark:to-primary-950">
      <Hero counts={counts} />

      <div className="relative z-10 mx-auto -mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-secondary-200 bg-white shadow-xl dark:border-secondary-800 dark:bg-secondary-900">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-secondary-200 px-3 py-2 dark:border-secondary-800">
            <nav className="flex min-w-0 flex-wrap items-center gap-1" role="tablist" aria-label="LinkedIn">
              {TABS.map(({ key, Icon }) => {
                const activo = tab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={activo}
                    aria-controls={`linkedin-panel-${key}`}
                    onClick={() => irA(key)}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      activo
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900 dark:text-secondary-300 dark:hover:bg-secondary-800 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t(`tabs.${key}`)}
                  </button>
                );
              })}
            </nav>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                <BeakerIcon className="h-3.5 w-3.5" />
                {t('badges.sampleData')}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary-100 px-2 py-0.5 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-200">
                <InformationCircleIcon className="h-3.5 w-3.5" />
                {t('badges.notPublishing')}
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {visitadas.includes('overview') ? (
              <div id="linkedin-panel-overview" role="tabpanel" hidden={tab !== 'overview'}>
                <Overview counts={counts} onIr={irA} />
              </div>
            ) : null}
            {visitadas.includes('calendar') ? (
              <div id="linkedin-panel-calendar" role="tabpanel" hidden={tab !== 'calendar'}>
                <Calendar demos={demos} diaSeleccionado={diaSeleccionado} onSelectDia={handleSelectDia} />
              </div>
            ) : null}
            {visitadas.includes('generator') ? (
              <div id="linkedin-panel-generator" role="tabpanel" hidden={tab !== 'generator'}>
                <PostGenerator
                  demos={demos}
                  demoId={demoId}
                  onDemoChange={setDemoId}
                  angulo={angulo}
                  onAnguloChange={setAngulo}
                  planDia={planDia}
                  imagen={imagen}
                  onQuitarImagen={() => setImagen(null)}
                />
              </div>
            ) : null}
            {visitadas.includes('capture') ? (
              <div id="linkedin-panel-capture" role="tabpanel" hidden={tab !== 'capture'}>
                <DemoCapture
                  demos={demos}
                  demoId={demoId}
                  onDemoChange={setDemoId}
                  onImageCaptured={setImagen}
                  onIrAlGenerador={() => irA('generator')}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

interface Counts {
  demos: number;
  days: number;
  angles: number;
  tones: number;
}

function Hero({ counts }: { counts: Counts }) {
  const t = useTranslations('demoLinkedinAds.hero');
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-violet-700 px-4 pb-24 pt-16 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(124,58,237,0.4),transparent_50%)]" />
      </div>
      <div className="relative mx-auto max-w-5xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
          <RocketLaunchIcon className="h-3.5 w-3.5" />
          {t('badge')}
        </div>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-5xl">{t('title')}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-primary-50 sm:text-lg">{t('subtitle')}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {[
            t('chips.demos', { count: counts.demos }),
            t('chips.days', { count: counts.days }),
            t('chips.combos', { angles: counts.angles, tones: counts.tones }),
            t('chips.capture'),
          ].map((chip) => (
            <span key={chip} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              {chip}
            </span>
          ))}
        </div>
        <Link
          href="/contact"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary-700 shadow-md transition hover:bg-primary-50"
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4" />
          {t('cta')}
        </Link>
      </div>
    </section>
  );
}

function Overview({ counts, onIr }: { counts: Counts; onIr: (tab: Tab) => void }) {
  const t = useTranslations('demoLinkedinAds.overview');
  const pasos: { key: 'calendar' | 'generator' | 'capture'; Icon: typeof CalendarDaysIcon }[] = [
    { key: 'calendar', Icon: CalendarDaysIcon },
    { key: 'generator', Icon: SparklesIcon },
    { key: 'capture', Icon: PhotoIcon },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard Icon={Squares2X2Icon} label={t('stats.demos')} value={counts.demos} color="from-primary-500 to-primary-700" />
        <StatCard Icon={CalendarDaysIcon} label={t('stats.days')} value={counts.days} color="from-violet-500 to-violet-700" />
        <StatCard Icon={SparklesIcon} label={t('stats.angles')} value={counts.angles} color="from-emerald-500 to-emerald-700" />
        <StatCard Icon={ChatBubbleLeftRightIcon} label={t('stats.tones')} value={counts.tones} color="from-rose-500 to-rose-700" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {pasos.map(({ key, Icon }, i) => (
          <button
            key={key}
            type="button"
            onClick={() => onIr(key)}
            className="group flex h-full flex-col items-start gap-3 rounded-xl border border-secondary-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lg dark:border-secondary-700 dark:bg-secondary-900 dark:hover:border-primary-700"
          >
            <div className="flex w-full items-center justify-between">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-200">
                <Icon className="h-6 w-6" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-secondary-400 dark:text-secondary-500">
                {t('stepLabel', { n: i + 1 })}
              </span>
            </div>
            <h3 className="text-base font-bold text-secondary-900 dark:text-white">{t(`steps.${key}.title`)}</h3>
            <p className="text-sm leading-relaxed text-secondary-600 dark:text-secondary-400">{t(`steps.${key}.desc`)}</p>
            <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primary-600 group-hover:gap-2 dark:text-primary-300">
              {t(`steps.${key}.cta`)}
              <ArrowRightIcon className="h-4 w-4 transition-all" />
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-secondary-200 bg-white p-5 dark:border-secondary-700 dark:bg-secondary-900">
        <h3 className="text-base font-bold text-secondary-900 dark:text-white">{t('howTitle')}</h3>
        <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-secondary-700 dark:text-secondary-300">
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i}>
              <strong>
                {i + 1}. {t(`how.${i}.label`)}
              </strong>{' '}
              {t(`how.${i}.text`)}
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-primary-50 p-5 dark:border-violet-800/40 dark:from-violet-950/40 dark:to-primary-950/40">
        <h3 className="text-base font-bold text-secondary-900 dark:text-white">{t('scopeTitle')}</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div className="rounded-lg bg-white/70 p-4 dark:bg-secondary-900/70">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">{t('doesTitle')}</p>
            <ul className="mt-2 space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="flex items-start gap-2 text-secondary-700 dark:text-secondary-300">
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{t(`does.${i}`)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg bg-white/70 p-4 dark:bg-secondary-900/70">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">{t('doesNotTitle')}</p>
            <ul className="mt-2 space-y-2">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex items-start gap-2 text-secondary-700 dark:text-secondary-300">
                  <NoSymbolIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{t(`doesNot.${i}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  Icon,
  label,
  value,
  color,
}: {
  Icon: typeof Squares2X2Icon;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${color} p-4 text-white shadow-md`}>
      <div className="absolute -right-4 -top-4 opacity-10" aria-hidden="true">
        <Icon className="h-24 w-24" />
      </div>
      <Icon className="h-5 w-5 opacity-80" />
      <p className="mt-2 text-3xl font-extrabold leading-tight">{value}</p>
      <p className="text-xs font-medium opacity-90">{label}</p>
    </div>
  );
}
