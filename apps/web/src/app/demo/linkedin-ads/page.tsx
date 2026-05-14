'use client';

import { useMemo, useState } from 'react';
import {
  CalendarDaysIcon,
  SparklesIcon,
  PhotoIcon,
  ChartBarIcon,
  ArrowRightIcon,
  RocketLaunchIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import Calendar from './components/Calendar';
import PostGenerator from './components/PostGenerator';
import DemoCapture from './components/DemoCapture';
import {
  ANGULOS_LABELS,
  CALENDARIO_30_DIAS,
  KOPTUP_DEMOS,
  type AnguloPost,
} from './components/data';

type Tab = 'overview' | 'calendar' | 'generator' | 'capture';

export default function LinkedInAdsDemoPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);
  const [demoId, setDemoId] = useState<string>(KOPTUP_DEMOS[0].id);
  const [angulo, setAngulo] = useState<AnguloPost>('lanzamiento');
  const [imagenCapturada, setImagenCapturada] = useState<string | null>(null);

  const handleSelectDia = (dia: number) => {
    const planDia = CALENDARIO_30_DIAS.find((d) => d.dia === dia);
    if (!planDia) return;
    setDiaSeleccionado(dia);
    setDemoId(planDia.demoId);
    setAngulo(planDia.angulo);
    setTab('generator');
  };

  const stats = useMemo(() => {
    const tipos = new Map<string, number>();
    for (const d of CALENDARIO_30_DIAS) {
      tipos.set(d.tipoContenido, (tipos.get(d.tipoContenido) ?? 0) + 1);
    }
    return {
      demos: KOPTUP_DEMOS.length,
      dias: CALENDARIO_30_DIAS.length,
      angulos: Object.keys(ANGULOS_LABELS).length,
      tipos,
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50 pb-20 dark:from-secondary-950 dark:via-black dark:to-primary-950">
      <Hero />

      <div className="mx-auto -mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-secondary-200 bg-white shadow-xl dark:border-secondary-800 dark:bg-secondary-900">
          <nav className="flex items-center gap-1 overflow-x-auto border-b border-secondary-200 px-3 py-2 dark:border-secondary-800">
            {(
              [
                { key: 'overview', label: 'Resumen', Icon: Squares2X2Icon },
                { key: 'calendar', label: 'Calendario 30 días', Icon: CalendarDaysIcon },
                { key: 'generator', label: 'Generador de posts', Icon: SparklesIcon },
                { key: 'capture', label: 'Capturas & video', Icon: PhotoIcon },
              ] as { key: Tab; label: string; Icon: typeof CalendarDaysIcon }[]
            ).map(({ key, label, Icon }) => {
              const activo = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    activo
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900 dark:text-secondary-300 dark:hover:bg-secondary-800 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 sm:p-6">
            {tab === 'overview' ? (
              <Overview stats={stats} onGoCalendar={() => setTab('calendar')} onGoGen={() => setTab('generator')} onGoCapture={() => setTab('capture')} />
            ) : null}
            {tab === 'calendar' ? (
              <Calendar diaSeleccionado={diaSeleccionado} onSelectDia={handleSelectDia} />
            ) : null}
            {tab === 'generator' ? (
              <PostGenerator
                demoIdInicial={demoId}
                anguloInicial={angulo}
                imagenCapturada={imagenCapturada}
              />
            ) : null}
            {tab === 'capture' ? (
              <DemoCapture
                demoId={demoId}
                onDemoChange={setDemoId}
                onImageCaptured={(url) => {
                  setImagenCapturada(url);
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-violet-700 px-4 pb-24 pt-16 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(124,58,237,0.4),transparent_50%)]" />
      </div>
      <div className="relative mx-auto max-w-5xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
          <RocketLaunchIcon className="h-3.5 w-3.5" />
          Marketing engine · Koptup
        </div>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-5xl">
          Generador de contenido LinkedIn para mostrar el <span className="text-violet-200">100%</span> de Koptup
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-primary-50 sm:text-lg">
          Plan editorial de 30 días, posts orgánicos + ad copy + carruseles + capturas de pantalla
          reales de cada demo. Pasá de 19 seguidores a una audiencia que entiende qué hace Koptup.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            🎯 {KOPTUP_DEMOS.length} demos catalogadas
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            📅 30 días planificados
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            ✨ 8 ángulos × 5 tonos por post
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            📸 Foto + video del demo real
          </span>
        </div>
      </div>
    </section>
  );
}

function Overview({
  stats,
  onGoCalendar,
  onGoGen,
  onGoCapture,
}: {
  stats: {
    demos: number;
    dias: number;
    angulos: number;
    tipos: Map<string, number>;
  };
  onGoCalendar: () => void;
  onGoGen: () => void;
  onGoCapture: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          Icon={Squares2X2Icon}
          label="Demos en catálogo"
          value={stats.demos}
          color="from-primary-500 to-primary-700"
        />
        <StatCard
          Icon={CalendarDaysIcon}
          label="Días planificados"
          value={stats.dias}
          color="from-violet-500 to-violet-700"
        />
        <StatCard
          Icon={SparklesIcon}
          label="Ángulos disponibles"
          value={stats.angulos}
          color="from-emerald-500 to-emerald-700"
        />
        <StatCard
          Icon={ChartBarIcon}
          label="Variantes por post"
          value="∞"
          color="from-rose-500 to-rose-700"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AccionCard
          step="1"
          titulo="Mirá el plan de 30 días"
          descripcion="Un demo distinto cada día, con ángulo + tipo de contenido recomendado para maximizar variedad y alcance."
          cta="Abrir calendario"
          onClick={onGoCalendar}
          icon={<CalendarDaysIcon className="h-6 w-6" />}
        />
        <AccionCard
          step="2"
          titulo="Generá el post"
          descripcion="Elegí demo, ángulo y tono. Te entregamos hook, cuerpo, CTA, hashtags y vista previa real de LinkedIn."
          cta="Abrir generador"
          onClick={onGoGen}
          icon={<SparklesIcon className="h-6 w-6" />}
        />
        <AccionCard
          step="3"
          titulo="Sumá el visual"
          descripcion="Generá imagen 1200×627 con plantillas o capturá foto/video del demo real con un click."
          cta="Abrir capturas"
          onClick={onGoCapture}
          icon={<PhotoIcon className="h-6 w-6" />}
        />
      </div>

      <div className="rounded-xl border border-secondary-200 bg-white p-5 dark:border-secondary-700 dark:bg-secondary-900">
        <h3 className="text-base font-bold text-secondary-900 dark:text-white">
          🧠 Cómo lo usamos para crecer Koptup en LinkedIn
        </h3>
        <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-secondary-700 dark:text-secondary-300">
          <li>
            <strong>1. Lunes 9:00 AM:</strong> abrís el calendario, ves el demo del día y su ángulo. Si
            no te convence, lo regenerás con otro tono.
          </li>
          <li>
            <strong>2. Generás 3 variantes del mismo post</strong> y elegís la que más te suena.
            Editás los matices personales que solo vos podés aportar.
          </li>
          <li>
            <strong>3. Vas a Capturas:</strong> generás visual 1200×627 con la plantilla o capturás
            el demo real en pantalla (foto + video corto si el formato lo pide).
          </li>
          <li>
            <strong>4. Pegás en LinkedIn:</strong> copiás el texto, subís la imagen/video, agregás
            tags a 3 personas relevantes y publicás.
          </li>
          <li>
            <strong>5. Promocionás solo lo que probaste orgánicamente:</strong> si un post pasa de 100
            impresiones orgánicas, abrís el tab Ad Copy y armás la versión sponsored.
          </li>
        </ol>
      </div>

      <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-primary-50 p-5 dark:border-violet-800/40 dark:from-violet-950/40 dark:to-primary-950/40">
        <h3 className="text-base font-bold text-secondary-900 dark:text-white">
          💡 Objetivos de los 30 días
        </h3>
        <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
          <ObjetivoCard meta="500 seguidores" tactica="3 posts/semana + interacción diaria 15 min" />
          <ObjetivoCard meta="10 leads calificados" tactica="Ads pagados sobre los 3 mejores posts orgánicos del mes" />
          <ObjetivoCard meta="2 reuniones cerradas" tactica="DMs personalizados a interesados que comentaron" />
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
      <div className="absolute -right-4 -top-4 opacity-10">
        <Icon className="h-24 w-24" />
      </div>
      <Icon className="h-5 w-5 opacity-80" />
      <p className="mt-2 text-3xl font-extrabold leading-tight">{value}</p>
      <p className="text-xs font-medium opacity-90">{label}</p>
    </div>
  );
}

function AccionCard({
  step,
  titulo,
  descripcion,
  cta,
  onClick,
  icon,
}: {
  step: string;
  titulo: string;
  descripcion: string;
  cta: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full flex-col items-start gap-3 rounded-xl border border-secondary-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lg dark:border-secondary-700 dark:bg-secondary-900 dark:hover:border-primary-700"
    >
      <div className="flex w-full items-center justify-between">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-200">
          {icon}
        </span>
        <span className="text-xs font-bold uppercase tracking-widest text-secondary-400 dark:text-secondary-500">
          Paso {step}
        </span>
      </div>
      <h4 className="text-base font-bold text-secondary-900 dark:text-white">{titulo}</h4>
      <p className="text-sm leading-relaxed text-secondary-600 dark:text-secondary-400">
        {descripcion}
      </p>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primary-600 group-hover:gap-2 dark:text-primary-300">
        {cta}
        <ArrowRightIcon className="h-4 w-4 transition-all" />
      </span>
    </button>
  );
}

function ObjetivoCard({ meta, tactica }: { meta: string; tactica: string }) {
  return (
    <div className="rounded-lg bg-white/70 p-3 backdrop-blur dark:bg-secondary-900/70">
      <p className="text-lg font-bold text-secondary-900 dark:text-white">{meta}</p>
      <p className="mt-1 text-xs leading-relaxed text-secondary-600 dark:text-secondary-300">
        {tactica}
      </p>
    </div>
  );
}
