'use client';

import { useLocale } from 'next-intl';
import { asLoc, dateLabel, dateTimeLabel, money, num, periodLabel } from './format';

export function useFmt() {
  const loc = asLoc(useLocale());
  return {
    loc,
    money: (n: number) => money(n, loc),
    num: (n: number, decimals = 0) => num(n, loc, decimals),
    date: (iso: string) => dateLabel(iso, loc),
    dateTime: (iso: string) => dateTimeLabel(iso, loc),
    period: (p: string) => periodLabel(p, loc),
  };
}
