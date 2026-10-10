'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { apiRequest } from '@/lib/demo-system';
import { describeError, formatDateTime, refreshPanelCounts } from '@/lib/portal';
import { useSessionUser } from '@/hooks/useSessionUser';
import {
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CheckCircleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  InboxArrowDownIcon,
} from '@heroicons/react/24/outline';

/** Valores del campo "¿Cuándo quieres empezar?" de /contact (Contact.plazo). */
const TIMELINES = ['now', '1m', '3m', 'open'];
const STATUS_FILTERS = ['all', 'new', 'read', 'responded', 'discarded'] as const;
const SOURCES = ['all', 'contact-form', 'demo-request', 'demo-rag'] as const;

type ContactStatus = 'new' | 'read' | 'responded';

interface ContactRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service: string;
  budget?: string;
  plazo?: string | null;
  message: string;
  status: ContactStatus;
  source: 'contact-form' | 'demo-request' | 'demo-rag';
  demoRequest: { id: string; codigo: string; estado: string } | null;
  descartado: { motivo: string; fecha: string } | null;
  consentimiento: { aceptado: boolean; fecha: string | null; versionPolitica: string | null } | null;
  anonimizado: boolean;
  createdAt: string;
}

const SOURCE_VARIANT: Record<ContactRow['source'], 'info' | 'warning' | 'primary'> = {
  'contact-form': 'info',
  'demo-request': 'warning',
  'demo-rag': 'primary',
};

