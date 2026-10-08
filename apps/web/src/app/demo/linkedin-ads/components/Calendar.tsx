'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  RectangleStackIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { ANGULOS, CALENDARIO_30_DIAS, type KoptupDemo, type TipoContenido } from './data';
import { urlDemo } from './generador';
import { aCsv, descargarTexto, escribirLS, leerLS, LS_INICIO_CALENDARIO } from './util';

interface CalendarProps {
  demos: KoptupDemo[];
  diaSeleccionado: number | null;
  onSelectDia: (dia: number) => void;
}

const TIPO_ICONS: Record<TipoContenido, typeof PhotoIcon> = {
  texto: DocumentTextIcon,
  imagen: PhotoIcon,
  video: VideoCameraIcon,
  carrusel: RectangleStackIcon,
};

const TIPO_COLORS: Record<TipoContenido, string> = {
  texto: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-200',
  imagen: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  video: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  carrusel: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
};

const DIA_MS = 24 * 60 * 60 * 1000;

/** Próximo lunes (hoy si es lunes) en UTC, como "AAAA-MM-DD". */
function proximoLunes(hoy: Date): string {
  const base = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const dow = new Date(base).getUTCDay(); // 0 = domingo
  const hasta = (8 - dow) % 7;
  return new Date(base + hasta * DIA_MS).toISOString().slice(0, 10);
}

function esLunesIso(v: unknown): v is string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.getUTCDay() === 1;
}

/**
 * Plan editorial de 30 días. Las fechas se calculan en el navegador (después
 * de montar) a partir de un lunes que puedes mover de a una semana; el inicio
 * elegido se recuerda en este navegador.
 */
