'use client';

import { useCallback, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AGENTS, type AgentId, type Txt } from './data';
import { DAY_MIN, dateOfDay } from './engine';

export type HdText = ReturnType<typeof useHelpdeskText>;

/** Textos y formatos de la mesa de ayuda en el idioma activo (sin depender de la zona horaria). */
export function useHelpdeskText() {
  const t = useTranslations('demoHelpdesk');
  const locale = useLocale();
  const lang: 'es' | 'en' = locale === 'en' ? 'en' : 'es';

  const tx = useCallback(
    (txt: Txt): string => {
      if (typeof txt === 'string') return txt;
      const params: Record<string, string | number> = {};
      for (const [key, value] of Object.entries(txt.p ?? {})) {
        params[key] = typeof value === 'string' && value.startsWith('@') ? t(value.slice(1)) : value;
      }
      return t(txt.k, params);
    },
    [t],
  );

  return useMemo(() => {
    const agentName = (id: AgentId | 'you' | 'system' | null | undefined): string => {
      if (!id) return t('inbox.unassigned');
      if (id === 'you') return t('common.you');
      if (id === 'system') return t('common.system');
      return AGENTS.find((a) => a.id === id)?.name ?? id;
    };

    const decimal = (n: number, digits = 1) => {
      const s = n.toFixed(digits);
      return lang === 'es' ? s.replace('.', ',') : s;
    };

    const pct = (n: number) => t('common.pct', { n: Math.round(n * 100) });

    const duration = (min: number): string => {
      const m = Math.max(0, Math.round(min));
      if (m < 60) return t('time.minutes', { n: m });
      if (m < DAY_MIN) {
        const h = Math.floor(m / 60);
        const rest = m % 60;
        return rest ? t('time.hoursMinutes', { h, m: rest }) : t('time.hours', { h });
      }
      const d = Math.floor(m / DAY_MIN);
      const h = Math.floor((m % DAY_MIN) / 60);
      return h ? t('time.daysHours', { d, h }) : t('time.days', { d });
    };

    const ago = (at: number, clock: number): string => {
      const diff = clock - at;
      if (diff < 1) return t('time.now');
      if (diff < 60) return t('time.minutesAgo', { n: diff });
      if (diff < DAY_MIN) return t('time.hoursAgo', { n: Math.floor(diff / 60) });
      return t('time.daysAgo', { n: Math.floor(diff / DAY_MIN) });
    };

    const hhmm = (minute: number): string => {
      const m = ((minute % DAY_MIN) + DAY_MIN) % DAY_MIN;
      return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    };

    const weekdays = t.raw('dates.weekdays') as string[];
    const months = t.raw('dates.months') as string[];

    const date = (day: number): string => {
      const d = dateOfDay(day);
      return t('dates.short', {
        wd: weekdays[d.getUTCDay()],
        d: d.getUTCDate(),
        m: months[d.getUTCMonth()],
        y: d.getUTCFullYear(),
      });
    };

    /** Fecha ISO (AAAA-MM-DD) para exportar. */
    const isoDate = (day: number): string => {
      const d = dateOfDay(day);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    };

    const dateTime = (minute: number): string =>
      t('dates.dateTime', { date: date(Math.floor(minute / DAY_MIN)), time: hhmm(minute) });

    const firstName = (full: string) => full.trim().split(/\s+/)[0] || full;

    return { t, tx, lang, agentName, decimal, pct, duration, ago, hhmm, date, isoDate, dateTime, firstName };
  }, [t, tx, lang]);
}
