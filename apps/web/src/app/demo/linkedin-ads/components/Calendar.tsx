'use client';

import { useMemo } from 'react';
import {
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  RectangleStackIcon,
  NewspaperIcon,
} from '@heroicons/react/24/outline';
import {
  ANGULOS_LABELS,
  CALENDARIO_30_DIAS,
  KOPTUP_DEMOS,
  type DiaCalendario,
  type TipoContenido,
} from './data';

interface CalendarProps {
  diaSeleccionado: number | null;
  onSelectDia: (dia: number) => void;
}

const TIPO_ICONS: Record<TipoContenido, typeof PhotoIcon> = {
  texto: DocumentTextIcon,
  imagen: PhotoIcon,
  video: VideoCameraIcon,
  carrusel: RectangleStackIcon,
  articulo: NewspaperIcon,
};

const TIPO_COLORS: Record<TipoContenido, string> = {
  texto:
    'bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-200',
  imagen: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  video: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  carrusel:
    'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  articulo: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
};

/**
 * Grid 30 días con el plan editorial. Cada celda muestra demo + ángulo
 * + tipo de contenido. Click selecciona ese día y dispara el generador
 * con esa configuración pre-cargada.
 */
export default function Calendar({ diaSeleccionado, onSelectDia }: CalendarProps) {
  const demosById = useMemo(() => {
    const map = new Map<string, (typeof KOPTUP_DEMOS)[number]>();
    for (const d of KOPTUP_DEMOS) map.set(d.id, d);
    return map;
  }, []);

  const hoy = new Date();
  const fechaParaDia = (dia: number) => {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + (dia - 1));
    return d;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-secondary-900 dark:text-white">
            Calendario editorial · 30 días
          </h2>
          <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">
            Un demo distinto cada día, mezclando ángulos y formatos. Hacé click en cualquier día para generar el post.
          </p>
        </div>
        <Leyenda />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
        {CALENDARIO_30_DIAS.map((dia) => (
          <CeldaDia
            key={dia.dia}
            dia={dia}
            fecha={fechaParaDia(dia.dia)}
            demoNombre={demosById.get(dia.demoId)?.titulo ?? dia.demoId}
            demoEmoji={demosById.get(dia.demoId)?.emoji ?? '✨'}
            seleccionado={diaSeleccionado === dia.dia}
            onClick={() => onSelectDia(dia.dia)}
          />
        ))}
      </div>
    </div>
  );
}

function CeldaDia({
  dia,
  fecha,
  demoNombre,
  demoEmoji,
  seleccionado,
  onClick,
}: {
  dia: DiaCalendario;
  fecha: Date;
  demoNombre: string;
  demoEmoji: string;
  seleccionado: boolean;
  onClick: () => void;
}) {
  const TipoIcon = TIPO_ICONS[dia.tipoContenido];
  const angulo = ANGULOS_LABELS[dia.angulo];
  const diaSemana = fecha.toLocaleDateString('es-CO', { weekday: 'short' });
  const fechaCorta = fecha.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex h-full flex-col gap-2 rounded-xl border p-3 text-left transition ${
        seleccionado
          ? 'border-primary-500 bg-primary-50 shadow-md ring-2 ring-primary-500/30 dark:border-primary-400 dark:bg-primary-950/50'
          : 'border-secondary-200 bg-white hover:border-primary-300 hover:shadow-md dark:border-secondary-700 dark:bg-secondary-900 dark:hover:border-primary-700'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary-500 dark:text-secondary-400">
            Día {dia.dia} · {diaSemana}
          </p>
          <p className="text-[10px] text-secondary-400 dark:text-secondary-500">
            {fechaCorta}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
            TIPO_COLORS[dia.tipoContenido]
          }`}
        >
          <TipoIcon className="h-3 w-3" />
          {dia.tipoContenido}
        </span>
      </div>

      <div className="flex items-start gap-1.5">
        <span className="text-base leading-none">{demoEmoji}</span>
        <p className="text-xs font-semibold leading-tight text-secondary-900 dark:text-white">
          {demoNombre}
        </p>
      </div>

      <div className="mt-auto">
        <p className="inline-flex items-center gap-1 text-[10px] font-medium text-secondary-600 dark:text-secondary-300">
          <span>{angulo.emoji}</span>
          <span>{angulo.label}</span>
        </p>
        <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-secondary-500 dark:text-secondary-400">
          {dia.notaEstrategica}
        </p>
      </div>
    </button>
  );
}

function Leyenda() {
  const tipos: { tipo: TipoContenido; label: string }[] = [
    { tipo: 'texto', label: 'Texto' },
    { tipo: 'imagen', label: 'Imagen' },
    { tipo: 'carrusel', label: 'Carrusel' },
    { tipo: 'video', label: 'Video' },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tipos.map(({ tipo, label }) => {
        const Icon = TIPO_ICONS[tipo];
        return (
          <span
            key={tipo}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${TIPO_COLORS[tipo]}`}
          >
            <Icon className="h-3 w-3" />
            {label}
          </span>
        );
      })}
    </div>
  );
}