export default function Calendar({ demos, diaSeleccionado, onSelectDia }: CalendarProps) {
  const t = useTranslations('demoLinkedinAds.calendar');
  const tAng = useTranslations('demoLinkedinAds.angles');
  const locale = useLocale();
  const [inicio, setInicio] = useState<string | null>(null);

  useEffect(() => {
    const guardado = leerLS<unknown>(LS_INICIO_CALENDARIO, null);
    setInicio(esLunesIso(guardado) ? guardado : proximoLunes(new Date()));
  }, []);

  const moverSemana = (semanas: number) => {
    if (!inicio) return;
    const nuevo = new Date(Date.parse(`${inicio}T00:00:00Z`) + semanas * 7 * DIA_MS).toISOString().slice(0, 10);
    setInicio(nuevo);
    escribirLS(LS_INICIO_CALENDARIO, nuevo);
  };

  const demosById = useMemo(() => new Map(demos.map((d) => [d.id, d])), [demos]);
  const emojiAngulo = useMemo(() => new Map(ANGULOS.map((a) => [a.key, a.emoji])), []);

  const fmtCorto = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      }),
    [locale],
  );
  const fmtDiaSemana = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }), [locale]);
  const fmtLargo = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }),
    [locale],
  );

  const fechaDe = (dia: number): Date | null =>
    inicio ? new Date(Date.parse(`${inicio}T00:00:00Z`) + (dia - 1) * DIA_MS) : null;

  const exportarCsv = () => {
    const filas: (string | number)[][] = [
      [t('csv.day'), t('csv.date'), t('csv.demo'), t('csv.angle'), t('csv.type'), t('csv.note'), t('csv.url')],
      ...CALENDARIO_30_DIAS.map((d) => {
        const fecha = fechaDe(d.dia);
        const demo = demosById.get(d.demoId);
        return [
          d.dia,
          fecha ? fecha.toISOString().slice(0, 10) : '',
          demo?.titulo ?? d.demoId,
          tAng(`${d.angulo}.label`),
          t(`types.${d.tipoContenido}`),
          t(`notes.${d.dia}`),
          demo ? urlDemo(demo) : '',
        ];
      }),
    ];
    descargarTexto(aCsv(filas), `koptup-calendario-linkedin-${inicio ?? 'plan'}.csv`, 'text/csv;charset=utf-8');
  };

  const fin = fechaDe(30);
  const primero = fechaDe(1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-secondary-900 dark:text-white">{t('title')}</h2>
          <p className="mt-1 max-w-3xl text-sm text-secondary-600 dark:text-secondary-400">{t('subtitle')}</p>
        </div>
        <Leyenda etiqueta={(tipo) => t(`types.${tipo}`)} />
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-secondary-200 bg-secondary-50 px-3 py-2 text-sm dark:border-secondary-700 dark:bg-secondary-800/60 md:flex-row md:items-center">
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => moverSemana(-1)}
            disabled={!inicio}
            className="inline-flex items-center gap-1 rounded-md border border-secondary-300 bg-white px-2 py-1 text-xs font-semibold text-secondary-700 hover:border-primary-400 disabled:opacity-50 dark:border-secondary-600 dark:bg-secondary-900 dark:text-secondary-200"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
            {t('prevWeek')}
          </button>
          <button
            type="button"
            onClick={() => moverSemana(1)}
            disabled={!inicio}
            className="inline-flex items-center gap-1 rounded-md border border-secondary-300 bg-white px-2 py-1 text-xs font-semibold text-secondary-700 hover:border-primary-400 disabled:opacity-50 dark:border-secondary-600 dark:bg-secondary-900 dark:text-secondary-200"
          >
            {t('nextWeek')}
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
        <p
          className="min-w-0 flex-1 break-words text-xs text-secondary-600 dark:text-secondary-300"
          data-testid="calendar-range"
        >
          {primero && fin ? (
            <>
              <strong className="text-secondary-900 dark:text-white">
                {t('range', {
                  start: fmtLargo.format(primero),
                  end: fmtLargo.format(fin),
                })}
              </strong>{' '}
              · {t('startsMonday')}
            </>
          ) : (
            t('startsMonday')
          )}
        </p>
        <button
          type="button"
          onClick={exportarCsv}
          disabled={!inicio}
          className="inline-flex shrink-0 items-center gap-1 self-start rounded-md bg-primary-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50 md:self-auto"
        >
          <ArrowDownTrayIcon className="h-3.5 w-3.5" />
          {t('exportCsv')}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
        {CALENDARIO_30_DIAS.map((dia) => {
          const demo = demosById.get(dia.demoId);
          const fecha = fechaDe(dia.dia);
          const TipoIcon = TIPO_ICONS[dia.tipoContenido];
          const seleccionado = diaSeleccionado === dia.dia;
          return (
            <button
              key={dia.dia}
              type="button"
              onClick={() => onSelectDia(dia.dia)}
              aria-pressed={seleccionado}
              className={`group relative flex h-full min-w-0 flex-col gap-2 rounded-xl border p-3 text-left transition ${
                seleccionado
                  ? 'border-primary-500 bg-primary-50 shadow-md ring-2 ring-primary-500/30 dark:border-primary-400 dark:bg-primary-950/50'
                  : 'border-secondary-200 bg-white hover:border-primary-300 hover:shadow-md dark:border-secondary-700 dark:bg-secondary-900 dark:hover:border-primary-700'
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary-500 dark:text-secondary-400">
                    {t('dayLabel', { n: dia.dia })}
                    {fecha ? ` · ${fmtDiaSemana.format(fecha)}` : ''}
                  </p>
                  <p className="h-3.5 text-[10px] text-secondary-400 dark:text-secondary-500">
                    {fecha ? fmtCorto.format(fecha) : ''}
                  </p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${TIPO_COLORS[dia.tipoContenido]}`}
                >
                  <TipoIcon className="h-3 w-3" />
                  {t(`types.${dia.tipoContenido}`)}
                </span>
              </div>

              <div className="flex items-start gap-1.5">
                <span className="text-base leading-none">{demo?.emoji ?? '✨'}</span>
                <p className="text-xs font-semibold leading-tight text-secondary-900 dark:text-white">
                  {demo?.titulo ?? dia.demoId}
                </p>
              </div>

              <div className="mt-auto">
                <p className="inline-flex items-center gap-1 text-[10px] font-medium text-secondary-600 dark:text-secondary-300">
                  <span>{emojiAngulo.get(dia.angulo)}</span>
                  <span>{tAng(`${dia.angulo}.label`)}</span>
                </p>
                <p className="mt-1 line-clamp-3 text-[10px] leading-tight text-secondary-500 dark:text-secondary-400">
                  {t(`notes.${dia.dia}`)}
                </p>
                {seleccionado ? (
                  <p className="mt-1 text-[10px] font-bold text-primary-700 dark:text-primary-300">{t('selected')}</p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Leyenda({ etiqueta }: { etiqueta: (tipo: TipoContenido) => string }) {
  const tipos: TipoContenido[] = ['texto', 'imagen', 'carrusel', 'video'];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tipos.map((tipo) => {
        const Icon = TIPO_ICONS[tipo];
        return (
          <span
            key={tipo}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${TIPO_COLORS[tipo]}`}
          >
            <Icon className="h-3 w-3" />
            {etiqueta(tipo)}
          </span>
        );
      })}
    </div>
  );
}
