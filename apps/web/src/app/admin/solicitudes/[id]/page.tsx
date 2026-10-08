'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
  EnvelopeIcon,
  GlobeAmericasIcon,
  KeyIcon,
  PhoneIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { FaWhatsapp } from 'react-icons/fa';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DemoAccessBadge from '@/components/demo/DemoAccessBadge';
import {
  ActivationLinkPanel,
  type AdminDemoRequest,
  type AdminGrant,
  DaysPicker,
  type GrantResult,
  GrantStatusBadge,
  RequestStatusBadge,
  apiErrorMessage,
  useStaffRole,
} from '@/components/admin/demos/shared';
import { type AdminCatalogItem, apiRequest, demoName, formatDate, whatsappLink } from '@/lib/demo-system';
import { cn } from '@/lib/utils';

interface Detail {
  request: AdminDemoRequest;
  demos: Array<{ slug: string; nombre: string; accessMode: AdminCatalogItem['accessMode'] | null; activo: boolean }>;
  cuenta: { id: string; email: string; name: string; role: string; accountStatus: string; company: string | null; creadaEn: string; ultimoIngreso: string | null } | null;
  grants: AdminGrant[];
  historial: Array<{ accion: string; actorEmail: string | null; actorRol: string | null; detalle: Record<string, unknown> | null; fecha: string }>;
}

const REJECT_REASONS = ['spam', 'fuera_de_perfil', 'datos_invalidos', 'duplicada', 'otro'] as const;

function Notice({ value, t }: { value: boolean | null; t: (key: string) => string }) {
  if (value === true) return <span className="text-green-700 dark:text-green-400">{t('notice.sent')}</span>;
  if (value === false) return <span className="text-secondary-500">{t('notice.notSent')}</span>;
  return <span className="text-secondary-400">—</span>;
}

