'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  BeakerIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  MegaphoneIcon,
  PaperAirplaneIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  ALLY_CATEGORIES,
  CAMPAIGN_CHANNELS,
  CLUB,
  FRAUD_RULES,
  SEDES,
  SEGMENTS,
  type AllyCategory,
  type Campaign,
  type CampaignChannel,
  type CampaignStatus,
  type FraudAlert,
  type Segment,
} from './data';
import { audienceFor, balanceOf, ley2300Check } from './engine';
import { useSessionYearPoints } from './ConfigProgram';
import { useLoyalty } from './store';
import { Field, Modal, SampleTag, SectionTitle, inputCls, selectCls, useFmt, useToast } from './ui';

const digits = (s: string) => s.replace(/\D/g, '');
const DAYS = [1, 2, 3, 4, 5, 6, 0];

/* -------------------------------- Campañas -------------------------------- */

export function CampaignsConfig({ prefillSegment, onPrefillUsed }: { prefillSegment: Segment | null; onPrefillUsed: () => void }) {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const notify = useToast();
  const { state, activeMember, addCampaign, setCampaignStatus } = useLoyalty();
  const extra = useSessionYearPoints();
  const th = state.rules.thresholds;

  const [name, setName] = useState('');
  const [segment, setSegment] = useState<Segment>('silverGold');
  const [channel, setChannel] = useState<CampaignChannel>('whatsapp');
  const [day, setDay] = useState(6);
  const [time, setTime] = useState('10:00');
  const [message, setMessage] = useState(() => t('config.campaigns.defaultMessage', { club: CLUB.club }));

  useEffect(() => {
    if (prefillSegment) {
      setSegment(prefillSegment);
      setName(t(`segments.${prefillSegment}`));
      onPrefillUsed();
      document.getElementById('ly-new-campaign')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [prefillSegment, onPrefillUsed, t]);

  const check = ley2300Check(day, time);
  const audience = audienceFor(segment, channel, th, extra);
  const preview = message
    .replace(/\{nombre\}|\{name\}/g, activeMember.name.split(' ')[0])
    .replace(/\{puntos\}|\{points\}/g, f.num(balanceOf(state.ledger, activeMember.id)))
    .replace(/\{club\}/g, CLUB.club);

  const campaignName = (c: Campaign) => (c.key ? t(`config.campaigns.items.${c.key}`) : c.name ?? '');

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (check !== 'ok' || !name.trim()) return;
    addCampaign({ name: name.trim(), message, segment, channel, day, time, status: 'scheduled' });
    notify(t('config.campaigns.saved', { n: f.num(audience) }));
    setName('');
  };

  const statusVariant: Record<CampaignStatus, 'success' | 'info' | 'default' | 'warning'> = { active: 'success', scheduled: 'info', paused: 'warning', draft: 'default' };

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle icon={MegaphoneIcon} title={t('config.campaigns.title')} subtitle={t('config.campaigns.subtitle')} />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-xs uppercase text-secondary-500 border-b border-secondary-200 dark:border-secondary-800">
                <th className="text-left py-2 pr-2">{t('config.campaigns.name')}</th>
                <th className="text-left py-2 pr-2">{t('config.campaigns.audience')}</th>
                <th className="text-left py-2 pr-2">{t('config.campaigns.schedule')}</th>
                <th className="text-left py-2 pr-2">{t('config.campaigns.channel')}</th>
                <th className="text-left py-2 pr-2">{t('config.campaigns.status')}</th>
                <th className="text-right py-2">{t('config.campaigns.action')}</th>
              </tr>
            </thead>
            <tbody>
              {state.campaigns.map((c) => (
                <tr key={c.id} className="border-b border-secondary-100 dark:border-secondary-800/50">
                  <td className="py-3 pr-2 font-medium text-secondary-900 dark:text-white">{campaignName(c)}</td>
                  <td className="py-3 pr-2 text-secondary-600 dark:text-secondary-300">
                    {f.num(audienceFor(c.segment, c.channel, th, extra))}
                    <span className="block text-[11px] text-secondary-500">{t(`segments.${c.segment}`)}</span>
                  </td>
                  <td className="py-3 pr-2 text-secondary-600 dark:text-secondary-300">
                    {c.daily ? t('config.campaigns.daily', { time: c.time }) : t('config.campaigns.weekly', { day: f.weekday(c.day), time: c.time })}
                  </td>
                  <td className="py-3 pr-2">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">{t(`config.campaigns.channels.${c.channel}`)}</span>
                  </td>
                  <td className="py-3 pr-2">
                    <Badge size="sm" variant={statusVariant[c.status]}>
                      {t(`config.campaigns.statuses.${c.status}`)}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const next: CampaignStatus = c.status === 'active' || c.status === 'scheduled' ? 'paused' : 'scheduled';
                        setCampaignStatus(c.id, next);
                        notify(t(`config.campaigns.toast.${next}`, { name: campaignName(c) }));
                      }}
                    >
                      {c.status === 'active' || c.status === 'scheduled' ? t('config.campaigns.pause') : t('config.campaigns.resume')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-secondary-500 dark:text-secondary-400">{t('config.campaigns.audienceNote')}</p>
      </Card>

      <Card id="ly-new-campaign">
        <SectionTitle icon={PlusIcon} title={t('config.campaigns.newTitle')} subtitle={t('config.campaigns.newSubtitle')} />
        <form onSubmit={save} className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Field label={t('config.campaigns.name')} htmlFor="cp-name">
              <input id="cp-name" value={name} maxLength={70} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder={t('config.campaigns.namePh')} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('config.campaigns.segment')} htmlFor="cp-seg">
                <select id="cp-seg" value={segment} onChange={(e) => setSegment(e.target.value as Segment)} className={selectCls}>
                  {SEGMENTS.map((s) => (
                    <option key={s} value={s}>
                      {t(`segments.${s}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('config.campaigns.channel')} htmlFor="cp-ch">
                <select id="cp-ch" value={channel} onChange={(e) => setChannel(e.target.value as CampaignChannel)} className={selectCls}>
                  {CAMPAIGN_CHANNELS.map((c) => (
                    <option key={c} value={c}>
                      {t(`config.campaigns.channels.${c}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('config.campaigns.day')} htmlFor="cp-day">
                <select id="cp-day" value={day} onChange={(e) => setDay(Number(e.target.value))} className={selectCls}>
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {f.weekday(d)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('config.campaigns.time')} htmlFor="cp-time">
                <input id="cp-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <div
              role="status"
              className={`rounded-lg p-3 text-xs ${check === 'ok' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200' : 'bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200'}`}
            >
              {check === 'ok' ? t('config.campaigns.legalOk') : t(`config.campaigns.legal.${check}`)}
              <span className="block mt-1 opacity-80">{t('config.campaigns.legalRule')}</span>
            </div>
            <p className="text-sm text-secondary-700 dark:text-secondary-300">
              {t('config.campaigns.audienceCalc', { n: f.num(audience), channel: t(`config.campaigns.channels.${channel}`) })}
            </p>
          </div>
          <div className="space-y-3">
            <Field label={t('config.campaigns.message')} htmlFor="cp-msg" hint={t('config.campaigns.messageHint')}>
              <textarea id="cp-msg" rows={4} maxLength={320} value={message} onChange={(e) => setMessage(e.target.value)} className={inputCls} />
            </Field>
            <div>
              <p className="text-xs font-medium text-secondary-600 dark:text-secondary-300 mb-1">{t('config.campaigns.preview')}</p>
              <div className="max-w-sm rounded-2xl rounded-tl-sm bg-[#dcf8c6] dark:bg-emerald-900/60 text-secondary-900 dark:text-emerald-50 px-3 py-2 text-sm shadow-sm whitespace-pre-wrap">
                {preview}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="sm" disabled={check !== 'ok' || !name.trim()}>
                {t('config.campaigns.save')}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => notify(t('config.campaigns.testSent', { channel: t(`config.campaigns.channels.${channel}`) }))}>
                <PaperAirplaneIcon className="h-4 w-4 mr-1" /> {t('config.campaigns.test')}
              </Button>
            </div>
            <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('config.campaigns.sendNote')}</p>
          </div>
        </form>
      </Card>
    </div>
  );
}

/* --------------------------------- Aliados --------------------------------- */

export function AlliesConfig() {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const notify = useToast();
  const { state, addAlly, removeAlly } = useLoyalty();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('Bogotá');
  const [category, setCategory] = useState<AllyCategory>('bakery');
  const [rate, setRate] = useState(1);
  const pool = state.allies.reduce((s, a) => s + a.monthPoints, 0);

  return (
    <Card>
      <SectionTitle
        icon={HeartIcon}
        title={t('config.allies.title')}
        subtitle={t('config.allies.subtitle', { club: CLUB.club })}
        right={
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-1" /> {t('config.allies.add')}
          </Button>
        }
      />
      {state.allies.length === 0 ? (
        <p className="mt-4 text-sm text-secondary-500">{t('config.allies.empty')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {state.allies.map((a) => (
            <div key={a.id} className="rounded-lg border border-secondary-200 dark:border-secondary-800 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-secondary-900 dark:text-white truncate">{a.name}</p>
                  <p className="text-xs text-secondary-500">
                    {t(`config.allies.categories.${a.category}`)} · {a.city}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    removeAlly(a.id);
                    notify(t('config.allies.removed', { name: a.name }));
                  }}
                  aria-label={t('config.allies.remove', { name: a.name })}
                  title={t('config.allies.remove', { name: a.name })}
                  className="p-1.5 rounded-lg text-secondary-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-sm text-secondary-700 dark:text-secondary-300">{t('config.allies.rate', { n: a.rate })}</p>
              <p className="text-xs text-secondary-500 mt-1">
                {a.monthPoints > 0 ? t('config.allies.month', { n: f.num(a.monthPoints) }) : t('config.allies.newAlly')}
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-950/60 dark:to-purple-950/60 flex flex-wrap items-center gap-3">
        <div>
          <p className="text-xs text-secondary-600 dark:text-secondary-300">{t('config.allies.pool')}</p>
          <p className="text-2xl font-bold text-secondary-900 dark:text-white">
            {f.num(pool)} {t('common.pts')}
          </p>
          <p className="text-xs text-secondary-600 dark:text-secondary-300">{t('config.allies.poolCost', { value: f.money(pool * state.rules.pointValue) })}</p>
        </div>
        <SampleTag />
      </div>
      <p className="mt-3 text-[11px] text-secondary-500 dark:text-secondary-400">{t('config.allies.note')}</p>

      {open && (
        <Modal title={t('config.allies.addTitle')} onClose={() => setOpen(false)} labelId="ly-ally-title">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim().length < 3 || rate < 1) return;
              addAlly({ name: name.trim(), city, category, rate });
              notify(t('config.allies.added', { name: name.trim() }));
              setName('');
              setOpen(false);
            }}
          >
            <Field label={t('config.allies.name')} htmlFor="al-name" hint={t('config.allies.nameHint')}>
              <input id="al-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label={t('config.allies.city')} htmlFor="al-city">
                <select id="al-city" value={city} onChange={(e) => setCity(e.target.value)} className={selectCls}>
                  {SEDES.map((s) => s.name.split(' · ')[1]).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('config.allies.category')} htmlFor="al-cat">
                <select id="al-cat" value={category} onChange={(e) => setCategory(e.target.value as AllyCategory)} className={selectCls}>
                  {ALLY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {t(`config.allies.categories.${c}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('config.allies.rateLabel')} htmlFor="al-rate">
                <input id="al-rate" inputMode="numeric" value={rate} onChange={(e) => setRate(Math.min(10, Number(digits(e.target.value) || 0)))} className={inputCls} />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={name.trim().length < 3 || rate < 1}>
                {t('config.allies.save')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </Card>
  );
}

/* -------------------------------- Antifraude -------------------------------- */

export function FraudConfig() {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const notify = useToast();
  const { state, setAlertStatus } = useLoyalty();
  const [review, setReview] = useState<FraudAlert | null>(null);
  const sevVariant = { high: 'danger', medium: 'warning', low: 'info' } as const;
  const memberName = (a: FraudAlert) => a.memberLabel ?? state.members.find((m) => m.id === a.memberId)?.name ?? '';

  return (
    <Card>
      <SectionTitle icon={ShieldCheckIcon} title={t('config.fraud.title')} subtitle={t('config.fraud.subtitle')} />
      <ul className="mt-3 text-xs text-secondary-600 dark:text-secondary-400 list-disc pl-5 space-y-0.5">
        <li>{t('config.fraud.ruleSameDay', { n: FRAUD_RULES.sameDayPurchases })}</li>
        <li>{t('config.fraud.ruleHigh', { amount: f.money(FRAUD_RULES.highAmount) })}</li>
      </ul>
      <div className="mt-4 space-y-2">
        {state.alerts.map((a) => (
          <div key={a.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-secondary-200 dark:border-secondary-800">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 shrink-0 hidden sm:block" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-secondary-900 dark:text-white">
                {t(`config.fraud.kinds.${a.kind}`)} {a.session ? <Badge size="sm" variant="primary">{t('config.fraud.fromDemo')}</Badge> : <SampleTag />}
              </p>
              <p className="text-xs text-secondary-500 truncate">{memberName(a)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={sevVariant[a.severity]} size="sm">
                {t(`config.fraud.severity.${a.severity}`)}
              </Badge>
              {a.status !== 'open' && (
                <Badge size="sm" variant="default">
                  {t(`config.fraud.status.${a.status}`)}
                </Badge>
              )}
              <Button size="sm" variant="outline" onClick={() => setReview(a)}>
                {t('config.fraud.review')}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {review && (
        <Modal title={t(`config.fraud.kinds.${review.kind}`)} subtitle={memberName(review)} onClose={() => setReview(null)} labelId="ly-fraud-title" size="lg">
          <p className="text-sm text-secondary-700 dark:text-secondary-300">
            {review.session ? t(`config.fraud.detail.${review.kind}`, { n: FRAUD_RULES.sameDayPurchases, amount: f.money(FRAUD_RULES.highAmount) }) : t(`config.fraud.samples.${review.id}.detail`)}
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-secondary-500">{t('config.fraud.evidence')}</p>
          <ul className="mt-1 space-y-1 text-sm text-secondary-700 dark:text-secondary-300">
            {review.session
              ? (review.saleIds ?? []).map((id) => {
                  const s = state.sales.find((x) => x.id === id);
                  if (!s) return null;
                  return (
                    <li key={id} className="font-mono text-xs">
                      {t('config.fraud.saleLine', {
                        id,
                        date: f.date(s.date),
                        time: s.time,
                        sede: SEDES.find((x) => x.id === s.sede)?.name ?? '',
                        amount: f.money(s.gross),
                        points: f.num(s.points),
                      })}
                    </li>
                  );
                })
              : [0, 1, 2].map((i) => (
                  <li key={i} className="font-mono text-xs">
                    {t(`config.fraud.samples.${review.id}.events.${i}`)}
                  </li>
                ))}
          </ul>
          <p className="mt-3 text-sm">
            <b>{t('config.fraud.suggested')}:</b> {t(`config.fraud.actions.${review.kind}`)}
          </p>
          <p className="mt-2 text-[11px] text-secondary-500">{t('config.fraud.note')}</p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setAlertStatus(review.id, 'dismissed');
                notify(t('config.fraud.dismissedToast'));
                setReview(null);
              }}
            >
              {t('config.fraud.dismiss')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setAlertStatus(review.id, 'frozen');
                notify(t('config.fraud.frozenToast'));
                setReview(null);
              }}
            >
              {t('config.fraud.freeze')}
            </Button>
          </div>
        </Modal>
      )}
    </Card>
  );
}

/* ------------------------------- Pruebas A/B ------------------------------- */

export function ExperimentsConfig() {
  const t = useTranslations('demoLoyalty');
  const f = useFmt();
  const notify = useToast();
  const { state, finishExperiment } = useLoyalty();
  return (
    <Card>
      <SectionTitle icon={BeakerIcon} title={t('config.experiments.title')} subtitle={t('config.experiments.subtitle')} />
      <div className="mt-4 space-y-3">
        {state.experiments.map((e) => {
          const finished = e.status === 'finished';
          return (
            <div key={e.id} className="rounded-lg border border-secondary-200 dark:border-secondary-800 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                <p className="font-medium text-secondary-900 dark:text-white">{t(`config.experiments.items.${e.id}.name`)}</p>
                <div className="flex items-center gap-2">
                  <SampleTag />
                  <Badge size="sm" variant={finished ? 'success' : 'info'}>
                    {finished ? t('config.experiments.finished') : t('config.experiments.running', { days: e.days })}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-secondary-500 mt-1">{t(`config.experiments.items.${e.id}.metric`)}</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {(['a', 'b'] as const).map((v) => (
                  <div key={v} className={`rounded-lg p-3 ${e.winner === v && finished ? 'bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-400' : 'bg-secondary-50 dark:bg-secondary-800/60'}`}>
                    <p className="text-xs text-secondary-500">{t(`config.experiments.items.${e.id}.${v}`)}</p>
                    <p className="text-xl font-bold text-secondary-900 dark:text-white">{f.dec(e[v])} %</p>
                  </div>
                ))}
              </div>
              {finished ? (
                <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">{t(`config.experiments.items.${e.id}.result`)}</p>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    finishExperiment(e.id);
                    notify(t(`config.experiments.items.${e.id}.result`));
                  }}
                >
                  {t('config.experiments.finish')}
                </Button>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-secondary-500 dark:text-secondary-400">{t('config.experiments.note')}</p>
    </Card>
  );
}
