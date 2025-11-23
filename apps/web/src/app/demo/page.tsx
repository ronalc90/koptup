'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  ChatBubbleLeftRightIcon,
  ShoppingCartIcon,
  SparklesIcon,
  ArrowRightIcon,
  LockClosedIcon,
  XMarkIcon,
  KeyIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CalendarIcon,
  PencilSquareIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';

export default function DemosPage() {
  const t = useTranslations('demos');
  const tc = useTranslations('common');
  const router = useRouter();

  const [showCodeModal, setShowCodeModal] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');

  const demos = [
    {
      id: 'chatbot',
      title: t('chatbot.title'),
      description: t('chatbot.description'),
      icon: ChatBubbleLeftRightIcon,
      href: '/demo/chatbot',
      color: 'from-primary-600 to-primary-800',
      badge: t('chatbot.badge'),
      features: [
        t('chatbot.features.0'),
        t('chatbot.features.1'),
        t('chatbot.features.2'),
        t('chatbot.features.3'),
      ],
    },
    {
      id: 'ecommerce',
      title: t('ecommerce.title'),
      description: t('ecommerce.description'),
      icon: ShoppingCartIcon,
      href: '/demo/ecommerce',
      color: 'from-green-600 to-emerald-800',
      badge: t('ecommerce.badge'),
      features: [
        t('ecommerce.features.0'),
        t('ecommerce.features.1'),
        t('ecommerce.features.2'),
        t('ecommerce.features.3'),
      ],
    },
    {
      id: 'dashboard-ejecutivo',
      title: 'Dashboard Ejecutivo Empresarial',
      description: 'Panel de control premium estilo CEO con KPIs, gráficos y analytics en tiempo real',
      icon: ChartBarIcon,
      href: '/demo/dashboard-ejecutivo',
      color: 'from-purple-600 to-purple-800',
      badge: 'Nuevo',
      features: [
        'Tarjetas KPI con animaciones suaves',
        'Gráficos interactivos de ingresos y desempeño',
        'Insights inteligentes y recomendaciones',
        'Sidebar moderno con navegación premium',
      ],
    },
    {
      id: 'gestor-documentos',
      title: 'Gestor de Documentos con IA',
      description: 'Organiza y busca archivos de forma inteligente con búsqueda semántica',
      icon: DocumentTextIcon,
      href: '/demo/gestor-documentos',
      color: 'from-blue-600 to-blue-800',
      badge: 'Nuevo',
      features: [
        'Búsqueda semántica avanzada',
        'Previsualizador PDF elegante',
        'Resumen automático con IA',
        'Comparación de documentos',
      ],
    },
    {
      id: 'sistema-reservas',
      title: 'Sistema de Reservas Profesional',
      description: 'Plataforma moderna de reservas estilo Booking Premium para servicios',
      icon: CalendarIcon,
      href: '/demo/sistema-reservas',
      color: 'from-orange-600 to-orange-800',
      badge: 'Nuevo',
      features: [
        'Calendario interactivo mensual y semanal',
        'Flujo de reserva optimizado',
        'Panel de gestión de reservas',
        'Sistema de estados y confirmaciones',
      ],
    },
    {
      id: 'gestor-contenido',
      title: 'Gestor de Contenido Corporativo',
      description: 'Crea textos empresariales profesionales con plantillas y asistencia de IA',
      icon: PencilSquareIcon,
      href: '/demo/gestor-contenido',
      color: 'from-pink-600 to-pink-800',
      badge: 'Nuevo',
      features: [
        'Plantillas corporativas prediseñadas',
        'Editor profesional con previsualización',
        'Herramientas de IA para mejorar textos',
        'Exportación PDF y Word',
      ],
    },
    {
      id: 'control-proyectos',
      title: 'Sistema de Control de Proyectos',
      description: 'Gestiona proyectos y tareas con tablero Kanban estilo Trello Premium',
      icon: RectangleStackIcon,
      href: '/demo/control-proyectos',
      color: 'from-teal-600 to-teal-800',
      badge: 'Nuevo',
      features: [
        'Tablero Kanban con drag & drop',
        'Gestión de tareas con prioridades',
        'Vista de calendario y progreso',
        'Comentarios y archivos adjuntos',
      ],
    },
  ];

  const handleCodeSubmit = () => {
    setError('');
    if (accessCode === '2020') {
      router.push('/demo/cuentas-medicas');
    } else {
      setError('Código inválido. Por favor intente nuevamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-black dark:to-primary-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="outline" size="lg" className="mb-6 border-white/30 text-white">
            {t('badge')}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {t('title')}
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-primary-100 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
          <div className="flex items-center justify-center gap-2 text-primary-100">
            <SparklesIcon className="h-5 w-5" />
            <span className="text-sm">{t('interactive')}</span>
          </div>
        </div>
      </section>

      {/* Demos Grid */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {demos.map((demo) => {
              const Icon = demo.icon;
              return (
                <Link
                  key={demo.id}
                  href={demo.href}
                  className="group"
                >
                  <Card
                    variant="bordered"
                    className="h-full hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                  >
                    <CardContent className="p-0">
                      {/* Header with gradient */}
                      <div className={`bg-gradient-to-br ${demo.color} p-8 relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                        <div className="relative">
                          <div className="flex items-start justify-between mb-4">
                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                              <Icon className="h-10 w-10 text-white" />
                            </div>
                            <Badge variant="outline" size="sm" className="border-white/30 text-white">
                              {demo.badge}
                            </Badge>
                          </div>
                          <h2 className="text-3xl font-bold text-white mb-3">
                            {demo.title}
                          </h2>
                          <p className="text-lg text-white/90">
                            {demo.description}
                          </p>
                        </div>
                      </div>

                      {/* Features List */}
                      <div className="p-8">
                        <h3 className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 uppercase tracking-wide mb-4">
                          {t('includes')}
                        </h3>
                        <ul className="space-y-3 mb-6">
                          {demo.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <div className="mt-1">
                                <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center flex-shrink-0">
                                  <SparklesIcon className="h-3 w-3 text-primary-600 dark:text-primary-400" />
                                </div>
                              </div>
                              <span className="text-secondary-700 dark:text-secondary-300">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {/* CTA */}
                        <div className="flex items-center justify-between pt-6 border-t border-secondary-200 dark:border-secondary-700">
                          <span className="text-primary-600 dark:text-primary-400 font-semibold group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                            {t('tryDemo')}
                          </span>
                          <ArrowRightIcon className="h-5 w-5 text-primary-600 dark:text-primary-400 group-hover:translate-x-2 transition-transform" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Info Section */}
          <div className="mt-16 text-center">
            <Card variant="elevated" className="max-w-3xl mx-auto">
              <CardContent className="p-8">
                <SparklesIcon className="h-12 w-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-3">
                  {t('custom.title')}
                </h3>
                <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                  {t('custom.description')}
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                  >
                    {t('custom.button')}
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => setShowCodeModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-secondary-600 hover:bg-secondary-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <KeyIcon className="h-4 w-4" />
                    Acceso con Código
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Code Access Modal */}
      {showCodeModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowCodeModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <Card variant="elevated" className="shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary-100 dark:bg-primary-950 rounded-full">
                      <LockClosedIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 dark:text-white">
                      Acceso con Código
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowCodeModal(false)}
                    className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                  </button>
                </div>

                <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                  Ingrese el código de acceso para ver demos personalizados para su producto.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Código de Acceso
                    </label>
                    <input
                      type="text"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCodeSubmit()}
                      placeholder="Ingrese su código"
                      className="w-full px-4 py-3 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowCodeModal(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCodeSubmit}
                      variant="primary"
                      className="flex-1"
                    >
                      Acceder
                    </Button>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-secondary-200 dark:border-secondary-700">
                  <p className="text-xs text-secondary-500 dark:text-secondary-500 text-center">
                    ¿No tienes un código? Contacta con nuestro equipo de ventas.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
