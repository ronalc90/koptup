'use client';

import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  BanknotesIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  ShoppingBagIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

// TODO: extract to i18n
const COP = (n: number) =>
  '$ ' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n) + ' COP';

// Datos mock representativos
const ACTIVE_PLANS = [
  { id: 1, client: 'Acme Salud SAS', plan: 'Chatbot RAG · Profesional', price: 489000 },
  { id: 2, client: 'Distribuidora Andina', plan: 'Agente IA Ventas · Growth', price: 1290000 },
  { id: 3, client: 'Clínica San Carlos', plan: 'Chatbot RAG · Enterprise', price: 1290000 },
  { id: 4, client: 'EduTech Bogotá', plan: 'Chatbot RAG · Starter', price: 249000 },
  { id: 5, client: 'Logística del Valle', plan: 'Agente IA Ventas · Pro', price: 2490000 },
];

const MRR = ACTIVE_PLANS.reduce((acc, p) => acc + p.price, 0);

const RECENT_CONTACTS = [
  { id: 1, name: 'María García', email: 'maria@retail.co', service: 'Chatbot RAG', date: '2026-05-14' },
  { id: 2, name: 'Andrés Rojas', email: 'andres@logistica.co', service: 'Agente IA Ventas', date: '2026-05-13' },
  { id: 3, name: 'Camila Pérez', email: 'camila@edutech.co', service: 'Desarrollo web', date: '2026-05-13' },
  { id: 4, name: 'Juan Quintero', email: 'juan@salud.co', service: 'Auditoría CUPS', date: '2026-05-12' },
  { id: 5, name: 'Laura Mejía', email: 'laura@startup.co', service: 'Chatbot RAG', date: '2026-05-11' },
];

const UPCOMING_INVOICES = [
  { id: 'INV-2026-0102', client: 'Acme Salud SAS', amount: 489000, due: '2026-05-20' },
  { id: 'INV-2026-0103', client: 'Distribuidora Andina', amount: 1290000, due: '2026-05-22' },
  { id: 'INV-2026-0104', client: 'Clínica San Carlos', amount: 1290000, due: '2026-05-25' },
  { id: 'INV-2026-0105', client: 'Logística del Valle', amount: 2490000, due: '2026-05-28' },
  { id: 'INV-2026-0106', client: 'EduTech Bogotá', amount: 249000, due: '2026-06-01' },
];

const REVENUE_LAST_6 = [
  { month: 'Dic', value: 3.2 },
  { month: 'Ene', value: 3.8 },
  { month: 'Feb', value: 4.1 },
  { month: 'Mar', value: 4.5 },
  { month: 'Abr', value: 5.2 },
  { month: 'May', value: 5.8 },
];

const KPIS = {
  activeClients: ACTIVE_PLANS.length + 3, // SaaS + servicios a medida
  activeProjects: 3,
  openTickets: 4,
  pendingInvoices: UPCOMING_INVOICES.length,
};

const QUICK_LINKS = [
  { href: '/admin/users', label: 'Usuarios', icon: UserGroupIcon, color: 'blue' },
  { href: '/admin/contacts', label: 'Contactos', icon: EnvelopeIcon, color: 'green' },
  { href: '/admin/invoices', label: 'Facturas', icon: BanknotesIcon, color: 'orange' },
  { href: '/admin/orders', label: 'Pedidos', icon: ShoppingBagIcon, color: 'purple' },
  { href: '/admin/deliverables', label: 'Entregables', icon: DocumentTextIcon, color: 'indigo' },
  { href: '/admin/conversations', label: 'Conversaciones', icon: ChatBubbleLeftRightIcon, color: 'pink' },
  { href: '/admin/settings', label: 'Configuración', icon: Cog6ToothIcon, color: 'gray' },
];

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
  green: 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400',
  orange: 'bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400',
  purple: 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400',
  indigo: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400',
  pink: 'bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400',
  gray: 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300',
};

function formatDateCO(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  } catch {
    return iso;
  }
}

