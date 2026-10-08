'use client';

/**
 * Gráficos en SVG calculados a partir de los datos (escalas, ejes y etiquetas
 * salen de las cifras; nada está dibujado con coordenadas fijas). Se dibujan
 * al ancho real del contenedor para que el texto se lea igual en celular y
 * escritorio, y cada marca tiene su tooltip (mouse o teclado).
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { monthNum } from '../lib/dates';
import type { MonthPoint } from '../lib/engine';
import type { MonthKey } from '../lib/types';
import { NS, type Fmt } from './ui';

/** Paleta categórica validada (claro / oscuro) para líneas de negocio. */
export const SERIES = [
  { fill: 'fill-[#7c3aed] dark:fill-[#9085e9]', bg: 'bg-[#7c3aed] dark:bg-[#9085e9]', stroke: 'stroke-[#7c3aed] dark:stroke-[#9085e9]' },
  { fill: 'fill-[#eb6834] dark:fill-[#d95926]', bg: 'bg-[#eb6834] dark:bg-[#d95926]', stroke: 'stroke-[#eb6834] dark:stroke-[#d95926]' },
  { fill: 'fill-[#1baf7a] dark:fill-[#199e70]', bg: 'bg-[#1baf7a] dark:bg-[#199e70]', stroke: 'stroke-[#1baf7a] dark:stroke-[#199e70]' },
  { fill: 'fill-[#eda100] dark:fill-[#c98500]', bg: 'bg-[#eda100] dark:bg-[#c98500]', stroke: 'stroke-[#eda100] dark:stroke-[#c98500]' },
  { fill: 'fill-slate-400 dark:fill-slate-500', bg: 'bg-slate-400 dark:bg-slate-500', stroke: 'stroke-slate-400 dark:stroke-slate-500' },
];

