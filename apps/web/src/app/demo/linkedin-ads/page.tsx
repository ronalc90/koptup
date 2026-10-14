'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  CalendarDaysIcon,
  SparklesIcon,
  PhotoIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  RocketLaunchIcon,
  Squares2X2Icon,
  CheckCircleIcon,
  NoSymbolIcon,
  BeakerIcon,
  InformationCircleIcon,
  PresentationChartBarIcon,
  CalculatorIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import Calendar from './components/Calendar';
import PostGenerator, { type Progreso } from './components/PostGenerator';
import DemoCapture from './components/DemoCapture';
import { ANGULOS, CALENDARIO_30_DIAS, TONOS, type AnguloPost } from './components/data';
import { useCatalogo } from './components/useLinkedinData';
import { borrarDatosLocales } from './components/util';

type Tab = 'overview' | 'calendar' | 'generator' | 'capture';
type Paso = 'calendar' | 'generator' | 'capture';

const TABS: { key: Tab; Icon: typeof CalendarDaysIcon }[] = [
  { key: 'overview', Icon: Squares2X2Icon },
  { key: 'calendar', Icon: CalendarDaysIcon },
  { key: 'generator', Icon: SparklesIcon },
  { key: 'capture', Icon: PhotoIcon },
];

/** Salidas comerciales: demo guiada con esta demo elegida y cotización de un motor de contenido. */
const REQUEST_DEMO_HREF = '/solicitar-demo?demos=linkedin-ads';
const QUOTE_HREF = '/contact?service=automatizacion-workflows';