export default function AdminHomePage() {
  const maxRevenue = Math.max(...REVENUE_LAST_6.map((r) => r.value));

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-1">
            Panel ejecutivo
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Visión general del negocio: MRR, clientes, proyectos y operación.
          </p>
        </div>

        {/* KPIs ejecutivos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card variant="bordered" className="bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-secondary-950 border-green-200 dark:border-green-900">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-2">
                <BanknotesIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                <Badge variant="primary" size="sm">+12%</Badge>
              </div>
              <p className="text-xs uppercase tracking-wide text-secondary-600 dark:text-secondary-400 font-medium mb-1">MRR</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">{COP(MRR)}</p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                {ACTIVE_PLANS.length} planes SaaS activos
              </p>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-2">
                <UserGroupIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <Badge variant="secondary" size="sm">+3 este mes</Badge>
              </div>
              <p className="text-xs uppercase tracking-wide text-secondary-600 dark:text-secondary-400 font-medium mb-1">Clientes activos</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">{KPIS.activeClients}</p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                SaaS + servicios a medida
              </p>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-2">
                <ClipboardDocumentListIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <Badge variant="secondary" size="sm">{KPIS.activeProjects} en curso</Badge>
              </div>
              <p className="text-xs uppercase tracking-wide text-secondary-600 dark:text-secondary-400 font-medium mb-1">Proyectos</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">{KPIS.activeProjects}</p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                Servicios a medida en desarrollo
              </p>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-2">
                <ExclamationCircleIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                <Badge variant="primary" size="sm">{KPIS.openTickets} abiertos</Badge>
              </div>
              <p className="text-xs uppercase tracking-wide text-secondary-600 dark:text-secondary-400 font-medium mb-1">Tickets soporte</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">{KPIS.openTickets}</p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                {KPIS.pendingInvoices} facturas por cobrar
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick links */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Accesos rápidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {QUICK_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-secondary-200 dark:border-secondary-800 hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md transition-all text-center group"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${COLOR_MAP[link.color]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold text-secondary-700 dark:text-secondary-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Revenue chart + Active plans */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card variant="bordered" className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-primary-600" />
                  Ingresos últimos 6 meses
                </CardTitle>
                <Badge variant="secondary" size="sm">millones COP</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2 h-48 px-2">
                {REVENUE_LAST_6.map((r) => {
                  const heightPct = Math.round((r.value / maxRevenue) * 100);
                  return (
                    <div key={r.month} className="flex flex-col items-center flex-1 gap-2">
                      <div className="text-xs font-semibold text-secondary-700 dark:text-secondary-300">
                        {r.value.toFixed(1)}M
                      </div>
                      <div className="w-full flex items-end h-32">
                        <div
                          className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-md transition-all hover:from-primary-700 hover:to-primary-500"
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <div className="text-xs text-secondary-500 dark:text-secondary-400 font-medium">
                        {r.month}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Planes SaaS activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {ACTIVE_PLANS.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-lg border border-secondary-200 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-900"
                  >
                    <p className="text-sm font-semibold text-secondary-900 dark:text-white truncate">
                      {p.client}
                    </p>
                    <p className="text-xs text-secondary-600 dark:text-secondary-400 truncate">
                      {p.plan}
                    </p>
                    <p className="text-xs font-bold text-primary-600 dark:text-primary-400 mt-1">
                      {COP(p.price)} / mes
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contactos recientes + Próximas facturas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="bordered">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Últimos contactos recibidos</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/contacts">Ver todos</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {RECENT_CONTACTS.map((c) => (
                  <Link
                    key={c.id}
                    href="/admin/contacts"
                    className="flex items-center justify-between p-3 rounded-lg border border-secondary-200 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-900 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm flex-shrink-0">
                        {c.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-secondary-900 dark:text-white truncate">
                          {c.name}
                        </p>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
                          {c.email} · {c.service}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-secondary-500 dark:text-secondary-400">
                        {formatDateCO(c.date)}
                      </span>
                      <ArrowRightIcon className="h-4 w-4 text-secondary-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Próximas facturas a cobrar</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/invoices">Ver todas</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {UPCOMING_INVOICES.map((inv) => (
                  <Link
                    key={inv.id}
                    href="/admin/invoices"
                    className="flex items-center justify-between p-3 rounded-lg border border-secondary-200 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-900 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <CheckCircleIcon className="h-5 w-5 text-orange-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-secondary-900 dark:text-white truncate">
                          {inv.client}
                        </p>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
                          {inv.id} · vence {formatDateCO(inv.due)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-secondary-900 dark:text-white">
                        {COP(inv.amount)}
                      </span>
                      <ArrowRightIcon className="h-4 w-4 text-secondary-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