/** Ancho real del contenedor (con un valor inicial fijo para que el render del servidor coincida). */
function useWidth(initial: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.max(260, Math.round(el.getBoundingClientRect().width)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / mag;
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(v);
  return ticks;
}

/** Ancho del eje Y según la etiqueta más larga (11 px ≈ 6,3 px por carácter). */
function axisWidth(labels: string[]) {
  return Math.ceil(Math.max(...labels.map((l) => l.length)) * 6.3) + 12;
}

function Tooltip({ x, width, children }: { x: number; width: number; children: ReactNode }) {
  const left = Math.min(Math.max(x, 90), width - 90);
  return (
    <div
      className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg bg-slate-900/95 dark:bg-slate-700/95 text-white text-xs px-3 py-2 shadow-xl min-w-[150px]"
      style={{ left }}
      role="tooltip"
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ventas vs meta + proyección                                         */
/* ------------------------------------------------------------------ */

export function SalesChart({ points, highlight, fmt }: { points: MonthPoint[]; highlight: MonthKey[]; fmt: Fmt }) {
  const t = useTranslations(`${NS}.charts`);
  const { ref, width } = useWidth(640);
  const [hover, setHover] = useState<number | null>(null);
  const H = 260;
  const max = Math.max(1, ...points.map((p) => Math.max(p.actual ?? 0, p.budget ?? 0, p.forecast?.high ?? 0)));
  const ticks = niceTicks(max * 1.05, 4);
  const top = ticks[ticks.length - 1];
  const m = { l: axisWidth(ticks.map((v) => fmt.moneyM(v, 0))), r: 10, t: 12, b: 26 };
  const innerW = width - m.l - m.r;
  const innerH = H - m.t - m.b;
  const y = (v: number) => m.t + innerH - (v / top) * innerH;
  const band = innerW / Math.max(1, points.length);
  const cx = (i: number) => m.l + band * i + band / 2;
  const barW = Math.max(6, Math.min(36, band * 0.56));
  const budgetPts = points.map((p, i) => (p.budget !== null ? `${cx(i)},${y(p.budget)}` : null)).filter(Boolean);
  const fIdx = points.map((p, i) => (p.forecast ? i : -1)).filter((i) => i >= 0);
  const lastActual = points.reduce((acc, p, i) => (p.actual !== null ? i : acc), -1);
  const fPath = fIdx.length
    ? [lastActual >= 0 ? `${cx(lastActual)},${y(points[lastActual].actual ?? 0)}` : null, ...fIdx.map((i) => `${cx(i)},${y(points[i].forecast!.value)}`)].filter(Boolean).join(' ')
    : '';
  const bandPoly = fIdx.length
    ? [
        ...(lastActual >= 0 ? [`${cx(lastActual)},${y(points[lastActual].actual ?? 0)}`] : []),
        ...fIdx.map((i) => `${cx(i)},${y(points[i].forecast!.high)}`),
        ...[...fIdx].reverse().map((i) => `${cx(i)},${y(points[i].forecast!.low)}`),
      ].join(' ')
    : '';
  const hp = hover !== null ? points[hover] : null;
  return (
    <div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300 mb-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#7c3aed] dark:bg-[#9085e9]" aria-hidden="true" />
          {t('actual')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="18" height="6" aria-hidden="true">
            <line x1="0" y1="3" x2="18" y2="3" className="stroke-slate-500 dark:stroke-slate-400" strokeWidth="2" strokeDasharray="4 3" />
          </svg>
          {t('budget')}
        </span>
        {fIdx.length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-3 rounded-sm bg-[#7c3aed]/20 dark:bg-[#9085e9]/25 border border-dashed border-[#7c3aed] dark:border-[#9085e9]" aria-hidden="true" />
            {t('forecast')}
          </span>
        )}
      </div>
      <div ref={ref} className="relative w-full" onMouseLeave={() => setHover(null)}>
        <svg width={width} height={H} role="img" aria-label={t('salesAria')} className="block">
          {ticks.map((v) => (
            <g key={v}>
              <line x1={m.l} x2={width - m.r} y1={y(v)} y2={y(v)} className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />
              <text x={m.l - 6} y={y(v) + 4} textAnchor="end" className="fill-slate-500 dark:fill-slate-400" fontSize="11">
                {fmt.moneyM(v, 0)}
              </text>
            </g>
          ))}
          {points.map((p, i) => {
            const isHl = highlight.includes(p.month);
            // En pantallas angostas se rotula un mes de cada dos (siempre el del período elegido).
            const label = band >= 30 || i % 2 === 0 || isHl ? fmt.names.short[monthNum(p.month) - 1] : '';
            return (
              <g key={p.month}>
                {p.actual !== null && (
                  <rect
                    x={cx(i) - barW / 2}
                    y={y(p.actual)}
                    width={barW}
                    height={Math.max(0, y(0) - y(p.actual))}
                    rx="4"
                    className={`fill-[#7c3aed] dark:fill-[#9085e9] ${isHl || !highlight.length ? '' : 'opacity-40'}`}
                  />
                )}
                <text x={cx(i)} y={H - 8} textAnchor="middle" fontSize="11" className={isHl ? 'fill-slate-900 dark:fill-white font-semibold' : 'fill-slate-500 dark:fill-slate-400'}>
                  {label}
                </text>
              </g>
            );
          })}
          {bandPoly && <polygon points={bandPoly} className="fill-[#7c3aed]/15 dark:fill-[#9085e9]/20" />}
          {fPath && <polyline points={fPath} fill="none" className="stroke-[#7c3aed] dark:stroke-[#9085e9]" strokeWidth="2" strokeDasharray="5 4" />}
          {fIdx.map((i) => (
            <circle key={i} cx={cx(i)} cy={y(points[i].forecast!.value)} r="4" className="fill-white dark:fill-slate-900 stroke-[#7c3aed] dark:stroke-[#9085e9]" strokeWidth="2" />
          ))}
          {budgetPts.length > 1 && <polyline points={budgetPts.join(' ')} fill="none" className="stroke-slate-500 dark:stroke-slate-400" strokeWidth="2" strokeDasharray="4 3" />}
          {points.map((p, i) =>
            p.budget !== null ? <circle key={`b${i}`} cx={cx(i)} cy={y(p.budget)} r="2.5" className="fill-slate-500 dark:fill-slate-400" /> : null,
          )}
          {hover !== null && <line x1={cx(hover)} x2={cx(hover)} y1={m.t} y2={y(0)} className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="1" />}
          {points.map((p, i) => (
            <rect
              key={`hit${i}`}
              x={m.l + band * i}
              y={m.t}
              width={band}
              height={innerH}
              fill="transparent"
              tabIndex={0}
              aria-label={`${fmt.monthTitle(p.month)}: ${p.actual !== null ? fmt.moneyM(p.actual) : p.forecast ? fmt.moneyM(p.forecast.value) : '—'}`}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="outline-none focus:stroke-purple-500"
            />
          ))}
        </svg>
        {hp && hover !== null && (
          <Tooltip x={cx(hover)} width={width}>
            <div className="font-semibold mb-1">{fmt.monthTitle(hp.month)}</div>
            {hp.actual !== null && (
              <div className="flex justify-between gap-3">
                <span>{t('actual')}</span>
                <span className="font-semibold">{fmt.moneyM(hp.actual)}</span>
              </div>
            )}
            {hp.forecast && (
              <>
                <div className="flex justify-between gap-3">
                  <span>{t('forecast')}</span>
                  <span className="font-semibold">{fmt.moneyM(hp.forecast.value)}</span>
                </div>
                <div className="text-slate-300">{t('range', { low: fmt.moneyM(hp.forecast.low), high: fmt.moneyM(hp.forecast.high) })}</div>
              </>
            )}
            {hp.budget !== null && (
              <div className="flex justify-between gap-3">
                <span>{t('budget')}</span>
                <span>{fmt.moneyM(hp.budget)}</span>
              </div>
            )}
            {hp.budget !== null && (hp.actual !== null || hp.forecast) && (
              <div className="text-slate-300">{t('compliance', { pct: fmt.pct((hp.actual ?? hp.forecast!.value) / hp.budget, 0) })}</div>
            )}
          </Tooltip>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Barras horizontales con meta (ciudades)                             */
/* ------------------------------------------------------------------ */

export interface BarItem {
  key: string;
  label: string;
  value: number;
  budget: number | null;
}

export function GoalBars({ items, fmt }: { items: BarItem[]; fmt: Fmt }) {
  const t = useTranslations(`${NS}.charts`);
  const max = Math.max(1, ...items.map((i) => Math.max(i.value, i.budget ?? 0)));
  return (
    <ul className="space-y-3">
      {items.map((it) => {
        const c = it.budget ? it.value / it.budget : null;
        const tone = c === null ? 'bg-[#7c3aed] dark:bg-[#9085e9]' : c >= 1 ? 'bg-emerald-600 dark:bg-emerald-500' : c >= 0.95 ? 'bg-amber-500' : 'bg-red-600 dark:bg-red-500';
        return (
          <li key={it.key} title={`${it.label}: ${fmt.money(it.value)}${it.budget ? ` · ${t('budget')} ${fmt.money(it.budget)}` : ''}`}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium text-slate-800 dark:text-slate-100 truncate">{it.label}</span>
              <span className="text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {fmt.moneyM(it.value)}
                {c !== null && <span className="ml-2 text-xs font-semibold">{t('ofGoal', { pct: fmt.pct(c, 0) })}</span>}
              </span>
            </div>
            <div className="relative h-3 mt-1 rounded-full bg-slate-100 dark:bg-slate-800">
              <div className={`h-3 rounded-full ${tone}`} style={{ width: `${(it.value / max) * 100}%` }} />
              {it.budget !== null && (
                <span
                  className="absolute -top-0.5 h-4 w-0.5 bg-slate-700 dark:bg-slate-200"
                  style={{ left: `calc(${(it.budget / max) * 100}% - 1px)` }}
                  aria-hidden="true"
                />
              )}
            </div>
          </li>
        );
      })}
      <li className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="inline-block h-3 w-0.5 bg-slate-700 dark:bg-slate-200" aria-hidden="true" />
        {t('goalMarker')}
      </li>
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Dona (participación por línea)                                      */
/* ------------------------------------------------------------------ */

export interface Slice {
  key: string;
  label: string;
  value: number;
  extra?: string;
}

export function Donut({ slices, fmt, centerLabel }: { slices: Slice[]; fmt: Fmt; centerLabel: string }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const [hover, setHover] = useState<string | null>(null);
  const R = 70;
  const r = 46;
  const C = 90;
  let angle = -Math.PI / 2;
  const gap = slices.length > 1 ? 0.025 : 0;
  const arcs = slices.map((s, i) => {
    const sweep = total > 0 ? (s.value / total) * Math.PI * 2 : 0;
    const a0 = angle + gap / 2;
    const a1 = angle + sweep - gap / 2;
    angle += sweep;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = (rad: number, a: number) => `${C + rad * Math.cos(a)},${C + rad * Math.sin(a)}`;
    const d = sweep >= Math.PI * 2 - 0.001
      ? `M ${C} ${C - R} A ${R} ${R} 0 1 1 ${C - 0.01} ${C - R} L ${C - 0.01} ${C - r} A ${r} ${r} 0 1 0 ${C} ${C - r} Z`
      : `M ${p(R, a0)} A ${R} ${R} 0 ${large} 1 ${p(R, a1)} L ${p(r, a1)} A ${r} ${r} 0 ${large} 0 ${p(r, a0)} Z`;
    return { s, d, i };
  });
  const active = slices.find((s) => s.key === hover);
  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <svg viewBox="0 0 180 180" className="w-44 h-44 shrink-0" role="img" aria-label={centerLabel}>
        {arcs.map(({ s, d, i }) => (
          <path
            key={s.key}
            d={d}
            className={`${SERIES[Math.min(i, SERIES.length - 1)].fill} transition-opacity ${hover && hover !== s.key ? 'opacity-40' : ''}`}
            onMouseEnter={() => setHover(s.key)}
            onMouseLeave={() => setHover(null)}
          >
            <title>{`${s.label}: ${fmt.money(s.value)} (${fmt.pct(total ? s.value / total : 0)})`}</title>
          </path>
        ))}
        <text x={C} y={C - 4} textAnchor="middle" fontSize="11" className="fill-slate-500 dark:fill-slate-400">
          {active ? active.label.slice(0, 18) : centerLabel}
        </text>
        <text x={C} y={C + 14} textAnchor="middle" fontSize="15" fontWeight="700" className="fill-slate-900 dark:fill-white">
          {fmt.moneyM(active ? active.value : total)}
        </text>
      </svg>
      <ul className="w-full space-y-2">
        {slices.map((s, i) => (
          <li
            key={s.key}
            className={`flex items-start gap-2 rounded-lg px-2 py-1 ${hover === s.key ? 'bg-slate-50 dark:bg-slate-800' : ''}`}
            onMouseEnter={() => setHover(s.key)}
            onMouseLeave={() => setHover(null)}
          >
            <span className={`mt-1 w-3 h-3 rounded-sm shrink-0 ${SERIES[Math.min(i, SERIES.length - 1)].bg}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2 text-sm">
                <span className="font-medium text-slate-800 dark:text-slate-100 truncate">{s.label}</span>
                <span className="text-slate-700 dark:text-slate-200 whitespace-nowrap">{fmt.pct(total ? s.value / total : 0)}</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {fmt.moneyM(s.value)}
                {s.extra ? ` · ${s.extra}` : ''}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Caja semanal                                                        */
/* ------------------------------------------------------------------ */

export interface CashBar {
  n: number;
  label: string;
  balance: number;
  detail: ReactNode;
  marker?: string;
}

export function CashChart({ bars, floor, minN, fmt }: { bars: CashBar[]; floor: number; minN: number; fmt: Fmt }) {
  const t = useTranslations(`${NS}.charts`);
  const { ref, width } = useWidth(640);
  const [hover, setHover] = useState<number | null>(null);
  const H = 230;
  const values = bars.map((b) => b.balance);
  const maxV = Math.max(floor, ...values, 1);
  const minV = Math.min(0, ...values);
  const base = niceTicks((maxV - minV) * 1.08, 4);
  const step = base[1] - base[0];
  const lo = Math.floor(minV / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= maxV * 1.08 + step; v += step) {
    ticks.push(v);
    if (v >= maxV * 1.04) break;
  }
  const hi = ticks[ticks.length - 1];
  const m = { l: axisWidth(ticks.map((v) => fmt.moneyM(v, 0))), r: 10, t: 14, b: 26 };
  const innerW = width - m.l - m.r;
  const innerH = H - m.t - m.b;
  const y = (v: number) => m.t + innerH - ((v - lo) / (hi - lo)) * innerH;
  const band = innerW / bars.length;
  const cx = (i: number) => m.l + band * i + band / 2;
  const barW = Math.max(6, Math.min(30, band * 0.6));
  const hb = hover !== null ? bars[hover] : null;
  return (
    <div ref={ref} className="relative w-full" onMouseLeave={() => setHover(null)}>
      <svg width={width} height={H} role="img" aria-label={t('cashAria')} className="block">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={m.l} x2={width - m.r} y1={y(v)} y2={y(v)} className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />
            <text x={m.l - 6} y={y(v) + 4} textAnchor="end" fontSize="11" className="fill-slate-500 dark:fill-slate-400">
              {fmt.moneyM(v, 0)}
            </text>
          </g>
        ))}
        {bars.map((b, i) => {
          const isMin = b.n === minN;
          const below = b.balance < floor;
          return (
            <g key={b.n}>
              <rect
                x={cx(i) - barW / 2}
                y={Math.min(y(b.balance), y(0))}
                width={barW}
                height={Math.abs(y(0) - y(b.balance))}
                rx="3"
                className={isMin ? 'fill-amber-500' : below ? 'fill-red-600 dark:fill-red-500' : 'fill-[#2a78d6] dark:fill-[#3987e5]'}
              />
              {b.marker && (
                <text x={cx(i)} y={Math.min(y(b.balance), y(0)) - 4} textAnchor="middle" fontSize="10" fontWeight="700" className="fill-slate-700 dark:fill-slate-200">
                  {b.marker}
                </text>
              )}
              <text x={cx(i)} y={H - 8} textAnchor="middle" fontSize="10" className="fill-slate-500 dark:fill-slate-400">
                {band < 44 && i % 2 === 1 ? '' : b.label}
              </text>
            </g>
          );
        })}
        <line x1={m.l} x2={width - m.r} y1={y(floor)} y2={y(floor)} className="stroke-red-600 dark:stroke-red-400" strokeWidth="1.5" strokeDasharray="5 4" />
        {bars.map((b, i) => (
          <rect
            key={`hit${b.n}`}
            x={m.l + band * i}
            y={m.t}
            width={band}
            height={innerH}
            fill="transparent"
            tabIndex={0}
            aria-label={`${b.label}: ${fmt.moneyM(b.balance)}`}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            className="outline-none"
          />
        ))}
      </svg>
      {hb && hover !== null && (
        <Tooltip x={cx(hover)} width={width}>
          {hb.detail}
        </Tooltip>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mini barras (ventas mensuales de un cliente)                        */
/* ------------------------------------------------------------------ */

export function MiniBars({ data, fmt, highlight }: { data: { month: MonthKey; sales: number }[]; fmt: Fmt; highlight: MonthKey[] }) {
  const max = Math.max(1, ...data.map((d) => d.sales));
  return (
    <div className="flex items-end gap-1 h-24" role="img" aria-label={data.map((d) => `${fmt.monthTitle(d.month, true)} ${fmt.moneyM(d.sales)}`).join(', ')}>
      {data.map((d) => (
        <div key={d.month} className="flex-1 flex flex-col items-center justify-end h-full min-w-0" title={`${fmt.monthTitle(d.month)}: ${fmt.money(d.sales)}`}>
          <div
            className={`w-full rounded-t ${highlight.includes(d.month) ? 'bg-[#7c3aed] dark:bg-[#9085e9]' : 'bg-[#7c3aed]/40 dark:bg-[#9085e9]/40'}`}
            style={{ height: `${Math.max(2, (d.sales / max) * 100)}%` }}
          />
          <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{fmt.names.short[monthNum(d.month) - 1]}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cartera por edades (barra apilada)                                  */
/* ------------------------------------------------------------------ */

export const AGING_COLORS = ['bg-slate-300 dark:bg-slate-600', 'bg-red-200 dark:bg-red-900', 'bg-red-300 dark:bg-red-700', 'bg-red-500', 'bg-red-700 dark:bg-red-400'];

export function StackBar({ parts, fmt }: { parts: { key: string; label: string; value: number }[]; fmt: Fmt }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <div>
      <div className="flex h-5 w-full overflow-hidden rounded-full gap-0.5 bg-white dark:bg-slate-900">
        {parts.map((p, i) =>
          p.value > 0 ? (
            <div key={p.key} className={AGING_COLORS[i]} style={{ width: `${(p.value / total) * 100}%` }} title={`${p.label}: ${fmt.money(p.value)}`} />
          ) : null,
        )}
      </div>
      <ul className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
        {parts.map((p, i) => (
          <li key={p.key} className="text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className={`w-2.5 h-2.5 rounded-sm ${AGING_COLORS[i]}`} aria-hidden="true" />
              {p.label}
            </div>
            <div className="font-semibold text-slate-900 dark:text-white">{fmt.moneyM(p.value)}</div>
            <div className="text-slate-500 dark:text-slate-400">{fmt.pct(p.value / total, 0)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
