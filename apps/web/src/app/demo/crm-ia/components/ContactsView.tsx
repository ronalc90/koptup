'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDownTrayIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  ChannelId,
  Deal,
  OWNERS,
  OWNER_IDS,
  OwnerId,
  Temperature,
  daysSince,
  downloadFile,
  initials,
  probabilityOf,
  scoreOf,
  temperatureOf,
  toCsv,
} from './crm';
import { Avatar, SectionHeader, inputCls } from './ui';
import { useCrmText } from './useCrmText';

export const TEMP_VARIANT: Record<Temperature, 'danger' | 'warning' | 'info'> = {
  hot: 'danger',
  warm: 'warning',
  cold: 'info',
};

export const CHANNEL_ICON: Record<ChannelId, typeof EnvelopeIcon> = {
  whatsapp: ChatBubbleLeftRightIcon,
  email: EnvelopeIcon,
  call: PhoneIcon,
};

type SortId = 'score' | 'value' | 'lastContact' | 'name';

interface Props {
  deals: Deal[];
  onOpen: (id: string) => void;
  notify: (msg: string) => void;
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export default function ContactsView({ deals, onOpen, notify }: Props) {
  const tx = useCrmText();
  const { t } = tx;
  const [search, setSearch] = useState('');
  const [temp, setTemp] = useState<'all' | Temperature>('all');
  const [owner, setOwner] = useState<'all' | OwnerId>('all');
  const [sort, setSort] = useState<SortId>('score');

  const rows = useMemo(() => {
    const term = normalize(search.trim());
    const digits = search.replace(/\D/g, '');
    const list = deals.filter((d) => {
      if (owner !== 'all' && d.owner !== owner) return false;
      if (temp !== 'all' && temperatureOf(scoreOf(d)) !== temp) return false;
      if (!term) return true;
      const hay = normalize(`${d.contactName} ${d.company} ${d.email} ${d.city} ${d.nit}`);
      if (hay.includes(term)) return true;
      return digits.length >= 3 && d.nit.replace(/\D/g, '').includes(digits);
    });
    const cmp: Record<SortId, (a: Deal, b: Deal) => number> = {
      score: (a, b) => scoreOf(b) - scoreOf(a),
      value: (a, b) => b.value - a.value,
      lastContact: (a, b) => (a.lastContact < b.lastContact ? 1 : a.lastContact > b.lastContact ? -1 : 0),
      name: (a, b) => a.contactName.localeCompare(b.contactName, 'es'),
    };
    return [...list].sort(cmp[sort]);
  }, [deals, search, temp, owner, sort]);

  const exportCsv = () => {
    const sep = tx.locale === 'en' ? ',' : ';';
    const header = (
      ['name', 'role', 'company', 'nit', 'city', 'email', 'phone', 'channel', 'owner', 'stage', 'value', 'probability', 'score', 'lastContact', 'nextAction'] as const
    ).map((k) => t(`contacts.csv.${k}`));
    const data = rows.map((d) => [
      d.contactName,
      tx.role(d),
      d.company,
      d.nit,
      d.city,
      d.email,
      d.phone,
      t(`channels.${d.channel}`),
      tx.ownerName(d),
      t(`stages.${d.stage}`),
      d.value,
      probabilityOf(d),
      scoreOf(d),
      d.lastContact,
      tx.nextAction(d),
    ]);
    downloadFile(t('contacts.csvFile'), toCsv([header, ...data], sep), 'text/csv;charset=utf-8');
    notify(t('contacts.exported', { count: rows.length }));
  };

  return (
    <div>
      <SectionHeader
        title={t('contacts.title')}
        subtitle={t('contacts.subtitle')}
        aside={
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={rows.length === 0} className="gap-1.5">
            <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
            {t('contacts.exportCsv')}
          </Button>
        }
      />

      <div className="flex flex-col lg:flex-row gap-3 mb-3">
        <div className="relative flex-1 min-w-0">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('contacts.searchPlaceholder')}
            aria-label={t('contacts.searchLabel')}
            className={`${inputCls} pl-10 py-2.5`}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:flex">
          <select
            value={owner}
            onChange={(e) => setOwner(e.target.value as 'all' | OwnerId)}
            aria-label={t('pipeline.ownerFilter')}
            className={`${inputCls} lg:w-48`}
          >
            <option value="all">{t('pipeline.allOwners')}</option>
            {OWNER_IDS.map((id) => (
              <option key={id} value={id}>
                {OWNERS[id].name}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortId)}
            aria-label={t('contacts.sortLabel')}
            className={`${inputCls} lg:w-48`}
          >
            {(['score', 'value', 'lastContact', 'name'] as const).map((s) => (
              <option key={s} value={s}>
                {t('contacts.sortBy', { field: t(`contacts.sort.${s}`) })}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-3" role="group" aria-label={t('contacts.tempFilter')}>
        {(['all', 'hot', 'warm', 'cold'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setTemp(f)}
            aria-pressed={temp === f}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              temp === f
                ? 'bg-primary-600 text-white'
                : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
            }`}
          >
            {t(`contacts.filters.${f}`)}
          </button>
        ))}
        <span className="text-xs text-secondary-500 ml-auto" aria-live="polite">
          {t('contacts.results', { count: rows.length })}
        </span>
      </div>

      {/* Escritorio */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-secondary-200 dark:border-secondary-800">
        <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-800">
          <thead className="bg-secondary-50 dark:bg-secondary-900/60">
            <tr>
              {(['name', 'company', 'score', 'value', 'nextAction', 'lastContact'] as const).map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-600 dark:text-secondary-400"
                >
                  {t(`contacts.columns.${col}`)}
                </th>
              ))}
              <th scope="col" className="px-3 py-3">
                <span className="sr-only">{t('contacts.columns.actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-200 dark:divide-secondary-800 bg-white dark:bg-secondary-900">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-secondary-500">
                  {t('contacts.noResults')}
                </td>
              </tr>
            ) : (
              rows.map((d) => {
                const score = scoreOf(d);
                const tp = temperatureOf(score);
                const ChannelIcon = CHANNEL_ICON[d.channel];
                return (
                  <tr key={d.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/40 transition-colors">
                    <td className="px-3 py-3 max-w-[220px]">
                      <div className="flex items-center gap-2.5">
                        <Avatar text={initials(d.contactName)} />
                        <div className="min-w-0">
                          <p className="font-medium text-secondary-900 dark:text-white text-sm truncate">{d.contactName}</p>
                          <p className="text-xs text-secondary-500 truncate">{tx.role(d)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 max-w-[220px]">
                      <p className="text-sm text-secondary-800 dark:text-secondary-200 truncate">{d.company}</p>
                      <p className="text-xs text-secondary-500 truncate">
                        NIT {d.nit || '—'} · {d.city}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-secondary-900 dark:text-white">{score}</span>
                        <Badge variant={TEMP_VARIANT[tp]} size="sm">
                          {t(`temperature.${tp}`)}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                      <p className="font-semibold text-primary-700 dark:text-primary-300">{tx.moneyShort(d.value)}</p>
                      <p className="text-xs text-secondary-500">{t(`stages.${d.stage}`)}</p>
                    </td>
                    <td className="px-3 py-3 text-sm text-secondary-700 dark:text-secondary-300 max-w-[220px]">
                      <p className="line-clamp-2">{tx.nextAction(d)}</p>
                      <p className="text-xs text-secondary-500 flex items-center gap-1 mt-0.5">
                        <ChannelIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        {t(`channels.${d.channel}`)} · {tx.ownerName(d)}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-xs text-secondary-600 dark:text-secondary-400 whitespace-nowrap">
                      <p>{tx.ago(d.lastContact)}</p>
                      <p className="text-secondary-500">{tx.date(d.lastContact)}</p>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => onOpen(d.id)} className="whitespace-nowrap">
                        {t('contacts.viewProfile')}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Móvil */}
      <div className="md:hidden space-y-3">
        {rows.length === 0 ? (
          <p className="text-center py-12 text-sm text-secondary-500">{t('contacts.noResults')}</p>
        ) : (
          rows.map((d) => {
            const score = scoreOf(d);
            const tp = temperatureOf(score);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onOpen(d.id)}
                className="w-full text-left p-4 rounded-lg border border-secondary-200 dark:border-secondary-800 hover:border-primary-400 dark:hover:border-primary-500 bg-white dark:bg-secondary-900 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Avatar text={initials(d.contactName)} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-secondary-900 dark:text-white truncate">{d.contactName}</p>
                    <p className="text-xs text-secondary-500 truncate">
                      {d.company} · {d.city}
                    </p>
                    <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1.5 line-clamp-2">{tx.nextAction(d)}</p>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <span className="text-sm font-bold text-primary-700 dark:text-primary-300 whitespace-nowrap">{tx.moneyShort(d.value)}</span>
                      <Badge variant={TEMP_VARIANT[tp]} size="sm" className="flex-shrink-0">
                        {score} · {t(`temperature.${tp}`)}
                      </Badge>
                    </div>
                    <p className="text-xs text-secondary-500 mt-1 truncate">
                      {t(`stages.${d.stage}`)} · {t('dates.ago', { days: daysSince(d.lastContact) })}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
