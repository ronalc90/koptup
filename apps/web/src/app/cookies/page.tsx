'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  CakeIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export default function CookiesPage() {
  const t = useTranslations('cookiesPage');
  const [essentialEnabled, setEssentialEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [functionalEnabled, setFunctionalEnabled] = useState(false);

  const cookieTypes = [
    {
      icon: ShieldCheckIcon,
      title: 'Cookies Esenciales',
      description: 'Cookies necesarias para el funcionamiento básico del sitio web',
      required: true,
      enabled: essentialEnabled,
      setEnabled: setEssentialEnabled,
      cookies: [
        {
          name: 'session_id',
          purpose: 'Mantener la sesión del usuario',
          duration: 'Sesión',
          type: 'Primera parte',
        },
        {
          name: 'auth_token',
          purpose: 'Autenticación y seguridad',
          duration: '7 días',
          type: 'Primera parte',
        },
        {
          name: 'csrf_token',
          purpose: 'Protección contra ataques CSRF',
          duration: 'Sesión',
          type: 'Primera parte',
        },
        {
          name: 'cookie_consent',
          purpose: 'Almacenar preferencias de cookies',
          duration: '1 año',
          type: 'Primera parte',
        },
      ],
    },
    {
      icon: Cog6ToothIcon,
      title: 'Cookies Funcionales',
      description: 'Cookies que mejoran la funcionalidad y personalización',
      required: false,
      enabled: functionalEnabled,
      setEnabled: setFunctionalEnabled,
      cookies: [
        {
          name: 'language',
          purpose: 'Recordar preferencia de idioma',
          duration: '1 año',
          type: 'Primera parte',
        },
        {
          name: 'theme',
          purpose: 'Recordar tema (claro/oscuro)',
          duration: '1 año',
          type: 'Primera parte',
        },
        {
          name: 'user_preferences',
          purpose: 'Almacenar configuraciones del usuario',
          duration: '6 meses',
          type: 'Primera parte',
        },
      ],
    },
    {
      icon: ChartBarIcon,
      title: 'Cookies Analíticas',
      description: 'Cookies que nos ayudan a entender cómo se utiliza el sitio',
      required: false,
      enabled: analyticsEnabled,
      setEnabled: setAnalyticsEnabled,
      cookies: [
        {
          name: '_ga',
          purpose: 'Google Analytics - Distinguir usuarios',
          duration: '2 años',
          type: 'Terceros (Google)',
        },
        {
          name: '_gid',
          purpose: 'Google Analytics - Distinguir usuarios',
          duration: '24 horas',
          type: 'Terceros (Google)',
        },
        {
          name: '_gat',
          purpose: 'Google Analytics - Limitar tasa de solicitudes',
          duration: '1 minuto',
          type: 'Terceros (Google)',
        },
      ],
    },
  ];

  const handleSavePreferences = () => {
    const preferences = {
      essential: essentialEnabled,
      functional: functionalEnabled,
      analytics: analyticsEnabled,
      timestamp: new Date().toISOString(),
    };

    // En un caso real, aquí guardarías las preferencias
    localStorage.setItem('cookie_preferences', JSON.stringify(preferences));

    alert('Preferencias guardadas correctamente');
  };

  const handleAcceptAll = () => {
    setEssentialEnabled(true);
    setFunctionalEnabled(true);
    setAnalyticsEnabled(true);

    const preferences = {
      essential: true,
      functional: true,
      analytics: true,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem('cookie_preferences', JSON.stringify(preferences));
    alert('Todas las cookies han sido aceptadas');
  };

  const handleRejectOptional = () => {
    setEssentialEnabled(true);
    setFunctionalEnabled(false);
    setAnalyticsEnabled(false);

    const preferences = {
      essential: true,
      functional: false,
      analytics: false,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem('cookie_preferences', JSON.stringify(preferences));
    alert('Solo cookies esenciales están habilitadas');
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" size="lg" className="mb-6 border-white/30 text-white">
              Actualizado: Noviembre 2025
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              {t('hero.subtitle')}
            </p>
            <div className="flex items-center justify-center gap-2 text-primary-100">
              <CakeIcon className="h-5 w-5" />
              <span>Preferencias transparentes y controladas por ti</span>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card variant="bordered" className="bg-primary-50 dark:bg-primary-950 border-primary-200 dark:border-primary-800">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-600 dark:bg-primary-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CakeIcon className="h-6 w-6 text-white dark:text-secondary-900" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                    ¿Qué son las Cookies?
                  </h2>
                  <p className="text-secondary-700 dark:text-secondary-300 mb-4">
                    Las cookies son pequeños archivos de texto que se almacenan en su dispositivo (computadora, tablet o móvil) cuando visita un sitio web. Las cookies permiten que el sitio web recuerde sus acciones y preferencias durante un período de tiempo, para que no tenga que volver a configurarlas cada vez que regrese al sitio o navegue de una página a otra.
                  </p>
                  <p className="text-secondary-700 dark:text-secondary-300">
                    En KopTup utilizamos cookies para mejorar su experiencia de navegación, analizar el uso de nuestro sitio y personalizar el contenido. Esta política explica qué cookies utilizamos y por qué.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Types of Cookies */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              Tipos de Cookies que Utilizamos
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              A continuación se detallan los diferentes tipos de cookies que utilizamos en nuestro sitio web
            </p>
          </div>

          <div className="space-y-6">
            {cookieTypes.map((type, index) => {
              const Icon = type.icon;
              return (
                <Card key={index} variant="bordered" className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header */}
                    <div className="bg-primary-50 dark:bg-primary-950 p-6 border-b border-secondary-200 dark:border-secondary-800">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 bg-primary-600 dark:bg-primary-400 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon className="h-6 w-6 text-white dark:text-secondary-900" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">
                              {type.title}
                            </h3>
                            <p className="text-secondary-700 dark:text-secondary-300 mb-3">
                              {type.description}
                            </p>
                            {type.required && (
                              <Badge variant="secondary" size="sm">
                                Siempre Activas
                              </Badge>
                            )}
                          </div>
                        </div>
                        {!type.required && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => type.setEnabled(!type.enabled)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                type.enabled
                                  ? 'bg-primary-600'
                                  : 'bg-secondary-300 dark:bg-secondary-700'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  type.enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cookie Details */}
                    <div className="p-6">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-secondary-200 dark:border-secondary-800">
                              <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-900 dark:text-white">
                                Nombre
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-900 dark:text-white">
                                Propósito
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-900 dark:text-white">
                                Duración
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-900 dark:text-white">
                                Tipo
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {type.cookies.map((cookie, idx) => (
                              <tr
                                key={idx}
                                className="border-b border-secondary-100 dark:border-secondary-800 last:border-0"
                              >
                                <td className="py-3 px-4 text-sm font-mono text-secondary-900 dark:text-white">
                                  {cookie.name}
                                </td>
                                <td className="py-3 px-4 text-sm text-secondary-700 dark:text-secondary-300">
                                  {cookie.purpose}
                                </td>
                                <td className="py-3 px-4 text-sm text-secondary-700 dark:text-secondary-300">
                                  {cookie.duration}
                                </td>
                                <td className="py-3 px-4 text-sm text-secondary-700 dark:text-secondary-300">
                                  {cookie.type}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cookie Preferences */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card variant="bordered" className="bg-primary-50 dark:bg-primary-950 border-primary-200 dark:border-primary-800">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-6 text-center">
                Administrar Preferencias de Cookies
              </h2>
              <p className="text-secondary-700 dark:text-secondary-300 mb-6 text-center">
                Puede cambiar sus preferencias de cookies en cualquier momento utilizando los controles a continuación
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleAcceptAll}
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Aceptar Todas
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleRejectOptional}
                >
                  <XCircleIcon className="h-5 w-5 mr-2" />
                  Solo Esenciales
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleSavePreferences}
                >
                  Guardar Preferencias
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Additional Information */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Card variant="bordered">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                Cómo Controlar las Cookies
              </h2>
              <div className="space-y-4 text-secondary-700 dark:text-secondary-300">
                <p>
                  Puede controlar y/o eliminar las cookies como desee. Para obtener más detalles, consulte{' '}
                  <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
                    aboutcookies.org
                  </a>.
                </p>

                <div>
                  <h3 className="font-semibold text-secondary-900 dark:text-white mb-2">
                    Configuración del Navegador
                  </h3>
                  <p className="mb-2">
                    La mayoría de los navegadores web permiten controlar las cookies a través de su configuración. Para obtener información sobre cómo hacerlo en navegadores populares:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>
                      <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
                        Google Chrome
                      </a>
                    </li>
                    <li>
                      <a href="https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en-" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
                        Mozilla Firefox
                      </a>
                    </li>
                    <li>
                      <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
                        Safari
                      </a>
                    </li>
                    <li>
                      <a href="https://support.microsoft.com/es-es/windows/eliminar-y-administrar-cookies" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
                        Microsoft Edge
                      </a>
                    </li>
                  </ul>
                </div>

                <p>
                  Tenga en cuenta que si bloquea o elimina las cookies, algunas partes de nuestro sitio web pueden no funcionar correctamente.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                Cookies de Terceros
              </h2>
              <p className="text-secondary-700 dark:text-secondary-300 mb-4">
                Algunos de nuestros socios comerciales utilizan cookies en nuestro sitio (por ejemplo, Google Analytics). No tenemos acceso ni control sobre estas cookies. Esta política de cookies cubre el uso de cookies por parte de KopTup y no el uso de cookies por parte de terceros.
              </p>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-secondary-900 dark:text-white mb-2">
                    Google Analytics
                  </h3>
                  <p className="text-secondary-700 dark:text-secondary-300 text-sm">
                    Utilizamos Google Analytics para analizar el uso de nuestro sitio web. Para más información sobre cómo Google utiliza los datos, visite{' '}
                    <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
                      políticas de Google
                    </a>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                Actualizaciones de esta Política
              </h2>
              <p className="text-secondary-700 dark:text-secondary-300 mb-4">
                Podemos actualizar esta Política de Cookies periódicamente para reflejar cambios en las cookies que utilizamos o por otras razones operativas, legales o reglamentarias.
              </p>
              <p className="text-secondary-700 dark:text-secondary-300">
                Le recomendamos que revise esta página regularmente para mantenerse informado sobre nuestro uso de cookies y tecnologías relacionadas.
              </p>
            </CardContent>
          </Card>

          <Card variant="bordered" className="bg-primary-50 dark:bg-primary-950 border-primary-200 dark:border-primary-800">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                Contacto
              </h2>
              <p className="text-secondary-700 dark:text-secondary-300 mb-4">
                Si tiene preguntas sobre nuestra Política de Cookies, contáctenos:
              </p>
              <div className="space-y-2 text-secondary-700 dark:text-secondary-300">
                <div className="flex items-center gap-2">
                  <strong>Email:</strong>
                  <a href="mailto:ronald@koptup.com" className="text-primary-600 dark:text-primary-400 hover:underline">
                    ronald@koptup.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <strong>Teléfono:</strong>
                  <a href="tel:+573024794842" className="text-primary-600 dark:text-primary-400 hover:underline">
                    +57 302 479 4842
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer Note */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-secondary-600 dark:text-secondary-400 mb-4">
            <ClockIcon className="h-5 w-5" />
            <span className="text-sm">Última actualización: Noviembre 2025</span>
          </div>
          <p className="text-sm text-secondary-500 dark:text-secondary-500 mb-2">
            © 2025 KopTup - Soluciones Tecnológicas. Todos los derechos reservados.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <a href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
              Política de Privacidad
            </a>
            <span className="text-secondary-400">•</span>
            <a href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">
              Términos y Condiciones
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