export default function AdminContactsPage() {
  const t = useTranslations('adminContacts');
  const tc = useTranslations('portalCommon');
  // Mismos textos del formulario de /contact para el plazo.
  const tContact = useTranslations('contactPage');
  const tPrivacy = useTranslations('adminPrivacy');
  const locale = useLocale();
  const { state } = useSessionUser();
  const isAdmin = state.status === 'ok' && state.user.role === 'admin';
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('all');
  const [sourceFilter, setSourceFilter] = useState<(typeof SOURCES)[number]>('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const errorTexts = { network: tc('errors.network'), rateLimited: tc('errors.rateLimited'), server: tc('errors.server'), generic: tc('errors.generic') };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams({ status: statusFilter, source: sourceFilter });
      if (query) params.set('q', query);
      const data = await apiRequest<ContactRow[]>(`/admin/contacts?${params}`);
      setContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      setContacts([]);
      setLoadError(describeError(err, locale, errorTexts));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sourceFilter, query, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  // El detalle sale de la lista (por id): al cambiar el estado se ve al instante.
  const selected = contacts.find((c) => c.id === selectedId) ?? null;

  const handleUpdateStatus = async (contactId: string, newStatus: ContactStatus) => {
    setUpdatingStatus(contactId);
    try {
      await apiRequest(`/admin/contacts/${contactId}/status`, { method: 'PATCH', body: { status: newStatus } });
      setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, status: newStatus } : c)));
      toast.success(t('statusUpdated'));
      refreshPanelCounts();
    } catch (err) {
      toast.error(describeError(err, locale, errorTexts));
    } finally {
      setUpdatingStatus(null);
    }
  };

  const statusBadge = (status: ContactStatus) => (
    <Badge variant={status === 'new' ? 'primary' : 'secondary'} size="sm" data-contact-status={status}>
      {t(`status.${status}`)}
    </Badge>
  );
  const sourceBadge = (source: ContactRow['source']) => (
    <Badge variant={SOURCE_VARIANT[source] ?? 'info'} size="sm" data-source={source}>
      {t(`sources.${source}`)}
    </Badge>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">{t('title')}</h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">{t('subtitle')}</p>
        </div>

        <Card variant="bordered">
          <CardContent className="p-4 space-y-4">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setQuery(search.trim());
              }}
            >
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  aria-label={t('searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white"
                />
              </div>
              <Button type="submit" size="sm">
                {tc('search')}
              </Button>
            </form>
            <div className="flex gap-2 flex-wrap">
              {STATUS_FILTERS.map((s) => (
                <Button key={s} variant={statusFilter === s ? 'primary' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} aria-pressed={statusFilter === s}>
                  {t(`filters.${s}`)}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">{t('sourceLabel')}:</span>
              {SOURCES.map((s) => (
                <Button key={s} variant={sourceFilter === s ? 'primary' : 'outline'} size="sm" onClick={() => setSourceFilter(s)} aria-pressed={sourceFilter === s}>
                  {s === 'all' ? t('filters.all') : t(`sources.${s}`)}
                </Button>
              ))}
            </div>
            {statusFilter === 'discarded' && <p className="text-xs text-secondary-500">{t('discardedHelp')}</p>}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card variant="bordered">
              <CardHeader>
                <CardTitle>
                  {t('contactRequests')} ({contacts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : loadError ? (
                  <div className="text-center py-12" role="alert">
                    <p className="text-red-600 dark:text-red-400 mb-4">{loadError}</p>
                    <Button variant="outline" onClick={() => void load()}>
                      {tc('retry')}
                    </Button>
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="text-center py-12">
                    <EnvelopeIcon className="h-12 w-12 mx-auto text-secondary-400 mb-4" />
                    <p className="text-secondary-600 dark:text-secondary-400">{t('noContacts')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contacts.map((contact) => (
                      <button
                        type="button"
                        key={contact.id}
                        onClick={() => setSelectedId(contact.id)}
                        aria-pressed={selectedId === contact.id}
                        className={`w-full text-left p-4 rounded-lg border transition-colors ${
                          selectedId === contact.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                            : 'border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-900'
                        }`}
                        data-contact={contact.email}
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold text-secondary-900 dark:text-white">{contact.name}</h3>
                          {statusBadge(contact.status)}
                          {sourceBadge(contact.source)}
                        </div>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400 break-all">{contact.email}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-secondary-500 mt-2">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            {formatDateTime(contact.createdAt, locale)}
                          </span>
                          {contact.phone && (
                            <span className="flex items-center gap-1">
                              <PhoneIcon className="h-4 w-4" />
                              {contact.phone}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-2 line-clamp-1">{contact.service}</p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card variant="bordered">
              <CardHeader>
                <CardTitle>{t('contactDetail')}</CardTitle>
              </CardHeader>
              <CardContent>
                {selected ? (
                  <div className="space-y-4" data-testid="contact-detail">
                    <div>
                      <h3 className="font-bold text-lg text-secondary-900 dark:text-white mb-2">{selected.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        {statusBadge(selected.status)}
                        {sourceBadge(selected.source)}
                      </div>
                      {selected.descartado && <p className="text-xs text-red-600 mt-2">{t('discardedAs', { reason: selected.descartado.motivo })}</p>}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <EnvelopeIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-secondary-500">{t('email')}</p>
                          <p className="text-sm text-secondary-900 dark:text-white break-all">{selected.email}</p>
                        </div>
                      </div>
                      {selected.phone && (
                        <div className="flex items-start gap-2">
                          <PhoneIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-secondary-500">{t('phone')}</p>
                            <p className="text-sm text-secondary-900 dark:text-white">{selected.phone}</p>
                          </div>
                        </div>
                      )}
                      {selected.company && (
                        <div className="flex items-start gap-2">
                          <BuildingOfficeIcon className="h-5 w-5 text-secondary-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-secondary-500">{t('company')}</p>
                            <p className="text-sm text-secondary-900 dark:text-white">{selected.company}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700">
                      <p className="text-xs text-secondary-500 mb-1">{t('service')}</p>
                      <p className="text-sm font-medium text-secondary-900 dark:text-white">{selected.service}</p>
                    </div>

                    {selected.demoRequest && (
                      <Link
                        href={`/admin/solicitudes/${selected.demoRequest.id}`}
                        className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-500"
                        data-testid="contact-request-link"
                      >
                        <InboxArrowDownIcon className="h-4 w-4" />
                        {t('openRequest', { code: selected.demoRequest.codigo })}
                      </Link>
                    )}

                    {selected.budget && (
                      <div>
                        <p className="text-xs text-secondary-500 mb-1">{t('budget')}</p>
                        <p className="text-sm font-medium text-secondary-900 dark:text-white">{selected.budget}</p>
                      </div>
                    )}

                    {selected.plazo && (
                      <div>
                        <p className="text-xs text-secondary-500 mb-1">{tContact('form.timeline')}</p>
                        <p className="text-sm font-medium text-secondary-900 dark:text-white">
                          {TIMELINES.includes(selected.plazo) ? tContact(`form.timelineOptions.${selected.plazo}`) : selected.plazo}
                        </p>
                      </div>
                    )}

                    {/* Prueba de la autorización de datos (Ley 1581) que guardó el servidor. */}
                    <div data-testid="contact-consent">
                      <p className="text-xs text-secondary-500 mb-1">{tPrivacy('contactConsent.label')}</p>
                      <p className="text-sm text-secondary-900 dark:text-white">
                        {selected.consentimiento?.aceptado
                          ? tPrivacy('contactConsent.given', {
                              date: formatDateTime(selected.consentimiento.fecha, locale),
                              version: selected.consentimiento.versionPolitica ?? '—',
                            })
                          : tPrivacy('contactConsent.none')}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-secondary-500 mb-2">{t('message')}</p>
                      <p className="text-sm text-secondary-900 dark:text-white whitespace-pre-wrap break-words">{selected.message}</p>
                    </div>

                    <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700">
                      <p className="text-xs text-secondary-500 mb-1">{t('contactDate')}</p>
                      <p className="text-sm text-secondary-900 dark:text-white">{formatDateTime(selected.createdAt, locale)}</p>
                    </div>

                    {!selected.descartado && (
                      <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700 space-y-2">
                        <p className="text-xs text-secondary-500 mb-2">{t('updateStatus')}</p>
                        <div className="flex flex-col gap-2">
                          {(['new', 'read', 'responded'] as const).map((s) => (
                            <Button
                              key={s}
                              variant={selected.status === s ? 'primary' : 'outline'}
                              size="sm"
                              fullWidth
                              aria-pressed={selected.status === s}
                              onClick={() => void handleUpdateStatus(selected.id, s)}
                              disabled={updatingStatus === selected.id || selected.status === s}
                            >
                              {s === 'responded' ? <CheckCircleIcon className="h-4 w-4 mr-2" /> : <EyeIcon className="h-4 w-4 mr-2" />}
                              {t(`markAs.${s}`)}
                            </Button>
                          ))}
                        </div>
                        <p className="text-xs text-secondary-500">{t('statusNote')}</p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700">
                      {isAdmin ? (
                        <Link
                          href={`/admin/privacidad?email=${encodeURIComponent(selected.email)}`}
                          className="inline-flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400 hover:underline"
                          data-testid="contact-privacy-link"
                        >
                          <ShieldCheckIcon className="h-4 w-4" />
                          {t('privacyLink')}
                        </Link>
                      ) : (
                        <p className="text-xs text-secondary-500">{t('privacyAdminOnly')}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <EnvelopeIcon className="h-12 w-12 mx-auto text-secondary-400 mb-4" />
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('selectContact')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
