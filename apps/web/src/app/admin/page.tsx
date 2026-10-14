'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  BanknotesIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  ShoppingBagIcon,
  ArrowRightIcon,
  InboxArrowDownIcon,
  KeyIcon,
  ClockIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { type AdminDemoRequest, RequestStatusBadge } from '@/components/admin/demos/shared';
import { apiRequest, formatDate } from '@/lib/demo-system';

/**
 * Inicio del panel: solo datos reales del backend (solicitudes de demo,
 * accesos y contactos). Si un dato no carga, se muestra «—» en lugar de una
 * cifra inventada.
 */

interface RequestsSummary {
  items: AdminDemoRequest[];
  conteos: Record<'pendiente' | 'en_revision' | 'aprobada' | 'rechazada', number>;
}
interface GrantsSummary {
  conteos: Record<'activo' | 'por_vencer' | 'expirado' | 'revocado' | 'todos', number>;
}
interface ContactRow {
  id: string;
  name: string;
  email: string;
  service?: string;
  status: string;
  source?: string;
  createdAt: string;
}

const QUICK_LINKS = [
  { href: '/admin/solicitudes', key: 'demoRequests', icon: InboxArrowDownIcon, color: 'bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400' },
  { href: '/admin/accesos', key: 'demoGrants', icon: KeyIcon, color: 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400' },
  { href: '/admin/catalogo-demos', key: 'demoCatalog', icon: Squares2X2Icon, color: 'bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400' },
  { href: '/admin/contacts', key: 'contacts', icon: EnvelopeIcon, color: 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400' },
  { href: '/admin/users', key: 'users', icon: UserGroupIcon, color: 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400' },
  { href: '/admin/orders', key: 'orders', icon: ShoppingBagIcon, color: 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400' },
  { href: '/admin/invoices', key: 'invoices', icon: BanknotesIcon, color: 'bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400' },
  { href: '/admin/deliverables', key: 'deliverables', icon: DocumentTextIcon, color: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' },
  { href: '/admin/conversations', key: 'conversations', icon: ChatBubbleLeftRightIcon, color: 'bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400' },
  { href: '/admin/settings', key: 'settings', icon: Cog6ToothIcon, color: 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300' },
] as const;

export default function AdminHomePage() {
  const t = useTranslations('adminDashboard');
  const tl = useTranslations('adminLayout');
  const locale = useLocale();
  const [requests, setRequests] = useState<RequestsSummary | null | 'error'>(null);
  const [grants, setGrants] = useState<GrantsSummary | null | 'error'>(null);
  const [contacts, setContacts] = useState<ContactRow[] | null | 'error'>(null);

  useEffect(() => {
    apiRequest<RequestsSummary>('/admin/demo-requests?limit=5')
      .then(setRequests)
      .catch(() => setRequests('error'));
    apiRequest<GrantsSummary>('/admin/demo-grants?limit=1')
      .then(setGrants)
      .catch(() => setGrants('error'));
    apiRequest<ContactRow[]>('/admin/contacts')
      .then((rows) => setContacts(Array.isArray(rows) ? rows : []))
      .catch(() => setContacts('error'));
  }, []);

  const num = (value: number | undefined | null) => (value === undefined || value === null ? '—' : String(value));
  const req = requests && requests !== 'error' ? requests : null;
  const gr = grants && grants !== 'error' ? grants : null;
  const ct = contacts && contacts !== 'error' ? contacts : null;

  const kpis = [
    { key: 'pending', value: req ? num(req.conteos.pendiente + req.conteos.en_revision) : requests === 'error' ? '—' : '…', icon: InboxArrowDownIcon, href: '/admin/solicitudes', color: 'text-primary-600 dark:text-primary-400' },
    { key: 'activeGrants', value: gr ? num(gr.conteos.activo) : grants === 'error' ? '—' : '…', icon: KeyIcon, href: '/admin/accesos', color: 'text-green-600 dark:text-green-400' },
    { key: 'expiring', value: gr ? num(gr.conteos.por_vencer) : grants === 'error' ? '—' : '…', icon: ClockIcon, href: '/admin/accesos?estado=por_vencer', color: 'text-amber-600 dark:text-amber-400' },
    { key: 'newContacts', value: ct ? num(ct.filter((c) => c.status === 'new').length) : contacts === 'error' ? '—' : '…', icon: EnvelopeIcon, href: '/admin/contacts', color: 'text-blue-600 dark:text-blue-400' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-1">{t('title')}</h1>
          <p className="text-secondary-600 dark:text-secondary-400">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((k) => (
            <Link key={k.key} href={k.href}>
              <Card variant="bordered" className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <k.icon className={`h-8 w-8 mb-2 ${k.color}`} />
                  <p className="text-xs uppercase tracking-wide text-secondary-600 dark:text-secondary-400 font-medium mb-1">{t(`kpi.${k.key}`)}</p>
                  <p className="text-2xl font-bold text-secondary-900 dark:text-white" data-kpi={k.key}>
                    {k.value}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card variant="bordered">
          <CardHeader>
            <CardTitle>{t('quickLinks')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-secondary-200 dark:border-secondary-800 hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md transition-all text-center group"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${link.color}`}>
                    <link.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-secondary-700 dark:text-secondary-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    {tl(link.key)}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="bordered">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('latestRequests')}</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/solicitudes?estado=">{t('viewAll')}</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {requests === null ? (
                <p className="text-sm text-secondary-500">{t('loading')}</p>
              ) : requests === 'error' ? (
                <p className="text-sm text-red-600">{t('loadError')}</p>
              ) : requests.items.length === 0 ? (
                <p className="text-sm text-secondary-500">{t('noRequests')}</p>
              ) : (
                <div className="space-y-2">
                  {requests.items.map((r) => (
                    <Link
                      key={r.id}
                      href={`/admin/solicitudes/${r.id}`}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-secondary-200 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-900 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-secondary-900 dark:text-white truncate">
                          {r.nombre} · {r.empresa}
                        </p>
                        <p className="text-xs text-secondary-500 truncate">
                          {r.codigo} · {formatDate(r.createdAt, locale, true)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <RequestStatusBadge estado={r.estado} />
                        <ArrowRightIcon className="h-4 w-4 text-secondary-400 group-hover:text-primary-600" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('latestContacts')}</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/contacts">{t('viewAll')}</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {contacts === null ? (
                <p className="text-sm text-secondary-500">{t('loading')}</p>
              ) : contacts === 'error' ? (
                <p className="text-sm text-red-600">{t('loadError')}</p>
              ) : contacts.length === 0 ? (
                <p className="text-sm text-secondary-500">{t('noContacts')}</p>
              ) : (
                <div className="space-y-2">
                  {contacts.slice(0, 5).map((c) => (
                    <Link
                      key={c.id}
                      href="/admin/contacts"
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-secondary-200 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-900 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm flex-shrink-0">
                          {(c.name || c.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-secondary-900 dark:text-white truncate">{c.name}</p>
                          <p className="text-xs text-secondary-500 truncate">
                            {c.email}
                            {c.service ? ` · ${c.service}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-secondary-500 flex-shrink-0">{formatDate(c.createdAt, locale)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-secondary-500 flex items-center gap-1">
          <ClipboardDocumentListIcon className="h-4 w-4" />
          {t('note')}
        </p>
      </div>
    </AdminLayout>
  );
}