export default function AdminDemoRequestDetailPage() {
  const t = useTranslations('adminDemos');
  const locale = useLocale();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const role = useStaffRole();
  const canManage = role === 'admin' || role === 'sales';
  const isAdmin = role === 'admin';

  const [detail, setDetail] = useState<Detail | null>(null);
  const [loadError, setLoadError] = useState('');
  const [catalog, setCatalog] = useState<AdminCatalogItem[]>([]);
  const [tab, setTab] = useState<'approve' | 'reject'>('approve');
  const [selected, setSelected] = useState<string[]>([]);
  const [extraDemo, setExtraDemo] = useState('');
  const [days, setDays] = useState(14);
  const [daysTouched, setDaysTouched] = useState(false);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [reasonKey, setReasonKey] = useState<(typeof REJECT_REASONS)[number] | ''>('');
  const [reasonText, setReasonText] = useState('');
  const [notify, setNotify] = useState(false);
  const [rejectMessage, setRejectMessage] = useState('');
  const [newNote, setNewNote] = useState('');
  const [busy, setBusy] = useState<'' | 'approve' | 'reject' | 'review' | 'note' | 'resend'>('');
  const [actionError, setActionError] = useState('');
  const [result, setResult] = useState<GrantResult | null>(null);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const data = await apiRequest<Detail>(`/admin/demo-requests/${encodeURIComponent(id)}`);
      setDetail(data);
      setSelected((current) => (current.length ? current : data.request.demos));
    } catch (err) {
      setLoadError(apiErrorMessage(err, locale, t('loadError')));
    }
  }, [id, locale, t]);

  useEffect(() => {
    load();
    apiRequest<AdminCatalogItem[]>('/admin/demo-catalog')
      .then((items) => setCatalog(Array.isArray(items) ? items : []))
      .catch(() => undefined);
  }, [load]);

  const catalogBySlug = useMemo(() => new Map(catalog.map((c) => [c.slug, c])), [catalog]);
  const nameOf = useCallback(
    (slug: string) => demoName(catalogBySlug.get(slug) ?? detail?.demos.find((d) => d.slug === slug) ?? null, locale, slug),
    [catalogBySlug, detail, locale],
  );
  const modeOf = (slug: string) => catalogBySlug.get(slug)?.accessMode ?? detail?.demos.find((d) => d.slug === slug)?.accessMode ?? null;

  // Vigencia propuesta: la mayor duración por defecto de las demos elegidas.
  useEffect(() => {
    if (daysTouched || selected.length === 0 || catalog.length === 0) return;
    const max = Math.max(...selected.map((s) => catalogBySlug.get(s)?.duracionDiasPorDefecto ?? 14));
    setDays(Number.isFinite(max) ? max : 14);
  }, [selected, catalog, catalogBySlug, daysTouched]);

  if (loadError) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Link href="/admin/solicitudes" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline">
            <ArrowLeftIcon className="h-4 w-4" /> {t('requests.title')}
          </Link>
          <p role="alert" className="text-red-600 dark:text-red-400">
            {loadError}
          </p>
        </div>
      </AdminLayout>
    );
  }
  if (!detail) {
    return (
      <AdminLayout>
        <p className="text-secondary-500">{t('loading')}</p>
      </AdminLayout>
    );
  }

  const r = detail.request;
  const open = r.estado === 'pendiente' || r.estado === 'en_revision';
  const privateBlocked = selected.some((s) => modeOf(s) === 'privado') && !isAdmin;
  const addable = catalog.filter((c) => !selected.includes(c.slug));
  const greetingWa = whatsappLink(r.telefono, t('detail.whatsappGreeting', { name: r.nombre.split(' ')[0], code: r.codigo }));

  const run = async (kind: typeof busy, fn: () => Promise<void>) => {
    setBusy(kind);
    setActionError('');
    try {
      await fn();
    } catch (err) {
      setActionError(apiErrorMessage(err, locale, t('actionError')));
    } finally {
      setBusy('');
    }
  };

  const approve = () =>
    run('approve', async () => {
      const data = await apiRequest<GrantResult>(`/admin/demo-requests/${id}/approve`, {
        method: 'POST',
        body: { demos: selected, dias: days, nota: note.trim() || undefined, mensaje: message.trim() || undefined },
      });
      setResult(data);
      toast.success(t('detail.approved'));
      await load();
    });

  const reject = () =>
    run('reject', async () => {
      const motivo = [reasonKey ? t(`rejectReasons.${reasonKey}`) : '', reasonText.trim()].filter(Boolean).join(': ');
      await apiRequest(`/admin/demo-requests/${id}/reject`, {
        method: 'POST',
        body: { motivo: reasonKey === 'spam' ? 'spam' : motivo, notificar: reasonKey !== 'spam' && notify, mensaje: rejectMessage.trim() || undefined },
      });
      toast.success(t('detail.rejected'));
      await load();
    });

  const markReview = () =>
    run('review', async () => {
      await apiRequest(`/admin/demo-requests/${id}`, { method: 'PATCH', body: { estado: 'en_revision' } });
      await load();
    });

  const addNote = () =>
    run('note', async () => {
      await apiRequest(`/admin/demo-requests/${id}`, { method: 'PATCH', body: { nota: newNote.trim() } });
      setNewNote('');
      await load();
    });

  const resend = () =>
    run('resend', async () => {
      const data = await apiRequest<GrantResult>(`/admin/demo-requests/${id}/resend-activation`, { method: 'POST' });
      setResult(data);
      toast.success(t('detail.linkIssued'));
    });

  const resultDemoNames = (result?.grants?.map((g) => g.demoSlug) ?? r.decision?.demos ?? r.demos).map(nameOf);
  const accountPending = detail.cuenta?.accountStatus === 'invitado';
  const textarea =
    'w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white text-sm';

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Link href="/admin/solicitudes" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline">
          <ArrowLeftIcon className="h-4 w-4" /> {t('requests.title')}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold font-mono text-secondary-900 dark:text-white">{r.codigo}</h1>
          <RequestStatusBadge estado={r.estado} />
          <span className="text-sm text-secondary-500">{t('detail.received', { date: formatDate(r.createdAt, locale, true) })}</span>
          {r.reenvios > 0 && <span className="text-sm text-secondary-500">· {t('detail.resubmitted', { count: r.reenvios })}</span>}
          <div className="ml-auto flex gap-2">
            {canManage && r.estado === 'pendiente' && (
              <Button size="sm" variant="outline" onClick={markReview} isLoading={busy === 'review'}>
                {t('detail.markReview')}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={load} aria-label={t('refresh')}>
              <ArrowPathIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {actionError && (
          <p role="alert" className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
            {actionError}
          </p>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Columna izquierda: datos de la solicitud */}
          <div className="xl:col-span-3 space-y-6">
            <Card variant="bordered">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center font-bold text-primary-700 dark:text-primary-300">
                    {r.nombre.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-secondary-900 dark:text-white">{r.nombre}</h2>
                    <p className="text-secondary-600 dark:text-secondary-400">
                      {[r.cargo, r.empresa].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex gap-2">
                    <EnvelopeIcon className="h-5 w-5 text-secondary-400 flex-shrink-0" />
                    <div>
                      <dt className="text-secondary-500">{t('detail.email')}</dt>
                      <dd>
                        <a href={`mailto:${r.email}`} className="text-primary-600 hover:underline break-all">
                          {r.email}
                        </a>
                      </dd>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <PhoneIcon className="h-5 w-5 text-secondary-400 flex-shrink-0" />
                    <div>
                      <dt className="text-secondary-500">{t('detail.phone')}</dt>
                      <dd className="text-secondary-900 dark:text-white">
                        {r.telefono ?? '—'}
                        {greetingWa && (
                          <a href={greetingWa} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 text-green-700 dark:text-green-400 hover:underline">
                            <FaWhatsapp className="h-4 w-4" /> {t('detail.whatsapp')}
                          </a>
                        )}
                      </dd>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <GlobeAmericasIcon className="h-5 w-5 text-secondary-400 flex-shrink-0" />
                    <div>
                      <dt className="text-secondary-500">{t('detail.country')}</dt>
                      <dd className="text-secondary-900 dark:text-white">{r.pais}</dd>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <UserGroupIcon className="h-5 w-5 text-secondary-400 flex-shrink-0" />
                    <div>
                      <dt className="text-secondary-500">{t('detail.size')}</dt>
                      <dd className="text-secondary-900 dark:text-white">{t('people', { size: r.tamanoEmpresa })}</dd>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:col-span-2">
                    <BuildingOfficeIcon className="h-5 w-5 text-secondary-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <dt className="text-secondary-500">{t('detail.origin')}</dt>
                      <dd className="text-secondary-900 dark:text-white break-all">
                        {r.origen?.pagina ?? '—'}
                        {r.origen?.referrer ? ` · ${r.origen.referrer}` : ''}
                        {r.origen?.utm && Object.keys(r.origen.utm).length > 0 && (
                          <span className="ml-2 font-mono text-xs text-secondary-500">
                            {Object.entries(r.origen.utm)
                              .map(([k, v]) => `utm_${k}=${v}`)
                              .join(' ')}
                          </span>
                        )}
                      </dd>
                    </div>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="text-lg">{t('detail.useCase')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-secondary-800 dark:text-secondary-200 bg-secondary-50 dark:bg-secondary-900 rounded-lg p-4">{r.casoDeUso}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {r.demos.map((slug) => (
                    <span key={slug} className="inline-flex items-center gap-1 rounded-full bg-secondary-100 dark:bg-secondary-800 px-3 py-1 text-sm">
                      {nameOf(slug)}
                      {modeOf(slug) && modeOf(slug) !== 'publico' && <DemoAccessBadge mode={modeOf(slug)!} />}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card variant="bordered">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheckIcon className="h-5 w-5 text-green-600" />
                    {t('detail.consent')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-secondary-700 dark:text-secondary-300 space-y-1">
                  <p>
                    {r.consentimiento.aceptado
                      ? t('detail.consentGiven', {
                          date: formatDate(r.consentimiento.fecha, locale, true),
                          version: r.consentimiento.versionPolitica ?? '—',
                        })
                      : t('detail.consentMissing')}
                  </p>
                </CardContent>
              </Card>
              <Card variant="bordered">
                <CardHeader>
                  <CardTitle className="text-lg">{t('detail.notices')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="text-sm space-y-1">
                    <div className="flex justify-between gap-2">
                      <dt className="text-secondary-500">{t('detail.noticeTeamEmail')}</dt>
                      <dd>
                        <Notice value={r.notificaciones.equipoEmail} t={t} />
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-secondary-500">{t('detail.noticeTeamWhatsapp')}</dt>
                      <dd>
                        <Notice value={r.notificaciones.equipoWhatsapp} t={t} />
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-secondary-500">{t('detail.noticeAck')}</dt>
                      <dd>
                        <Notice value={r.notificaciones.acuseSolicitante} t={t} />
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-secondary-500">{t('detail.noticeDecision')}</dt>
                      <dd>
                        <Notice value={r.notificaciones.decisionSolicitante} t={t} />
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>

            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />
                  {t('detail.notes')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {r.notas.length === 0 ? (
                  <p className="text-sm text-secondary-500">{t('detail.noNotes')}</p>
                ) : (
                  <ul className="space-y-3">
                    {r.notas
                      .slice()
                      .reverse()
                      .map((n, i) => (
                        <li key={i} className="text-sm border-l-2 border-secondary-200 dark:border-secondary-700 pl-3">
                          <p className="text-secondary-800 dark:text-secondary-200 whitespace-pre-wrap">{n.texto}</p>
                          <p className="text-xs text-secondary-500 mt-1">
                            {n.autorEmail ?? t('detail.byRequester')} · {formatDate(n.fecha, locale, true)}
                          </p>
                        </li>
                      ))}
                  </ul>
                )}
                {canManage && (
                  <div className="flex gap-2">
                    <label htmlFor="new-note" className="sr-only">
                      {t('detail.addNote')}
                    </label>
                    <input
                      id="new-note"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder={t('detail.addNotePlaceholder')}
                      maxLength={2000}
                      className="flex-1 px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white text-sm"
                    />
                    <Button size="sm" onClick={addNote} disabled={!newNote.trim()} isLoading={busy === 'note'}>
                      {t('detail.addNote')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  {t('detail.history')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {detail.historial.length === 0 ? (
                  <p className="text-sm text-secondary-500">{t('detail.noHistory')}</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {detail.historial.map((h, i) => (
                      <li key={i} className="flex flex-wrap gap-x-2 text-secondary-700 dark:text-secondary-300">
                        <span className="text-secondary-500 whitespace-nowrap">{formatDate(h.fecha, locale, true)}</span>
                        <span className="font-medium">{t.has(`audit.${h.accion}`) ? t(`audit.${h.accion}`) : h.accion}</span>
                        {h.actorEmail && <span className="text-secondary-500">· {h.actorEmail}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha: decisión */}
          <div className="xl:col-span-2 space-y-6">
            {result && <ActivationLinkPanel result={result} phone={r.telefono} demoNames={resultDemoNames} />}

            {open && canManage && (
              <Card variant="bordered" className="overflow-hidden">
                <div className="grid grid-cols-2 border-b border-secondary-200 dark:border-secondary-800" role="tablist">
                  {(['approve', 'reject'] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      role="tab"
                      aria-selected={tab === k}
                      onClick={() => setTab(k)}
                      className={cn(
                        'flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2',
                        tab === k
                          ? k === 'approve'
                            ? 'border-green-600 text-green-700 dark:text-green-400'
                            : 'border-red-600 text-red-700 dark:text-red-400'
                          : 'border-transparent text-secondary-500',
                      )}
                    >
                      {k === 'approve' ? <CheckCircleIcon className="h-5 w-5" /> : <XCircleIcon className="h-5 w-5" />}
                      {t(`detail.${k}Tab`)}
                    </button>
                  ))}
                </div>
                <CardContent className="p-5 space-y-5">
                  {tab === 'approve' ? (
                    <>
                      <div>
                        <p className="text-sm font-semibold text-secondary-900 dark:text-white mb-2">{t('detail.demosToGrant')}</p>
                        <ul className="space-y-2">
                          {selected.concat(r.demos.filter((s) => !selected.includes(s))).map((slug) => {
                            const mode = modeOf(slug);
                            const checked = selected.includes(slug);
                            const locked = mode === 'privado' && !isAdmin;
                            return (
                              <li key={slug}>
                                <label
                                  className={cn(
                                    'flex items-center gap-3 p-3 rounded-lg border',
                                    checked ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/40' : 'border-secondary-200 dark:border-secondary-800',
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => setSelected((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]))}
                                    className="h-4 w-4 rounded text-primary-600"
                                    data-approve-demo={slug}
                                  />
                                  <span className="flex-1 min-w-0">
                                    <span className="block text-sm font-medium text-secondary-900 dark:text-white">{nameOf(slug)}</span>
                                    <span className="block text-xs text-secondary-500">/demo/{slug}</span>
                                    {locked && <span className="block text-xs text-amber-700 dark:text-amber-400">{t('detail.privateAdminOnly')}</span>}
                                  </span>
                                  {mode && <DemoAccessBadge mode={mode} activo={catalogBySlug.get(slug)?.activo !== false} />}
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                        {addable.length > 0 && (
                          <div className="mt-2 flex gap-2">
                            <label htmlFor="extra-demo" className="sr-only">
                              {t('detail.addDemo')}
                            </label>
                            <select
                              id="extra-demo"
                              value={extraDemo}
                              onChange={(e) => setExtraDemo(e.target.value)}
                              className="flex-1 px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-sm text-secondary-900 dark:text-white"
                            >
                              <option value="">{t('detail.addDemo')}</option>
                              {addable.map((c) => (
                                <option key={c.slug} value={c.slug}>
                                  {demoName(c, locale)}
                                </option>
                              ))}
                            </select>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!extraDemo || selected.length >= 10}
                              onClick={() => {
                                setSelected((cur) => [...cur, extraDemo]);
                                setExtraDemo('');
                              }}
                            >
                              {t('add')}
                            </Button>
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-secondary-900 dark:text-white mb-2">{t('detail.validity')}</p>
                        <DaysPicker
                          id="approve-days"
                          value={days}
                          onChange={(d) => {
                            setDaysTouched(true);
                            setDays(d);
                          }}
                        />
                        <p className="mt-1 text-xs text-secondary-500">
                          {t('detail.expiresOn', { date: formatDate(new Date(Date.now() + days * 86400000), locale) })}
                        </p>
                      </div>

                      <div>
                        <label htmlFor="approve-note" className="block text-sm font-semibold text-secondary-900 dark:text-white mb-1">
                          {t('detail.internalNote')} <span className="font-normal text-secondary-500">{t('detail.internalNoteHint')}</span>
                        </label>
                        <textarea id="approve-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} className={textarea} />
                      </div>
                      <div>
                        <label htmlFor="approve-message" className="block text-sm font-semibold text-secondary-900 dark:text-white mb-1">
                          {t('detail.messageToProspect')} <span className="font-normal text-secondary-500">{t('detail.messageHint')}</span>
                        </label>
                        <textarea id="approve-message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} className={textarea} />
                      </div>

                      <p className="text-xs text-secondary-600 dark:text-secondary-400 bg-secondary-50 dark:bg-secondary-900 rounded-lg p-3">
                        {detail.cuenta ? t('detail.approveSummaryExisting', { count: selected.length, days }) : t('detail.approveSummaryNew', { count: selected.length, days })}
                      </p>
                      {privateBlocked && <p className="text-sm text-amber-700 dark:text-amber-400">{t('detail.privateAdminOnly')}</p>}
                      <Button
                        fullWidth
                        className="bg-green-600 hover:bg-green-700"
                        onClick={approve}
                        isLoading={busy === 'approve'}
                        disabled={selected.length === 0 || privateBlocked || busy !== ''}
                        data-testid="approve-button"
                      >
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        {t('detail.approveButton')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-semibold text-secondary-900 dark:text-white mb-2">{t('detail.rejectReason')}</p>
                        <div className="flex flex-wrap gap-2">
                          {REJECT_REASONS.map((k) => (
                            <button
                              key={k}
                              type="button"
                              aria-pressed={reasonKey === k}
                              onClick={() => setReasonKey(k)}
                              className={cn(
                                'px-3 py-1.5 rounded-full border text-sm',
                                reasonKey === k ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' : 'border-secondary-300 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300',
                              )}
                            >
                              {t(`rejectReasons.${k}`)}
                            </button>
                          ))}
                        </div>
                        <label htmlFor="reject-text" className="sr-only">
                          {t('detail.rejectDetail')}
                        </label>
                        <textarea
                          id="reject-text"
                          rows={2}
                          value={reasonText}
                          onChange={(e) => setReasonText(e.target.value)}
                          placeholder={t('detail.rejectDetail')}
                          maxLength={900}
                          className={cn(textarea, 'mt-2')}
                        />
                      </div>
                      <label className={cn('flex items-start gap-2 text-sm', reasonKey === 'spam' && 'opacity-50')}>
                        <input type="checkbox" checked={notify && reasonKey !== 'spam'} disabled={reasonKey === 'spam'} onChange={(e) => setNotify(e.target.checked)} className="mt-0.5 h-4 w-4 rounded" />
                        <span>
                          {t('detail.notify')}
                          <span className="block text-xs text-secondary-500">{t('detail.notifyHint')}</span>
                        </span>
                      </label>
                      {notify && reasonKey !== 'spam' && (
                        <div>
                          <label htmlFor="reject-message" className="block text-sm font-semibold mb-1">
                            {t('detail.rejectMessage')}
                          </label>
                          <textarea id="reject-message" rows={2} value={rejectMessage} onChange={(e) => setRejectMessage(e.target.value)} maxLength={2000} className={textarea} />
                        </div>
                      )}
                      <Button
                        fullWidth
                        variant="danger"
                        onClick={reject}
                        isLoading={busy === 'reject'}
                        disabled={!reasonKey || (reasonKey !== 'spam' && [t(`rejectReasons.${reasonKey}`), reasonText.trim()].join('').length < 3) || busy !== ''}
                      >
                        <XCircleIcon className="h-5 w-5 mr-2" />
                        {t('detail.rejectButton')}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {r.estado === 'rechazada' && (
              <Card variant="bordered">
                <CardContent className="p-5 text-sm">
                  <p className="font-semibold text-secondary-900 dark:text-white mb-1">{t('detail.rejectedTitle')}</p>
                  <p className="text-secondary-700 dark:text-secondary-300">{r.motivoRechazo ?? '—'}</p>
                  {r.revisadoEn && <p className="text-xs text-secondary-500 mt-2">{formatDate(r.revisadoEn, locale, true)}</p>}
                </CardContent>
              </Card>
            )}

            {(r.estado === 'aprobada' || detail.grants.length > 0) && (
              <Card variant="bordered">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <KeyIcon className="h-5 w-5" />
                    {t('detail.grantsTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {detail.cuenta && (
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      {t('detail.account', {
                        email: detail.cuenta.email,
                        status: t(`accountStatus.${detail.cuenta.accountStatus === 'invitado' ? 'invitado' : 'activo'}`),
                      })}
                    </p>
                  )}
                  <ul className="divide-y divide-secondary-200 dark:divide-secondary-800">
                    {detail.grants.map((g) => (
                      <li key={g.id} className="py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="font-medium text-secondary-900 dark:text-white">{demoName({ slug: g.demoSlug, nombre: g.demoNombre, nombreEn: g.demoNombreEn }, locale)}</span>
                        <span className="flex items-center gap-2">
                          <GrantStatusBadge grant={g} />
                          <span className="text-secondary-500">{formatDate(g.expiresAt, locale)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {canManage && accountPending && r.estado === 'aprobada' && (
                      <Button size="sm" variant="outline" onClick={resend} isLoading={busy === 'resend'}>
                        {t('detail.newLink')}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/admin/accesos?q=${encodeURIComponent(r.email)}`}>{t('detail.manageGrants')}</Link>
                    </Button>
                  </div>
                  {canManage && accountPending && <p className="text-xs text-secondary-500">{t('detail.newLinkHint')}</p>}
                </CardContent>
              </Card>
            )}

            {!canManage && role && <p className="text-sm text-secondary-500">{t('readOnly')}</p>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
