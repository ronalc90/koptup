'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import OnboardingChecklist, { type OnboardingStep } from '@/components/onboarding/OnboardingChecklist';
import HowItWorks from '@/components/onboarding/HowItWorks';
import {
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  CalendarIcon,
  ChartBarIcon,
  SignalIcon,
  PuzzlePieceIcon,
  DocumentTextIcon,
  PlayCircleIcon,
  BellAlertIcon,
  LifebuoyIcon,
  SparklesIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

type ClientType = 'plan' | 'service' | 'empty';

// TODO: extract to i18n — strings hardcodeados intencionalmente para esta tarea
const COP = (n: number) =>
  '$ ' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n) + ' COP';

function formatDateCO(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function DashboardPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('dashboardPage');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [clientType, setClientType] = useState<ClientType>('empty');

  const welcome = searchParams.get('welcome') === '1';
  const planFromQuery = searchParams.get('plan');
  const tierFromQuery = searchParams.get('tier');

  useEffect(() => {
    const userData = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === 'admin' || parsed.email === 'admin@koptup.com') {
        router.push('/admin');
        return;
      }
      setUser(parsed);
    }

    // Determinar tipo de cliente: query param > localStorage > 'empty'
    const qType = searchParams.get('type') as ClientType | null;
    if (qType && ['plan', 'service', 'empty'].includes(qType)) {
      setClientType(qType);
      if (typeof window !== 'undefined') {
        localStorage.setItem('koptup.clientType', qType);
      }
    } else if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('koptup.clientType') as ClientType | null;
      if (stored && ['plan', 'service', 'empty'].includes(stored)) {
        setClientType(stored);
      } else if (planFromQuery) {
        setClientType('plan');
      }
    }

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const switchType = (type: ClientType) => {
    setClientType(type);
    if (typeof window !== 'undefined') {
      localStorage.setItem('koptup.clientType', type);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-secondary-600 dark:text-secondary-400">{t('loading')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'cliente';

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome banner cuando viene de registro */}
        {welcome && (
          <Card variant="elevated" className="border-2 border-primary-300 dark:border-primary-700 bg-gradient-to-r from-primary-50 to-white dark:from-primary-950 dark:to-secondary-950">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                  <SparklesIcon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-1">
                    ¡Bienvenido a Koptup, {firstName}!
                  </h2>
                  <p className="text-secondary-700 dark:text-secondary-300">
                    Tu cuenta está lista. Empezá completando los 3 pasos de abajo para sacarle el máximo provecho.
                    {planFromQuery && (
                      <>
                        {' '}Tu plan elegido fue{' '}
                        <span className="font-semibold text-primary-700 dark:text-primary-300">
                          {planFromQuery}
                          {tierFromQuery ? ` · ${tierFromQuery}` : ''}
                        </span>
                        .
                      </>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header con saludo + selector de vista (mock) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-1">
              Hola, {firstName}
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400">
              {clientType === 'plan' && 'Tu suscripción SaaS está activa. Acá tenés el resumen.'}
              {clientType === 'service' && 'Estamos construyendo tu solución a medida. Mirá el progreso.'}
              {clientType === 'empty' && 'Todavía no contrataste nada. Explorá lo que podemos hacer por vos.'}
            </p>
          </div>
          {/* Vista demo switcher (solo informativo, no afecta DB) */}
          <div className="inline-flex rounded-lg border border-secondary-200 dark:border-secondary-800 p-1 bg-white dark:bg-secondary-900 self-start">
            {(['empty', 'plan', 'service'] as ClientType[]).map((opt) => (
              <button
                key={opt}
                onClick={() => switchType(opt)}
                className={
                  clientType === opt
                    ? 'px-3 py-1.5 text-xs font-semibold rounded-md bg-primary-600 text-white'
                    : 'px-3 py-1.5 text-xs font-medium rounded-md text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white'
                }
                title="Cambiar vista demo del dashboard"
              >
                {opt === 'empty' ? 'Sin plan' : opt === 'plan' ? 'Plan SaaS' : 'Servicio'}
              </button>
            ))}
          </div>
        </div>

        {/* Vistas según tipo */}
        {clientType === 'plan' && <PlanView welcome={welcome} planSlug={planFromQuery} />}
        {clientType === 'service' && <ServiceView welcome={welcome} />}
        {clientType === 'empty' && <EmptyView welcome={welcome} />}

        {/* Tarjetas comunes */}
        <CommonCards />
      </div>
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
          </div>
        </DashboardLayout>
      }
    >
      <DashboardPageInner />
    </Suspense>
  );
}

// =========================================================================
// VISTA 1: Cliente con PLAN SaaS activo
// =========================================================================
function PlanView({ welcome, planSlug }: { welcome: boolean; planSlug: string | null }) {
  const planName = planSlug || 'Growth — Chatbot RAG';
  const nextInvoiceAmount = 489000; // COP
  const nextInvoiceDate = '2026-06-12';
  const conversationsThisMonth = 8432;
  const conversationsLimit = 15000;
  const usagePct = Math.round((conversationsThisMonth / conversationsLimit) * 100);
  const satisfaction = 4.7;
  const uptime = 99.98;

  const steps: OnboardingStep[] = [
    {
      id: 'profile',
      title: 'Completá tu perfil empresarial',
      description: 'NIT, razón social, datos de contacto y facturación.',
      done: false,
      href: '/dashboard/profile',
      ctaLabel: 'Completar',
    },
    {
      id: 'integrations',
      title: 'Conectá tus integraciones',
      description: 'API keys de los servicios externos que paga tu empresa (OpenAI, Twilio, etc.).',
      done: false,
      href: '/dashboard/settings',
      ctaLabel: 'Conectar',
    },
    {
      id: 'first-flow',
      title: 'Subí tu primer documento al chatbot',
      description: 'PDFs, manuales o FAQs para alimentar el RAG.',
      done: false,
      href: '/dashboard/deliverables',
      ctaLabel: 'Subir',
    },
  ];

  return (
    <div className="space-y-6">
      {welcome && <OnboardingChecklist steps={steps} />}

      {/* Plan card destacada */}
      <Card variant="bordered" className="bg-gradient-to-br from-primary-50 to-white dark:from-primary-950 dark:to-secondary-950 border-primary-200 dark:border-primary-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center">
                <RocketLaunchIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <Badge variant="primary" size="sm" className="mb-1">Plan SaaS activo</Badge>
                <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
                  {planName}
                </h2>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Facturación mensual · Sin permanencia
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/settings">Configurar</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/dashboard/billing">Ver factura</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs del plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          icon={ChatBubbleLeftRightIcon}
          label="Conversaciones / mes"
          value={conversationsThisMonth.toLocaleString('es-CO')}
          hint={`${usagePct}% del límite (${conversationsLimit.toLocaleString('es-CO')})`}
          accent="purple"
        />
        <KpiCard
          icon={ChartBarIcon}
          label="Satisfacción"
          value={`${satisfaction} / 5`}
          hint="Promedio últimos 30 días"
          accent="green"
        />
        <KpiCard
          icon={SignalIcon}
          label="Uptime"
          value={`${uptime}%`}
          hint="Últimos 30 días"
          accent="blue"
        />
        <KpiCard
          icon={CreditCardIcon}
          label="Próxima factura"
          value={COP(nextInvoiceAmount)}
          hint={formatDateCO(nextInvoiceDate)}
          accent="orange"
        />
      </div>

      {/* Uso del plan + Acceso rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="bordered" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Uso del plan este mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-secondary-700 dark:text-secondary-300">Conversaciones</span>
                  <span className="font-semibold text-secondary-900 dark:text-white">
                    {conversationsThisMonth.toLocaleString('es-CO')} / {conversationsLimit.toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="w-full bg-secondary-200 dark:bg-secondary-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-2.5"
                    style={{ width: `${usagePct}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-secondary-700 dark:text-secondary-300">Documentos indexados</span>
                  <span className="font-semibold text-secondary-900 dark:text-white">42 / 100</span>
                </div>
                <div className="w-full bg-secondary-200 dark:bg-secondary-800 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-green-500 h-2.5" style={{ width: '42%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-secondary-700 dark:text-secondary-300">Llamadas a APIs externas</span>
                  <span className="font-semibold text-secondary-900 dark:text-white">12.4k / 50k</span>
                </div>
                <div className="w-full bg-secondary-200 dark:bg-secondary-800 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-blue-500 h-2.5" style={{ width: '25%' }} />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-semibold text-secondary-900 dark:text-white">
                    Sistema operando normalmente
                  </p>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400">
                    Último incidente: hace 47 días — Resuelto
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/notifications">Ver historial</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Acceso rápido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickLink href="/dashboard/settings" icon={PuzzlePieceIcon} label="Configurar producto" />
            <QuickLink href="/dashboard/settings" icon={CogIconFallback} label="Integraciones / API keys" />
            <QuickLink href="/dashboard/messages" icon={ChatBubbleLeftRightIcon} label="Soporte" />
            <QuickLink href="/dashboard/notifications" icon={BellAlertIcon} label="Logs y alertas" />
            <QuickLink href="/dashboard/billing" icon={CreditCardIcon} label="Facturas y pagos" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Heroicons cogwheel alias
function CogIconFallback(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.773.773a1.125 1.125 0 0 1-1.45.12l-.737-.527c-.35-.25-.807-.272-1.204-.107-.397.165-.71.505-.78.93l-.15.893c-.09.543-.56.94-1.11.94h-1.094c-.55 0-1.019-.397-1.11-.94l-.148-.893c-.071-.425-.384-.765-.781-.93-.398-.165-.854-.143-1.204.107l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.773a1.125 1.125 0 0 1-.12-1.45l.527-.738c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.764-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.166.71-.506.78-.93l.15-.893Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

// =========================================================================
// VISTA 2: Cliente con SERVICIO a medida en curso
// =========================================================================
function ServiceView({ welcome }: { welcome: boolean }) {
  const serviceName = 'Chatbot RAG con IA';
  const status = 'En desarrollo';
  const progress = 65;
  const setupPaid = true;
  const nextMaintenance = 350000;
  const nextMaintenanceDate = '2026-06-01';

  const milestones = [
    { id: 1, title: 'Discovery y alcance', date: '2026-04-02', done: true },
    { id: 2, title: 'Diseño técnico y prototipo', date: '2026-04-15', done: true },
    { id: 3, title: 'Ingesta de documentos (RAG)', date: '2026-04-28', done: true },
    { id: 4, title: 'Integración con WhatsApp Business', date: '2026-05-20', done: false, current: true },
    { id: 5, title: 'QA y pruebas con usuarios reales', date: '2026-06-05', done: false },
    { id: 6, title: 'Go-live y handover', date: '2026-06-20', done: false },
  ];

  const deliverables = [
    { id: 'd1', name: 'Documento de alcance v1.2.pdf', date: '2026-04-02', type: 'PDF' },
    { id: 'd2', name: 'Arquitectura técnica.fig', date: '2026-04-15', type: 'Figma' },
    { id: 'd3', name: 'Pipeline de ingesta — repo', date: '2026-04-22', type: 'Git' },
  ];

  const pendingMessages = 2;

  const steps: OnboardingStep[] = [
    {
      id: 'profile',
      title: 'Completá los datos de tu empresa',
      description: 'Necesitamos NIT y datos de facturación para los próximos pagos.',
      done: false,
      href: '/dashboard/profile',
      ctaLabel: 'Completar',
    },
    {
      id: 'integrations',
      title: 'Compartí accesos a sistemas externos',
      description: 'CRM, base de datos, APIs que paga tu empresa. Las cifrá en /settings.',
      done: false,
      href: '/dashboard/settings',
      ctaLabel: 'Cargar',
    },
    {
      id: 'kickoff',
      title: 'Reunión de kickoff',
      description: 'Agendamos una llamada con el PM para alinear próximos hitos.',
      done: true,
      href: '/dashboard/messages',
      ctaLabel: 'Ver',
    },
  ];

  return (
    <div className="space-y-6">
      {welcome && <OnboardingChecklist steps={steps} />}

      {/* Header del proyecto */}
      <Card variant="bordered" className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-secondary-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                <PuzzlePieceIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <Badge variant="primary" size="sm" className="mb-1">Servicio a medida</Badge>
                <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
                  {serviceName}
                </h2>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Estado: <span className="font-semibold text-blue-700 dark:text-blue-300">{status}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/messages">Solicitar reunión</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/dashboard/messages">Pedir cambio</Link>
              </Button>
            </div>
          </div>

          {/* Progress bar grande */}
          <div className="mt-6">
            <div className="flex items-end justify-between mb-2">
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Progreso general
              </span>
              <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{progress}%</span>
            </div>
            <div className="w-full bg-secondary-200 dark:bg-secondary-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hitos + Estado de pagos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="bordered" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Hitos del proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative border-l-2 border-secondary-200 dark:border-secondary-800 ml-3 space-y-5">
              {milestones.map((m) => (
                <li key={m.id} className="ml-6">
                  <span
                    className={
                      'absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white dark:ring-secondary-950 ' +
                      (m.done
                        ? 'bg-green-500'
                        : (m as any).current
                          ? 'bg-blue-500 animate-pulse'
                          : 'bg-secondary-300 dark:bg-secondary-700')
                    }
                  >
                    {m.done ? (
                      <CheckCircleIcon className="h-3.5 w-3.5 text-white" />
                    ) : (
                      <span className="text-[10px] font-bold text-white">{m.id}</span>
                    )}
                  </span>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3
                      className={
                        m.done
                          ? 'text-sm font-semibold text-secondary-500 dark:text-secondary-400 line-through'
                          : 'text-sm font-semibold text-secondary-900 dark:text-white'
                      }
                    >
                      {m.title}
                    </h3>
                    <time className="text-xs text-secondary-500 dark:text-secondary-400 flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {formatDateCO(m.date)}
                    </time>
                  </div>
                  {(m as any).current && (
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">En curso ahora</p>
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Estado de pagos */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Estado de pagos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900">
                <div>
                  <p className="text-xs text-green-700 dark:text-green-300 font-medium">Setup</p>
                  <p className="text-sm font-bold text-secondary-900 dark:text-white">Pagado</p>
                </div>
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-900">
                <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">Próximo mantenimiento</p>
                <p className="text-sm font-bold text-secondary-900 dark:text-white">{COP(nextMaintenance)}</p>
                <p className="text-xs text-secondary-600 dark:text-secondary-400">
                  Vence el {formatDateCO(nextMaintenanceDate)}
                </p>
              </div>
              <Button size="sm" fullWidth asChild>
                <Link href="/dashboard/billing">Ver detalle de facturas</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Mensajes del PM */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Mensajes del PM</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingMessages > 0 ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="primary" size="sm">
                      {pendingMessages} sin leer
                    </Badge>
                  </div>
                  <p className="text-sm text-secondary-700 dark:text-secondary-300 mb-3">
                    Ronald te dejó comentarios sobre la integración con WhatsApp Business.
                  </p>
                </>
              ) : (
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
                  No tenés mensajes pendientes.
                </p>
              )}
              <Button size="sm" variant="outline" fullWidth asChild>
                <Link href="/dashboard/messages">Abrir conversación</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Deliverables entregados */}
      <Card variant="bordered">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Entregables recientes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/deliverables">Ver todos</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {deliverables.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-3 rounded-lg border border-secondary-200 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-primary-100 dark:bg-primary-950 flex items-center justify-center">
                    <DocumentTextIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-secondary-900 dark:text-white">{d.name}</p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400">
                      {d.type} · {formatDateCO(d.date)}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" size="sm">
                  Entregado
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =========================================================================
// VISTA 3: Cliente sin plan ni servicio
// =========================================================================
function EmptyView({ welcome }: { welcome: boolean }) {
  const recommendations = [
    {
      slug: 'chatbot-rag-ia',
      name: 'Chatbot RAG con IA',
      tier: 'profesional',
      price: 489000,
      desc: 'Atendé a tus clientes 24/7 con un chatbot que entiende tus documentos.',
      cta: '/contact?service=chatbot-rag-ia&plan=profesional',
    },
    {
      slug: 'agente-ia-ventas',
      name: 'Agente IA de Ventas',
      tier: 'growth',
      price: 1290000,
      desc: 'Calificá leads automáticamente y agendá reuniones en tu calendario.',
      cta: '/contact?service=agente-ia-ventas&plan=growth',
    },
    {
      slug: 'desarrollo-web',
      name: 'Desarrollo web a medida',
      tier: 'desde',
      price: 3500000,
      desc: 'Sitios y plataformas hechas a la medida de tu negocio.',
      cta: '/contact?service=desarrollo-web&plan=base',
    },
  ];

  const steps: OnboardingStep[] = [
    {
      id: 'explore',
      title: 'Explorá las demos',
      description: 'Probá nuestras soluciones IA sin compromiso ni tarjeta.',
      done: welcome ? false : false,
      href: '/demo',
      ctaLabel: 'Ir a demos',
    },
    {
      id: 'choose',
      title: 'Elegí un plan o servicio',
      description: 'Catálogo completo con precios en COP claros.',
      done: false,
      href: '/services',
      ctaLabel: 'Ver catálogo',
    },
    {
      id: 'contact',
      title: 'Hablá con un asesor',
      description: '15 minutos gratis para resolver tus dudas técnicas.',
      done: false,
      href: '/contact',
      ctaLabel: 'Contactar',
    },
  ];

  return (
    <div className="space-y-6">
      <OnboardingChecklist steps={steps} title="Empezá a explorar Koptup" />

      {/* CTA principal */}
      <Card variant="bordered" className="bg-gradient-to-r from-primary-600 to-primary-700 border-primary-700 text-white">
        <CardContent className="p-8 text-center">
          <PlayCircleIcon className="h-14 w-14 mx-auto mb-4 text-white/90" />
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Aún no tenés ningún plan activo
          </h2>
          <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
            Probá nuestras demos en vivo o conversá con nuestro equipo para diseñar la solución perfecta para tu negocio.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" variant="outline" asChild className="bg-white text-primary-700 border-white hover:bg-primary-50">
              <Link href="/demo">Probar demos gratis</Link>
            </Button>
            <Button size="lg" asChild className="bg-primary-900 hover:bg-primary-950">
              <Link href="/contact">Hablar con un asesor</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recomendaciones */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>Recomendado para vos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((r) => (
              <div
                key={r.slug}
                className="p-5 rounded-xl border border-secondary-200 dark:border-secondary-800 hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md transition-all bg-white dark:bg-secondary-900 flex flex-col"
              >
                <Badge variant="secondary" size="sm" className="self-start mb-3">{r.tier}</Badge>
                <h3 className="font-bold text-secondary-900 dark:text-white mb-2">{r.name}</h3>
                <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-4 flex-1">{r.desc}</p>
                <p className="text-lg font-bold text-primary-600 dark:text-primary-400 mb-3">
                  {COP(r.price)}
                  <span className="text-xs font-normal text-secondary-500"> /mes</span>
                </p>
                <Button size="sm" fullWidth asChild>
                  <Link href={r.cta}>
                    Quiero este
                    <ArrowRightIcon className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cómo funciona */}
      <HowItWorks />
    </div>
  );
}

// =========================================================================
// Componentes auxiliares
// =========================================================================
function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = 'primary',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  accent?: 'primary' | 'purple' | 'green' | 'blue' | 'orange';
}) {
  const accentMap = {
    primary: 'bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400',
    purple: 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400',
    blue: 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
    orange: 'bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400',
  };
  return (
    <Card variant="bordered" className="hover:shadow-medium transition-shadow">
      <CardContent className="p-5">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${accentMap[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-xs uppercase tracking-wide text-secondary-500 dark:text-secondary-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-secondary-900 dark:text-white">{value}</p>
        {hint && <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-3 rounded-lg border border-secondary-200 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-900 transition-colors group"
    >
      <span className="flex items-center gap-3 text-sm font-medium text-secondary-700 dark:text-secondary-300">
        <Icon className="h-5 w-5 text-secondary-500 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
        {label}
      </span>
      <ArrowRightIcon className="h-4 w-4 text-secondary-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
    </Link>
  );
}

function CommonCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-secondary-200 dark:border-secondary-800">
      <CommonCard
        icon={ChatBubbleLeftRightIcon}
        title="Mensajes"
        description="Conversá con el equipo"
        href="/dashboard/messages"
        color="purple"
      />
      <CommonCard
        icon={CreditCardIcon}
        title="Facturas"
        description="Historial y métodos de pago"
        href="/dashboard/billing"
        color="green"
      />
      <CommonCard
        icon={BellAlertIcon}
        title="Notificaciones"
        description="Alertas recientes"
        href="/dashboard/notifications"
        color="orange"
      />
      <CommonCard
        icon={LifebuoyIcon}
        title="Soporte"
        description="Estamos para ayudarte"
        href="/contact"
        color="blue"
      />
    </div>
  );
}

function CommonCard({
  icon: Icon,
  title,
  description,
  href,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  color: 'purple' | 'green' | 'orange' | 'blue';
}) {
  const colorMap = {
    purple: 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400',
    orange: 'bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400',
    blue: 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
  };
  return (
    <Link
      href={href}
      className="p-4 rounded-xl border border-secondary-200 dark:border-secondary-800 hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md transition-all bg-white dark:bg-secondary-950 flex items-center gap-3 group"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-secondary-900 dark:text-white">{title}</p>
        <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate">{description}</p>
      </div>
      <ArrowRightIcon className="h-4 w-4 text-secondary-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 flex-shrink-0" />
    </Link>
  );
}
