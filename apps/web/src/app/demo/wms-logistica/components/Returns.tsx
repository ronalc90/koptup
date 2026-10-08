'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { CITY_BY_ID, CLIENT_BY_ID } from '../lib/catalog';
import { fmtDate } from '../lib/format';
import { now, useWms } from '../lib/store';
import type { RmaReason, RmaStatus } from '../lib/types';
import { Empty, Field, Panel, Pill, SimNote, inputCls, baseInputCls, selectCls, tdCls, thCls, useProductName, useT, type Tone } from './ui';

const REASONS: RmaReason[] = ['damaged', 'wrongItem', 'withdrawal', 'defect'];
const REJECT = ['outOfTerm', 'used', 'noEvidence'] as const;
const TONE: Record<RmaStatus, Tone> = { requested: 'info', approved: 'warning', rejected: 'danger', received: 'primary', closed: 'success' };

export default function Returns() {
  const t = useT();
  const name = useProductName();
  const { state, nav, lang, today, dispatch, notify } = useWms();
  const delivered = state.orders.filter((o) => o.wh === nav.wh && o.status === 'delivered');
  const [orderId, setOrderId] = useState(delivered[0]?.id ?? '');
  const order = delivered.find((o) => o.id === orderId);
  const [sku, setSku] = useState(order?.lines[0]?.sku ?? '');
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState<RmaReason>('damaged');
  const [comments, setComments] = useState('');
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<(typeof REJECT)[number]>('outOfTerm');

  useEffect(() => {
    if (!delivered.some((o) => o.id === orderId)) setOrderId(delivered[0]?.id ?? '');
  }, [delivered, orderId]);
  useEffect(() => {
    if (order && !order.lines.some((l) => l.sku === sku)) setSku(order.lines[0]?.sku ?? '');
  }, [order, sku]);
  const line = order?.lines.find((l) => l.sku === sku);
  const maxQty = line?.qty ?? 1;

  const rmas = state.rmas.filter((r) => r.wh === nav.wh && (filter === 'all' || ['requested', 'approved', 'received'].includes(r.status)));

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <Panel title={t('returns.newTitle')} subtitle={t('returns.newSubtitle')}>
        {delivered.length === 0 ? (
          <Empty>{t('returns.noDelivered')}</Empty>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!order || !line || qty < 1 || qty > maxQty) return;
              dispatch({
                type: 'rma.create',
                rma: { wh: nav.wh, order: order.id, client: order.client, customer: order.customer, sku, qty, reason, comments: comments.trim().slice(0, 300), date: today },
                at: now(),
              });
              notify(t('returns.created', { order: order.id }));
              setComments('');
              setQty(1);
            }}
          >
            <Field label={t('returns.order')}>
              <select className={selectCls} value={orderId} onChange={(e) => setOrderId(e.target.value)}>
                {delivered.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id} · {o.customer} · {CITY_BY_ID[o.city]?.name}
                  </option>
                ))}
              </select>
            </Field>
            {order && <p className="text-xs text-secondary-500">{t('returns.clientIs', { client: CLIENT_BY_ID[order.client].name, date: order.deliveredAt ? fmtDate(order.deliveredAt.slice(0, 10), lang) : '—' })}</p>}
            <Field label={t('returns.product')}>
              <select className={selectCls} value={sku} onChange={(e) => setSku(e.target.value)}>
                {order?.lines.map((l) => (
                  <option key={l.sku} value={l.sku}>
                    {name(l.sku)} ({l.sku}) × {l.qty}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('returns.qty', { max: maxQty })}>
                <input type="number" min={1} max={maxQty} className={inputCls} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value) || 1)))} />
              </Field>
              <Field label={t('returns.reason')}>
                <select className={selectCls} value={reason} onChange={(e) => setReason(e.target.value as RmaReason)}>
                  {REASONS.map((r) => (
                    <option key={r} value={r}>
                      {t(`returns.reasons.${r}`)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label={t('returns.comments')}>
              <textarea className={inputCls} rows={3} value={comments} onChange={(e) => setComments(e.target.value)} placeholder={t('returns.commentsPh')} maxLength={300} />
            </Field>
            <Button type="submit" fullWidth disabled={!order}>
              {t('returns.create')}
            </Button>
            <SimNote>{t('returns.formNote')}</SimNote>
          </form>
        )}
      </Panel>

      <Panel
        title={t('returns.listTitle')}
        className="xl:col-span-2"
        actions={
          <select className={`${baseInputCls} w-40 pr-9`} value={filter} onChange={(e) => setFilter(e.target.value as 'open' | 'all')} aria-label={t('returns.filter')}>
            <option value="open">{t('returns.filterOpen')}</option>
            <option value="all">{t('returns.filterAll')}</option>
          </select>
        }
      >
        {rmas.length === 0 ? (
          <Empty>{t('returns.none')}</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <th className={thCls}>{t('returns.rma')}</th>
                  <th className={thCls}>{t('returns.who')}</th>
                  <th className={thCls}>{t('returns.product')}</th>
                  <th className={thCls}>{t('returns.reason')}</th>
                  <th className={thCls}>{t('orders.status')}</th>
                  <th className={thCls}>{t('returns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {rmas.map((r) => (
                  <tr key={r.id} className="border-b border-secondary-100 align-top dark:border-secondary-800">
                    <td className={tdCls}>
                      <div className="font-mono text-xs font-semibold">{r.id}</div>
                      <div className="text-xs text-secondary-500">{fmtDate(r.date, lang)}</div>
                      <div className="font-mono text-xs text-secondary-500">{r.order}</div>
                    </td>
                    <td className={`${tdCls} text-xs`}>
                      <div>{r.customer}</div>
                      <div className="text-secondary-500">{CLIENT_BY_ID[r.client].name}</div>
                    </td>
                    <td className={`${tdCls} text-xs`}>
                      {name(r.sku)} × {r.qty}
                    </td>
                    <td className={`${tdCls} text-xs`}>
                      <div>{t(`returns.reasons.${r.reason}`)}</div>
                      {(r.comments || r.commentsKey) && <div className="text-secondary-500">“{r.commentsKey ? t(`returns.seedComments.${r.commentsKey}`) : r.comments}”</div>}
                    </td>
                    <td className={tdCls}>
                      <Pill tone={TONE[r.status]}>{t(`returns.statuses.${r.status}`)}</Pill>
                      {r.disposition && <div className="mt-1 text-xs text-secondary-500">{t(`returns.dispositions.${r.disposition}`)}</div>}
                      {r.rejectReason && <div className="mt-1 text-xs text-red-600">{t(`returns.rejectReasons.${r.rejectReason}`)}</div>}
                    </td>
                    <td className={tdCls}>
                      {r.status === 'requested' && rejecting !== r.id && (
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => {
                              dispatch({ type: 'rma.decide', id: r.id, approve: true, at: now() });
                              notify(t('returns.approved', { id: r.id }));
                            }}
                          >
                            {t('returns.approve')}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRejecting(r.id)}>
                            {t('returns.reject')}
                          </Button>
                        </div>
                      )}
                      {r.status === 'requested' && rejecting === r.id && (
                        <div className="space-y-1.5">
                          <select className={selectCls} value={rejectReason} onChange={(e) => setRejectReason(e.target.value as (typeof REJECT)[number])} aria-label={t('returns.rejectReason')}>
                            {REJECT.map((x) => (
                              <option key={x} value={x}>
                                {t(`returns.rejectReasons.${x}`)}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                dispatch({ type: 'rma.decide', id: r.id, approve: false, reason: rejectReason, at: now() });
                                setRejecting(null);
                                notify(t('returns.rejected', { id: r.id }), 'warn');
                              }}
                            >
                              {t('returns.confirmReject')}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setRejecting(null)}>
                              {t('common.cancel')}
                            </Button>
                          </div>
                        </div>
                      )}
                      {r.status === 'approved' && (
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => {
                              dispatch({ type: 'rma.receive', id: r.id, disposition: 'restock', at: now() });
                              notify(t('returns.restocked', { id: r.id }));
                            }}
                          >
                            {t('returns.restock')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              dispatch({ type: 'rma.receive', id: r.id, disposition: 'quarantine', at: now() });
                              notify(t('returns.quarantined', { id: r.id }), 'warn');
                            }}
                          >
                            {t('returns.toQuarantine')}
                          </Button>
                        </div>
                      )}
                      {r.status === 'received' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            dispatch({ type: 'rma.close', id: r.id, at: now() });
                            notify(t('returns.closed', { id: r.id }));
                          }}
                        >
                          {t('returns.close')}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <SimNote className="mt-3">{t('returns.note')}</SimNote>
      </Panel>
    </div>
  );
}