const PROGRESO_INICIAL: Record<Paso, boolean> = { calendar: false, generator: false, capture: false };

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
  const [progreso, setProgreso] = useState<Record<Paso, boolean>>(PROGRESO_INICIAL);
  // Cambia al restablecer: vuelve a montar las pestañas sin lo guardado.
  const [reinicio, setReinicio] = useState(0);
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const panelRef = useRef<HTMLDivElement>(null);

  const irA = useCallback((destino: Tab, enfocar = false) => {
    setTab(destino);
    setVisitadas((v) => (v.includes(destino) ? v : [...v, destino]));
    if (enfocar) {
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }, []);

  const marcar = useCallback((paso: Paso) => setProgreso((p) => (p[paso] ? p : { ...p, [paso]: true })), []);

  const handleSelectDia = (dia: number, enfocar = false) => {
    const plan = CALENDARIO_30_DIAS.find((d) => d.dia === dia);
    if (!plan) return;
    setDiaSeleccionado(dia);
    setDemoId(plan.demoId);
    setAngulo(plan.angulo);
    marcar('calendar');
    irA('generator', enfocar);
  };

  const onProgresoGenerador = useCallback((p: Progreso) => marcar(p === 'post' ? 'generator' : 'capture'), [marcar]);

  const usarImagen = useCallback(
    (url: string) => {
      setImagen(url);
      marcar('capture');
    },
    [marcar],
  );

  const restablecer = () => {
    borrarDatosLocales();
    setTab('overview');
    setVisitadas(['overview']);
    setDiaSeleccionado(null);
    setDemoId(demos[0].id);
    setAngulo('lanzamiento');
    setImagen(null);
    setProgreso(PROGRESO_INICIAL);
    setReinicio((n) => n + 1);
  };

  const onTeclaPestanas = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = TABS.findIndex((x) => x.key === tab);
    let j = -1;
    if (e.key === 'ArrowRight') j = (i + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') j = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = TABS.length - 1;
    if (j < 0) return;
    e.preventDefault();
    const destino = TABS[j].key;
    irA(destino);
    tabRefs.current[destino]?.focus();
  };

  const planDia = diaSeleccionado ? CALENDARIO_30_DIAS.find((d) => d.dia === diaSeleccionado) ?? null : null;

  const counts = { demos: demos.length, days: CALENDARIO_30_DIAS.length, angles: ANGULOS.length, tones: TONOS.length };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-secondary-50 via-white to-primary-50 pb-20 dark:from-secondary-950 dark:via-black dark:to-primary-950">
      <Hero counts={counts} onEmpezar={() => handleSelectDia(1, true)} onCalendario={() => irA('calendar', true)} />

      <div ref={panelRef} className="relative z-10 mx-auto -mt-10 max-w-7xl scroll-mt-24 px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-secondary-200 bg-white shadow-xl dark:border-secondary-800 dark:bg-secondary-900">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-secondary-200 px-3 py-2 dark:border-secondary-800">
            <div
              className="flex min-w-0 flex-wrap items-center gap-1"
              role="tablist"
              aria-label={t('tabs.label')}
              onKeyDown={onTeclaPestanas}
            >
              {TABS.map(({ key, Icon }) => {
                const activo = tab === key;
                return (
                  <button
                    key={key}
                    ref={(el) => {
                      tabRefs.current[key] = el;
                    }}
                    id={`linkedin-tab-${key}`}
                    type="button"
                    role="tab"
                    aria-selected={activo}
                    aria-controls={`linkedin-panel-${key}`}
                    tabIndex={activo ? 0 : -1}
                    onClick={() => irA(key)}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      activo
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900 dark:text-secondary-300 dark:hover:bg-secondary-800 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {t(`tabs.${key}`)}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
              <span
                className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                title={t('badges.sampleDataHint')}
              >
                <BeakerIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {t('badges.sampleData')}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary-100 px-2 py-0.5 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-200">
                <InformationCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {t('badges.notPublishing')}
              </span>
              <Restablecer onConfirmar={restablecer} />
            </div>
          </div>

          <div className="p-4 sm:p-6" key={reinicio}>
            {visitadas.includes('overview') ? (
              <div id="linkedin-panel-overview" role="tabpanel" aria-labelledby="linkedin-tab-overview" hidden={tab !== 'overview'}>
                <Overview onIr={(destino) => irA(destino)} progreso={progreso} />
              </div>
            ) : null}
            {visitadas.includes('calendar') ? (
              <div id="linkedin-panel-calendar" role="tabpanel" aria-labelledby="linkedin-tab-calendar" hidden={tab !== 'calendar'}>
                <Calendar demos={demos} diaSeleccionado={diaSeleccionado} onSelectDia={(dia) => handleSelectDia(dia, true)} />
              </div>
            ) : null}
            {visitadas.includes('generator') ? (
              <div id="linkedin-panel-generator" role="tabpanel" aria-labelledby="linkedin-tab-generator" hidden={tab !== 'generator'}>
                <PostGenerator
                  demos={demos}
                  demoId={demoId}
                  onDemoChange={setDemoId}
                  angulo={angulo}
                  onAnguloChange={setAngulo}
                  planDia={planDia}
                  imagen={imagen}
                  onQuitarImagen={() => setImagen(null)}
                  onProgreso={onProgresoGenerador}
                  onIrACapturas={() => irA('capture', true)}
                />
              </div>
            ) : null}
            {visitadas.includes('capture') ? (
              <div id="linkedin-panel-capture" role="tabpanel" aria-labelledby="linkedin-tab-capture" hidden={tab !== 'capture'}>
                <DemoCapture
                  demos={demos}
                  demoId={demoId}
                  onDemoChange={setDemoId}
                  onImageCaptured={usarImagen}
                  onDescarga={() => marcar('capture')}
                  onIrAlGenerador={() => irA('generator', true)}
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

function Hero({ counts, onEmpezar, onCalendario }: { counts: Counts; onEmpezar: () => void; onCalendario: () => void }) {
  const t = useTranslations('demoLinkedinAds.hero');
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-violet-700 px-4 pb-20 pt-6 text-white sm:px-6 lg:px-16">
      <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(124,58,237,0.4),transparent_50%)]" />
      </div>

      {/* Volver al catálogo y salidas comerciales */}
      <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:px-2 lg:px-0">
        <Link
          href="/demo"
          className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-primary-50 hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          {t('back')}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={REQUEST_DEMO_HREF}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/40 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <PresentationChartBarIcon className="h-4 w-4" aria-hidden="true" />
            {t('requestDemo')}
          </Link>
          <Link
            href={QUOTE_HREF}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-primary-700 shadow-sm transition hover:bg-primary-50"
          >
            <CalculatorIcon className="h-4 w-4" aria-hidden="true" />
            {t('quote')}
          </Link>
        </div>
      </div>

      <div className="relative mx-auto mt-8 max-w-5xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
          <RocketLaunchIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {t('badge')}
        </div>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-5xl">{t('title')}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-primary-50 sm:text-lg">{t('subtitle')}</p>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-primary-100">
          <strong className="font-semibold text-white">{t('forWhoLabel')}</strong> {t('forWho')}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {[
            t('chips.demos', { count: counts.demos }),
            t('chips.days', { count: counts.days }),
            t('chips.combos', { angles: counts.angles, tones: counts.tones }),
            t('chips.capture'),
          ].map((chip) => (
            <span key={chip} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
              {chip}
            </span>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onEmpezar}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-primary-700 shadow-md transition hover:bg-primary-50"
          >
            <PlayIcon className="h-4 w-4" aria-hidden="true" />
            {t('start')}
          </button>
          <button
            type="button"
            onClick={onCalendario}
            className="inline-flex items-center gap-2 rounded-full border border-white/50 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
            {t('seeCalendar')}
          </button>
        </div>
      </div>
    </section>
  );
}

function Overview({ onIr, progreso }: { onIr: (tab: Tab) => void; progreso: Record<Paso, boolean> }) {
  const t = useTranslations('demoLinkedinAds.overview');
  const pasos: { key: Paso; Icon: typeof CalendarDaysIcon }[] = [
    { key: 'calendar', Icon: CalendarDaysIcon },
    { key: 'generator', Icon: SparklesIcon },
    { key: 'capture', Icon: PhotoIcon },
  ];
  const hechos = pasos.filter((p) => progreso[p.key]).length;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-secondary-900 dark:text-white">{t('firstStepsTitle')}</h2>
          <p className="mt-1 max-w-3xl text-sm text-secondary-600 dark:text-secondary-400">{t('firstStepsDesc')}</p>
        </div>
        <p className="text-xs font-semibold text-secondary-500 dark:text-secondary-400" data-testid="first-steps-progress">
          {t('progress', { done: hechos, total: pasos.length })}
        </p>
      </div>

      <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {pasos.map(({ key, Icon }, i) => {
          const hecho = progreso[key];
          return (
            <li key={key} className="min-w-0">
              <button
                type="button"
                onClick={() => onIr(key)}
                className={`group flex h-full w-full flex-col items-start gap-3 rounded-xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${
                  hecho
                    ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-700/60 dark:bg-emerald-950/20'
                    : 'border-secondary-200 bg-white hover:border-primary-300 dark:border-secondary-700 dark:bg-secondary-900 dark:hover:border-primary-700'
                }`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-200">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  {hecho ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
                      {t('done')}
                    </span>
                  ) : (
                    <span className="text-xs font-bold uppercase tracking-widest text-secondary-400 dark:text-secondary-500">
                      {t('stepLabel', { n: i + 1 })}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-secondary-900 dark:text-white">{t(`steps.${key}.title`)}</h3>
                <p className="text-sm leading-relaxed text-secondary-600 dark:text-secondary-400">{t(`steps.${key}.desc`)}</p>
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primary-600 group-hover:gap-2 dark:text-primary-300">
                  {t(`steps.${key}.cta`)}
                  <ArrowRightIcon className="h-4 w-4 transition-all" aria-hidden="true" />
                </span>
              </button>
            </li>
          );
        })}
      </ol>

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
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
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
                  <NoSymbolIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden="true" />
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

/** «Restablecer»: borra borradores y preferencias de este navegador, con confirmación en línea. */
function Restablecer({ onConfirmar }: { onConfirmar: () => void }) {
  const t = useTranslations('demoLinkedinAds.reset');
  const [preguntando, setPreguntando] = useState(false);
  const [hecho, setHecho] = useState(false);
  const confirmarRef = useRef<HTMLButtonElement>(null);
  const abrirRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (preguntando) confirmarRef.current?.focus();
  }, [preguntando]);

  useEffect(() => {
    if (!hecho) return;
    const id = setTimeout(() => setHecho(false), 2500);
    return () => clearTimeout(id);
  }, [hecho]);

  const cancelar = () => {
    setPreguntando(false);
    requestAnimationFrame(() => abrirRef.current?.focus());
  };

  if (!preguntando) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <button
          ref={abrirRef}
          type="button"
          onClick={() => setPreguntando(true)}
          className="inline-flex items-center gap-1 rounded-full border border-secondary-300 px-2 py-0.5 text-secondary-700 transition hover:border-primary-400 hover:text-primary-700 dark:border-secondary-600 dark:text-secondary-200"
        >
          <ArrowPathIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {t('button')}
        </button>
        {hecho ? (
          <span role="status" className="text-emerald-700 dark:text-emerald-300">
            {t('done')}
          </span>
        ) : null}
      </span>
    );
  }
  return (
    <span
      role="group"
      aria-label={t('question')}
      className="inline-flex flex-wrap items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          cancelar();
        }
      }}
    >
      <span>{t('question')}</span>
      <button
        ref={confirmarRef}
        type="button"
        onClick={() => {
          onConfirmar();
          setPreguntando(false);
          setHecho(true);
          requestAnimationFrame(() => abrirRef.current?.focus());
        }}
        className="rounded-md bg-amber-600 px-2 py-0.5 text-white hover:bg-amber-700"
      >
        {t('confirm')}
      </button>
      <button type="button" onClick={cancelar} className="rounded-md px-2 py-0.5 hover:underline">
        {t('cancel')}
      </button>
    </span>
  );
}
