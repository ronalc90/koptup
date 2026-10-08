'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { notify } from '../lib/notify';
import { BellAlertIcon, CheckBadgeIcon, PauseCircleIcon, PlayCircleIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { PROCESSES_TODAY, SUPPLIER_DOCS, sourceMeta } from '../lib/data';
import { chartSeries, docStatus, evaluateRules, matchProcess, type AlertHit } from '../lib/engine';
import { DEMO_TODAY, cop, dateTime, daysBetween, num, pct, shortDate, signedPct, type Loc } from '../lib/format';
import { formatNit, verificationDigit } from '../lib/nit';
import { useDemo } from '../lib/store';
import type { Row, SourceId } from '../lib/types';
import { displayData } from '../lib/view';
import { DataTable, Modal, Panel, Section, btn, buildCsv, downloadText, formatCell, inputCls, type T } from './ui';

export function alertText(t: T, hit: AlertHit, loc: Loc): string {
  const p = { ...hit.params };
  if (typeof p.amount === 'number') p.amount = cop(p.amount, loc);
  // "bajó 11 %": el verbo ya indica la dirección, así que el porcentaje va sin signo.
  if (typeof p.pct === 'number') p.pct = hit.key === 'priceDrop' ? pct(Math.abs(p.pct), loc) : signedPct(p.pct, loc);
  return t(`alertsText.${hit.key}`, p);
}

export function csvName(id: SourceId, ext: string) {
  return `koptup-demo-${id}-${DEMO_TODAY}.${ext}`;
}

export default function Overview({ sourceId }: { sourceId: SourceId }) {
  const t = useTranslations('demoScraping');
  const { s, loc, update, setTab, markTour } = useDemo();
  const r = s.results[sourceId];
  const { columns, rows } = useMemo(() => displayData(sourceId, s), [sourceId, s]);
  const hits = useMemo(() => evaluateRules(r ?? null, s.rules, { corrections: s.corrections }), [r, s.rules, s.corrections]);
  const [detail, setDetail] = useState<Row | null>(null);
  const [fixing, setFixing] = useState<Row | null>(null);
  const paused = s.paused.includes(sourceId);
  if (!r) return null;

  const added = r.changes.filter((c) => c.kind === 'added').length;
  const other = r.changes.length - added;
  const series = chartSeries(sourceId, r.rows.length);
  const max = Math.max(1, ...series.map((p) => p.value));
  const meta = sourceMeta(sourceId);

  const download = () => {
    downloadText(csvName(sourceId, 'csv'), buildCsv(columns, rows, t, loc), 'text/csv;charset=utf-8');
    markTour('download');
    notify.success(t('delivery.downloaded', { file: csvName(sourceId, 'csv') }));
  };

  const sendToRag = (ids: string[]) => {
    update((p) => ({ ...p, sentToRag: Array.from(new Set([...p.sentToRag, ...ids])) }));
    notify.success(t('overview.rag.sent', { count: ids.length }));
  };
  const pendingRag = sourceId === 'normativa' ? rows.filter((x) => x.rag === 'pending').map((x) => String(x.id)) : [];

  const kpis = [
    { k: 'records', v: num(r.rows.length, loc) },
    { k: 'newToday', v: num(added, loc) },
    { k: 'otherChanges', v: num(other, loc) },
    { k: 'quality', v: pct(r.quality, loc, Number.isInteger(r.quality) ? 0 : 1), hint: t(`overview.qualityHint.${sourceId === 'documentos' ? 'docs' : 'fields'}`) },
    { k: 'updated', v: dateTime(r.at, loc), hint: t(`values.trigger.${r.trigger}`) },
  ];

  return (
    <Section
      title={t(`sources.${sourceId}.name`)}
      subtitle={t(`sources.${sourceId}.description`)}
      right={
        <button
          type="button"
          className={btn.secondary}
          onClick={() => {
            update((p) => ({ ...p, paused: paused ? p.paused.filter((x) => x !== sourceId) : [...p.paused, sourceId] }));
            notify.success(paused ? t('overview.resumed') : t('overview.pausedToast'));
          }}
        >
          {paused ? <PlayCircleIcon className="h-4 w-4" /> : <PauseCircleIcon className="h-4 w-4" />}
          {paused ? t('actions.resume') : t('actions.pause')}
        </button>
      }
    >
      <p className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-xs text-sky-100">
        <span className="font-semibold">{t(`sources.kind.${meta.kind}`)}.</span> {t(`sources.${sourceId}.simulated`)}
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.k} className="rounded-xl border border-secondary-800 bg-secondary-900 p-3">
            <div className="text-[11px] uppercase tracking-wider text-secondary-400">{t(`overview.kpis.${k.k}`)}</div>
            <div className={`mt-1 font-semibold text-white ${k.k === 'updated' ? 'text-sm' : 'text-2xl'}`}>{k.v}</div>
            {k.hint && <div className="mt-0.5 text-[11px] text-secondary-500">{k.hint}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-white">{t('overview.chartTitle')}</h3>
            <p className="text-xs text-secondary-400">{t('overview.chartHint')}</p>
          </div>
          <div className="flex h-44 items-end gap-1" role="img" aria-label={t('overview.chartAria', { today: r.rows.length })}>
            {series.map((p) => (
              <div key={p.date} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={t('overview.barTitle', { date: shortDate(p.date, loc), value: p.value })}>
                <span className="text-[10px] text-secondary-400">{p.value}</span>
                <div
                  className={`w-full rounded-t ${p.today ? 'bg-emerald-400' : 'bg-emerald-500/50'}`}
                  style={{ height: `${Math.max(3, Math.round((p.value / max) * 120))}px` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-1">
            {series.map((p, i) => (
              <span key={p.date} className={`min-w-0 flex-1 truncate text-center text-[9px] text-secondary-500 ${!p.today && i % 4 !== 1 ? 'max-sm:invisible' : ''}`}>
                {p.today ? t('overview.today') : i % 2 === 1 ? shortDate(p.date, loc) : ''}
              </span>
            ))}
          </div>
        </Panel>
        <Panel>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">{t('overview.alertsTitle')}</h3>
            <button type="button" className={btn.ghost} onClick={() => setTab('alerts')}>
              {t('overview.configureAlerts')}
            </button>
          </div>
          {hits.length === 0 ? (
            <p className="text-xs text-secondary-500">{t('overview.noAlerts')}</p>
          ) : (
            <ul className="space-y-2">
              {hits.map((h, i) => (
                <li key={`${h.ruleId}-${i}`} className="flex items-start gap-2 rounded-md border border-secondary-800 bg-secondary-950/60 p-2 text-xs text-secondary-200">
                  <BellAlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                  {alertText(t, h, loc)}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel id="scraping-table">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white">{t('overview.tableTitle')}</h3>
            <p className="text-xs text-secondary-400">{t(`overview.tableHint.${sourceId}`)}</p>
          </div>
          {sourceId === 'normativa' && (
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className={btn.secondary} disabled={pendingRag.length === 0} onClick={() => sendToRag(pendingRag)}>
                <PaperAirplaneIcon className="h-4 w-4" />
                {t('overview.rag.sendAll', { count: pendingRag.length })}
              </button>
              <Link href="/demo/chatbot" className="text-xs text-emerald-300 underline-offset-2 hover:underline">{t('overview.rag.chatbotLink')}</Link>
            </div>
          )}
        </div>
        {sourceId === 'normativa' && <p className="mb-3 text-[11px] text-secondary-500">{t('overview.rag.note')}</p>}
        <DataTable
          columns={columns}
          rows={rows}
          t={t}
          loc={loc}
          rowKey={(row, i) => String(row.id ?? row.ref ?? `${row._storeId ?? ''}-${row._idx ?? i}`)}
          onDownload={download}
          onRowClick={sourceId === 'contratacion' ? (row) => { setDetail(row); markTour('radar'); } : undefined}
          rowLabel={sourceId === 'contratacion' ? (row) => t('overview.process.open', { ref: String(row.ref) }) : undefined}
          renderCell={(c, row) => {
            if (sourceId === 'contratacion' && c.key === 'object') {
              return (
                <span>
                  {String(row.object)}
                  <span className="mt-0.5 block text-[11px] text-emerald-300">{t('overview.process.openHint')}</span>
                </span>
              );
            }
            if (sourceId === 'normativa' && c.key === 'rag') {
              return row.rag === 'sent' ? (
                <span className="inline-flex items-center gap-1 text-emerald-300"><CheckBadgeIcon className="h-4 w-4" />{t('values.rag.sent')}</span>
              ) : (
                <button type="button" className={btn.ghost} onClick={() => sendToRag([String(row.id)])}>
                  <PaperAirplaneIcon className="h-3.5 w-3.5" />
                  {t('overview.rag.send')}
                </button>
              );
            }
            if (sourceId === 'documentos' && c.key === 'status') {
              const st = String(row.status);
              const review = st === 'reviewDv' || st === 'reviewConfidence';
              return (
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${review ? 'bg-amber-500/15 text-amber-200' : 'bg-emerald-500/15 text-emerald-200'}`}>{formatCell(c, row.status, t, loc)}</span>
                  {review && (
                    <button type="button" className={btn.ghost} onClick={() => setFixing(row)}>
                      {st === 'reviewDv' ? t('overview.docs.fix') : t('overview.docs.approve')}
                    </button>
                  )}
                </span>
              );
            }
            if (c.type === 'status' && c.valueKey === 'processStatus') {
              return <span className={`rounded-full px-2 py-0.5 text-[11px] ${row.status === 'open' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-secondary-700 text-secondary-200'}`}>{formatCell(c, row.status, t, loc)}</span>;
            }
            return undefined;
          }}
        />
      </Panel>

      <ProcessDetail row={detail} onClose={() => setDetail(null)} />
      <DocFix row={fixing} onClose={() => setFixing(null)} />
    </Section>
  );
}

function ProcessDetail({ row, onClose }: { row: Row | null; onClose: () => void }) {
  const t = useTranslations('demoScraping');
  const { s, loc } = useDemo();
  const p = row ? PROCESSES_TODAY.find((x) => x.ref === row.ref) : null;
  const m = p ? matchProcess(p, s.radar) : null;
  const days = p ? daysBetween(DEMO_TODAY, p.closes) : 0;
  return (
    <Modal open={!!p} onClose={onClose} title={p ? p.ref : ''}>
      {p && m && (
        <div className="space-y-4 text-sm">
          <p className="text-white">{p.object}</p>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
            <Item label={t('columns.entity')} value={p.entity} />
            <Item label={t('columns.location')} value={`${p.city}, ${p.department}`} />
            <Item label={t('columns.modality')} value={t(`values.modality.${p.modality}`)} />
            <Item label={t('columns.amount')} value={cop(p.amount, loc)} />
            <Item label={t('columns.published')} value={formatCell({ key: 'd', type: 'date' }, p.published, t, loc)} />
            <Item
              label={t('columns.closes')}
              value={`${formatCell({ key: 'd', type: 'date' }, p.closes, t, loc)} · ${p.status === 'closed' || days < 0 ? t('values.processStatus.closed') : t('overview.process.daysLeft', { days })}`}
            />
          </dl>
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">{t('overview.process.whyTitle')}</h4>
            <ul className="list-disc space-y-0.5 pl-4 text-xs text-secondary-200">
              <li>{t('overview.process.whyKeyword', { keyword: m.keyword ?? '—' })}</li>
              <li>{t('overview.process.whyDepartment', { department: p.department })}</li>
              <li>{t('overview.process.whyAmount', { min: cop(s.radar.minAmount, loc) })}</li>
            </ul>
          </div>
          <p className="text-[11px] text-secondary-500">{t('overview.process.sampleNote')}</p>
        </div>
      )}
    </Modal>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-secondary-500">{label}</dt>
      <dd className="text-secondary-100">{value}</dd>
    </div>
  );
}

function DocFix({ row, onClose }: { row: Row | null; onClose: () => void }) {
  const t = useTranslations('demoScraping');
  const { update } = useDemo();
  const d = row ? SUPPLIER_DOCS.find((x) => x.id === row.id) : null;
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  if (!d) return <Modal open={false} onClose={onClose} title="">{null}</Modal>;
  const st = docStatus(d, 0, undefined);
  const expected = verificationDigit(d.nit);
  const dvReview = st.status === 'reviewDv';
  const parsed = value.trim() === '' ? null : Number(value.trim());
  const valid = parsed !== null && Number.isInteger(parsed) && parsed >= 0 && parsed <= 9;
  const ok = valid && parsed === expected;

  const close = () => {
    setValue('');
    setTouched(false);
    onClose();
  };

  return (
    <Modal open={!!d} onClose={close} title={d.file}>
      <div className="space-y-3 text-sm">
        {dvReview ? (
          <>
            <p className="text-secondary-300">{t('overview.docs.dvExplain', { nit: formatNit(d.nit), read: d.dvRead })}</p>
            <label className="block text-xs text-secondary-300">
              {t('overview.docs.dvLabel')}
              <input
                value={value}
                inputMode="numeric"
                maxLength={1}
                onChange={(e) => {
                  setValue(e.target.value.replace(/\D/g, ''));
                  setTouched(true);
                }}
                className={`${inputCls} mt-1 w-24 font-mono`}
              />
            </label>
            {touched && valid && !ok && <p className="text-xs text-rose-300">{t('overview.docs.dvWrong', { dv: String(parsed) })}</p>}
            {ok && <p className="text-xs text-emerald-300">{t('overview.docs.dvOk')}</p>}
            <p className="text-[11px] text-secondary-500">{t('overview.docs.dvHow')}</p>
          </>
        ) : (
          <p className="text-secondary-300">{t('overview.docs.lowExplain', { confidence: d.confidence })}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={btn.secondary} onClick={close}>{t('actions.cancel')}</button>
          <button
            type="button"
            className={btn.primary}
            disabled={dvReview && !ok}
            onClick={() => {
              update((p) => ({ ...p, corrections: { ...p.corrections, [d.id]: dvReview ? (parsed as number) : d.dvRead } }));
              notify.success(t('overview.docs.saved', { file: d.file }));
              close();
            }}
          >
            {dvReview ? t('overview.docs.saveFix') : t('overview.docs.approve')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
