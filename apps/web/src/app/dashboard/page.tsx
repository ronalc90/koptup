'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import DashboardLayout, { usePortalUser } from '@/components/dashboard/DashboardLayout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { PortalError, PortalLoading } from '@/components/dashboard/PortalStates';
import { useErrorText } from '@/hooks/useErrorText';
import { apiRequest, demoName, DEMO_STAFF_ROLES, fetchMyDemos, type MyDemo } from '@/lib/demo-system';
import { formatDay, formatMoney, INVOICE_STATUS_BADGE, ORDER_STATUS_BADGE, type InvoiceView, type OrderStatus, type ProjectStatus } from '@/lib/portal';
import { getRagPlan, isRagPlanId, ragPlanContactHref, RAG_SERVICE_SLUG } from '@/lib/rag-plans';
import {
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  FolderIcon,
  KeyIcon,
  PlusIcon,
  ShoppingBagIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface OrderRow {
  id: string;
  name: string;
  status: OrderStatus;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  date: string;
  amount: number;
  currency: string;
}

interface ProjectRow {
  _id: string;
  name: string;
  status: ProjectStatus;
  progress?: number;
  end_date?: string | null;
  deliverables_pending?: number;
}

interface ConversationRow {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

type Section<T> = { ok: true; data: T } | { ok: false; error: unknown };

interface HomeData {
  demos: Section<MyDemo[]>;
  orders: Section<OrderRow[]>;
  projects: Section<ProjectRow[]>;
  invoices: Section<InvoiceView[]>;
  conversations: Section<ConversationRow[]>;
}

const ACTIVE_ORDER: OrderStatus[] = ['pending', 'in_progress', 'shipped'];
const OPEN_PROJECT: ProjectStatus[] = ['planning', 'active', 'on_hold'];

function settle<T>(p: Promise<T>): Promise<Section<T>> {
  return p.then(
    (data) => ({ ok: true as const, data }),
    (error) => ({ ok: false as const, error }),
  );
}

/** Suma por moneda («$ 1.200.000 · US$ 300.00»), sin mezclar COP y USD. */
function sumByCurrency(invoices: InvoiceView[], locale: string): string {
  const totals = new Map<string, number>();
  for (const inv of invoices) totals.set(inv.currency, (totals.get(inv.currency) ?? 0) + inv.total);
  return Array.from(totals.entries())
    .map(([cur, amount]) => formatMoney(amount, cur, locale))
    .join(' · ');
}

function PortalHome() {
  const t = useTranslations('dashboardPage');
  const tc = useTranslations('portalCommon');
  const tp = useTranslations('ragPlans');
  const locale = useLocale();
  const errorText = useErrorText();
  const searchParams = useSearchParams();
  const { user } = usePortalUser();
  const [data, setData] = useState<HomeData | null>(null);

  const load = useCallback(async () => {
    setData(null);
    const [demos, orders, projects, invoices, conversations] = await Promise.all([
      settle(fetchMyDemos()),
      settle(apiRequest<OrderRow[]>('/orders')),
      settle(apiRequest<ProjectRow[]>('/projects')),
      settle(apiRequest<InvoiceView[]>('/invoices')),
      settle(apiRequest<ConversationRow[]>('/messages/conversations')),
    ]);
    setData({ demos, orders, projects, invoices, conversations });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const firstName = (user?.name ?? '').split(' ')[0];
  const welcome = searchParams.get('welcome') === '1';
  const planParam = searchParams.get('plan');
  const tierParam = searchParams.get('tier');
  const ragTier = planParam === RAG_SERVICE_SLUG && isRagPlanId(tierParam) ? getRagPlan(tierParam) : null;
  const isStaff = !!user && DEMO_STAFF_ROLES.includes(user.role);

  const list = <T,>(s: Section<T[]> | undefined): T[] => (s && s.ok && Array.isArray(s.data) ? s.data : []);
  const orders = list(data?.orders);
  const projects = list(data?.projects);
  const invoices = list(data?.invoices);
  const conversations = list(data?.conversations);
  const demos = list(data?.demos);

  const activeOrders = orders.filter((o) => ACTIVE_ORDER.includes(o.status));
  const waitingReview = orders.filter((o) => o.status === 'pending' && o.approvalStatus === 'pending').length;
  const openProjects = projects.filter((p) => OPEN_PROJECT.includes(p.status));
  const toReview = projects.reduce((n, p) => n + Number(p.deliverables_pending ?? 0), 0);
  const unpaid = invoices.filter((i) => i.status === 'pending' || i.status === 'overdue');
  const overdue = unpaid.filter((i) => i.status === 'overdue').length;
  const nextDue = unpaid
    .map((i) => i.dueDate)
    .filter((d): d is string => !!d)
    .sort()[0];
  const unreadMessages = conversations.reduce((n, c) => n + Number(c.unreadCount ?? 0), 0);
  const activeDemos = demos.filter((d) => d.vigente && d.estado === 'activo');

  const sectionError = (s: Section<unknown> | undefined) =>
    s && !s.ok ? <PortalError compact message={errorText(s.error)} onRetry={() => void load()} /> : null;

  return (
    <div className="space-y-8">
      {welcome && (
        <Card variant="elevated" className="border-2 border-primary-300 dark:border-primary-700 bg-gradient-to-r from-primary-50 to-white dark:from-primary-950 dark:to-secondary-950">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-1">
                  {firstName ? t('welcomeTitleName', { name: firstName }) : t('welcomeTitle')}
                </h2>
                <p className="text-secondary-700 dark:text-secondary-300">{t('welcomeBody')}</p>
                {ragTier && (
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
                    <p className="text-sm text-secondary-700 dark:text-secondary-300">
                      {t('welcomePlan', { plan: tp(`plans.${ragTier.id}.name`) })}
                    </p>
                    <Button size="sm" asChild>
                      <Link href={ragPlanContactHref(ragTier.id)}>{t('welcomePlanCta')}</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-1">
            {firstName ? t('greetingName', { name: firstName }) : t('greeting')}
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">{t('subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/messages">
              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
              {t('writeTeam')}
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/dashboard/orders/new">
              <PlusIcon className="h-4 w-4 mr-2" />
              {t('newOrder')}
            </Link>
          </Button>
        </div>
      </div>

      {isStaff && (
        <Card variant="bordered">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-secondary-700 dark:text-secondary-300">{t('staffNote')}</p>
            <Button size="sm" variant="outline" asChild>
              <Link href="/admin">{t('goToPanel')}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!data ? (
        <PortalLoading label={t('loading')} />
      ) : (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" data-testid="portal-kpis">
            <Kpi
              icon={ShoppingBagIcon}
              label={t('kpis.activeOrders')}
              value={data.orders.ok ? String(activeOrders.length) : '—'}
              hint={data.orders.ok ? t('kpis.waitingReview', { count: waitingReview }) : t('kpis.unavailable')}
              href="/dashboard/orders"
              accent="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
            />
            <Kpi
              icon={FolderIcon}
              label={t('kpis.openProjects')}
              value={data.projects.ok ? String(openProjects.length) : '—'}
              hint={data.projects.ok ? t('kpis.toReview', { count: toReview }) : t('kpis.unavailable')}
              href="/dashboard/projects"
              accent="bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400"
            />
            <Kpi
              icon={CreditCardIcon}
              label={t('kpis.pendingBalance')}
              value={data.invoices.ok ? (unpaid.length ? sumByCurrency(unpaid, locale) : formatMoney(0, 'COP', locale)) : '—'}
              hint={
                !data.invoices.ok
                  ? t('kpis.unavailable')
                  : overdue > 0
                    ? t('kpis.overdue', { count: overdue })
                    : nextDue
                      ? t('kpis.nextDue', { date: formatDay(nextDue, locale) })
                      : t('kpis.nothingDue')
              }
              href="/dashboard/billing"
              accent={overdue > 0 ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400'}
            />
            <Kpi
              icon={ChatBubbleLeftRightIcon}
              label={t('kpis.unreadMessages')}
              value={data.conversations.ok ? String(unreadMessages) : '—'}
              hint={data.conversations.ok ? t('kpis.conversations', { count: conversations.length }) : t('kpis.unavailable')}
              href="/dashboard/messages"
              accent="bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Pedidos */}
            <SectionCard title={t('sections.orders')} href="/dashboard/orders" viewAll={t('viewAll')}>
              {sectionError(data.orders) ??
                (orders.length === 0 ? (
                  <EmptyLine text={t('empty.orders')} action={{ href: '/dashboard/orders/new', label: t('newOrder') }} />
                ) : (
                  <ul className="divide-y divide-secondary-200 dark:divide-secondary-800" data-testid="home-orders">
                    {orders.slice(0, 4).map((o) => (
                      <li key={o.id}>
                        <Link href={`/dashboard/orders/${encodeURIComponent(o.id)}`} className="flex items-center justify-between gap-3 py-3 hover:bg-secondary-50 dark:hover:bg-secondary-900 rounded px-2 -mx-2">
                          <div className="min-w-0">
                            <p className="font-medium text-secondary-900 dark:text-white truncate">{o.name}</p>
                            <p className="text-xs text-secondary-500 font-mono">
                              {o.id} · {formatDay(o.date, locale)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-sm font-semibold text-secondary-900 dark:text-white hidden sm:inline">{formatMoney(o.amount, o.currency, locale)}</span>
                            <Badge variant="secondary" size="sm" className={ORDER_STATUS_BADGE[o.status]}>
                              {tc(`orderStatus.${o.status}`)}
                            </Badge>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ))}
            </SectionCard>

            {/* Proyectos */}
            <SectionCard title={t('sections.projects')} href="/dashboard/projects" viewAll={t('viewAll')}>
              {sectionError(data.projects) ??
                (projects.length === 0 ? (
                  <EmptyLine text={t('empty.projects')} />
                ) : (
                  <ul className="space-y-4" data-testid="home-projects">
                    {projects.slice(0, 3).map((p) => (
                      <li key={p._id}>
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <p className="font-medium text-secondary-900 dark:text-white truncate">{p.name}</p>
                          <Badge variant="secondary" size="sm">
                            {tc(`projectStatus.${p.status}`)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-secondary-200 dark:bg-secondary-800 rounded-full h-2 overflow-hidden" aria-hidden="true">
                            <div className="bg-primary-600 h-2" style={{ width: `${Math.min(100, Math.max(0, Number(p.progress ?? 0)))}%` }} />
                          </div>
                          <span className="text-xs text-secondary-600 dark:text-secondary-400 w-28 text-right">{t('progress', { percent: Number(p.progress ?? 0) })}</span>
                        </div>
                        {Number(p.deliverables_pending ?? 0) > 0 && (
                          <Link href="/dashboard/deliverables" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                            {t('deliverablesToReview', { count: Number(p.deliverables_pending) })}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                ))}
            </SectionCard>

            {/* Facturas */}
            <SectionCard title={t('sections.invoices')} href="/dashboard/billing" viewAll={t('viewAll')}>
              {sectionError(data.invoices) ??
                (unpaid.length === 0 ? (
                  <EmptyLine text={invoices.length === 0 ? t('empty.invoices') : t('empty.invoicesPaid')} />
                ) : (
                  <ul className="divide-y divide-secondary-200 dark:divide-secondary-800" data-testid="home-invoices">
                    {unpaid.slice(0, 4).map((inv) => (
                      <li key={inv.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="font-medium text-secondary-900 dark:text-white font-mono">{inv.invoiceNumber}</p>
                          <p className="text-xs text-secondary-500">{t('dueOn', { date: formatDay(inv.dueDate, locale) })}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm font-semibold text-secondary-900 dark:text-white">{formatMoney(inv.total, inv.currency, locale)}</span>
                          <Badge variant="secondary" size="sm" className={INVOICE_STATUS_BADGE[inv.status]}>
                            {tc(`invoiceStatus.${inv.status}`)}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                ))}
            </SectionCard>

            {/* Mensajes */}
            <SectionCard title={t('sections.messages')} href="/dashboard/messages" viewAll={t('viewAll')}>
              {sectionError(data.conversations) ??
                (conversations.length === 0 ? (
                  <EmptyLine text={t('empty.messages')} action={{ href: '/dashboard/messages', label: t('writeTeam') }} />
                ) : (
                  <ul className="divide-y divide-secondary-200 dark:divide-secondary-800" data-testid="home-messages">
                    {conversations
                      .slice()
                      .sort((a, b) => Number(b.unreadCount > 0) - Number(a.unreadCount > 0))
                      .slice(0, 4)
                      .map((c) => (
                        <li key={c.id}>
                          <Link href={`/dashboard/messages?c=${encodeURIComponent(c.id)}`} className="flex items-center justify-between gap-3 py-3 hover:bg-secondary-50 dark:hover:bg-secondary-900 rounded px-2 -mx-2">
                            <div className="min-w-0">
                              <p className={`truncate ${c.unreadCount > 0 ? 'font-semibold text-secondary-900 dark:text-white' : 'font-medium text-secondary-800 dark:text-secondary-200'}`}>{c.title}</p>
                              <p className="text-xs text-secondary-500 truncate">{c.lastMessage || t('noMessagesYet')}</p>
                            </div>
                            {c.unreadCount > 0 && (
                              <Badge variant="primary" size="sm">
                                {t('unread', { count: c.unreadCount })}
                              </Badge>
                            )}
                          </Link>
                        </li>
                      ))}
                  </ul>
                ))}
            </SectionCard>
          </div>

          {/* Demos */}
          <SectionCard title={t('sections.demos')} href="/dashboard/demos" viewAll={t('viewAll')}>
            {sectionError(data.demos) ??
              (activeDemos.length === 0 ? (
                <EmptyLine text={demos.length === 0 ? t('empty.demos') : t('empty.demosExpired')} action={{ href: '/demo', label: t('exploreDemos') }} />
              ) : (
                <ul className="grid grid-cols-1 md:grid-cols-3 gap-3" data-testid="home-demos">
                  {activeDemos.slice(0, 3).map((d) => (
                    <li key={d.id} className="p-4 rounded-lg border border-secondary-200 dark:border-secondary-800 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <KeyIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                        <p className="font-medium text-secondary-900 dark:text-white truncate">{demoName({ slug: d.demoSlug, nombre: d.demoNombre, nombreEn: d.demoNombreEn }, locale)}</p>
                      </div>
                      <p className="text-xs text-secondary-500">{d.demoActiva ? t('demoDays', { days: d.diasRestantes }) : t('demoMaintenance')}</p>
                      {d.demoActiva && (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={d.url}>{t('openDemo')}</Link>
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              ))}
          </SectionCard>
        </>
      )}
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  href,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  href: string;
  accent: string;
}) {
  return (
    <Link href={href} className="block">
      <Card variant="bordered" className="h-full hover:shadow-medium transition-shadow">
        <CardContent className="p-5">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${accent}`}>
            <Icon className="h-5 w-5" />
          </div>
          <p className="text-xs uppercase tracking-wide text-secondary-500 dark:text-secondary-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-secondary-900 dark:text-white break-words">{value}</p>
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">{hint}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function SectionCard({ title, href, viewAll, children }: { title: string; href: string; viewAll: string; children: React.ReactNode }) {
  return (
    <Card variant="bordered">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          <Link href={href} className="text-sm text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1">
            {viewAll}
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyLine({ text, action }: { text: string; action?: { href: string; label: string } }) {
  return (
    <div className="py-4 text-center">
      <p className="text-sm text-secondary-600 dark:text-secondary-400">{text}</p>
      {action && (
        <Button className="mt-3" size="sm" variant="outline" asChild>
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}

/**
 * Inicio del portal del cliente: resumen real de sus demos, pedidos,
 * proyectos, facturas y mensajes. Si una sección no carga, lo dice y deja
 * reintentar; si no hay datos, lo dice (nunca muestra cifras de ejemplo).
 */
export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<PortalLoading />}>
        <PortalHome />
      </Suspense>
    </DashboardLayout>
  );
}
