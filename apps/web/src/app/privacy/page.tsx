'use client';

import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';
import Card, { CardContent } from '@/components/ui/Card';
import {
  ShieldCheckIcon,
  LockClosedIcon,
  UserGroupIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function PrivacyPage() {
  const t = useTranslations('privacyPage');
  const sections = [
    {
      icon: DocumentTextIcon,
      title: '1. Información que Recopilamos',
      content: [
        {
          subtitle: '1.1 Información Personal',
          text: 'Recopilamos información que usted nos proporciona directamente, incluyendo: nombre, correo electrónico, número de teléfono, empresa, información de facturación y cualquier otra información que decida compartir con nosotros al utilizar nuestros servicios.',
        },
        {
          subtitle: '1.2 Información de Uso',
          text: 'Recopilamos automáticamente información sobre su interacción con nuestros servicios, incluyendo: dirección IP, tipo de navegador, páginas visitadas, tiempo de permanencia, cookies y datos de análisis web.',
        },
        {
          subtitle: '1.3 Información de Proyectos',
          text: 'Cuando contrata nuestros servicios, recopilamos información relacionada con el proyecto: requisitos técnicos, documentación, archivos compartidos y comunicaciones relacionadas con el desarrollo.',
        },
      ],
    },
    {
      icon: UserGroupIcon,
      title: '2. Cómo Utilizamos su Información',
      content: [
        {
          subtitle: '2.1 Prestación de Servicios',
          text: 'Utilizamos su información para proporcionar, mantener y mejorar nuestros servicios de desarrollo de software, consultoría tecnológica y soluciones digitales.',
        },
        {
          subtitle: '2.2 Comunicación',
          text: 'Para comunicarnos con usted sobre sus proyectos, actualizaciones de servicios, soporte técnico y responder a sus consultas.',
        },
        {
          subtitle: '2.3 Mejora de Servicios',
          text: 'Analizamos el uso de nuestros servicios para mejorar la experiencia del usuario, desarrollar nuevas funcionalidades y optimizar nuestros procesos.',
        },
        {
          subtitle: '2.4 Marketing',
          text: 'Con su consentimiento, podemos enviarle información sobre nuevos servicios, actualizaciones y ofertas especiales. Puede cancelar la suscripción en cualquier momento.',
        },
      ],
    },
    {
      icon: LockClosedIcon,
      title: '3. Protección de Datos',
      content: [
        {
          subtitle: '3.1 Medidas de Seguridad',
          text: 'Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger su información personal contra acceso no autorizado, alteración, divulgación o destrucción. Esto incluye encriptación SSL/TLS, firewalls, controles de acceso y auditorías de seguridad regulares.',
        },
        {
          subtitle: '3.2 Acceso Limitado',
          text: 'El acceso a su información personal está limitado a empleados, contratistas y agentes que necesitan conocer dicha información para procesarla en nuestro nombre y están sujetos a obligaciones de confidencialidad.',
        },
        {
          subtitle: '3.3 Almacenamiento',
          text: 'Sus datos se almacenan en servidores seguros ubicados en centros de datos certificados. Utilizamos proveedores de servicios en la nube de confianza como AWS que cumplen con estándares internacionales de seguridad.',
        },
      ],
    },
    {
      icon: ShieldCheckIcon,
      title: '4. Compartir Información',
      content: [
        {
          subtitle: '4.1 Proveedores de Servicios',
          text: 'Compartimos información con proveedores de servicios externos que nos ayudan a operar nuestro negocio (hosting, análisis, procesamiento de pagos), quienes están obligados a proteger su información.',
        },
        {
          subtitle: '4.2 Requisitos Legales',
          text: 'Podemos divulgar su información si lo requiere la ley, una orden judicial o para proteger nuestros derechos, propiedad o seguridad.',
        },
        {
          subtitle: '4.3 Transferencias Empresariales',
          text: 'En caso de fusión, adquisición o venta de activos, su información personal puede ser transferida. Le notificaremos antes de que su información sea transferida y esté sujeta a una política de privacidad diferente.',
        },
        {
          subtitle: '4.4 No Venta de Datos',
          text: 'KopTup NO vende, alquila ni comercializa su información personal a terceros para fines publicitarios.',
        },
      ],
    },
    {
      icon: ClockIcon,
      title: '5. Retención de Datos',
      content: [
        {
          subtitle: '5.1 Período de Retención',
          text: 'Retenemos su información personal durante el tiempo necesario para cumplir con los fines establecidos en esta política, a menos que la ley requiera o permita un período de retención más largo.',
        },
        {
          subtitle: '5.2 Datos de Proyectos',
          text: 'Los datos relacionados con proyectos se mantienen durante la duración del proyecto y un período adicional para fines de soporte y garantía, típicamente entre 1-3 años después de la finalización.',
        },
        {
          subtitle: '5.3 Eliminación',
          text: 'Cuando ya no necesitemos su información, la eliminaremos de forma segura o la anonimizaremos de manera que no pueda identificarlo.',
        },
      ],
    },
  ];

  const rights = [
    {
      title: 'Acceso',
      description: 'Solicitar una copia de la información personal que tenemos sobre usted.',
    },
    {
      title: 'Rectificación',
      description: 'Solicitar la corrección de información inexacta o incompleta.',
    },
    {
      title: 'Eliminación',
      description: 'Solicitar la eliminación de su información personal bajo ciertas circunstancias.',
    },
    {
      title: 'Portabilidad',
      description: 'Recibir su información en un formato estructurado y de uso común.',
    },
    {
      title: 'Oposición',
      description: 'Oponerse al procesamiento de su información para ciertos fines.',
    },
    {
      title: 'Limitación',
      description: 'Solicitar que limitemos el procesamiento de su información.',
    },
  ];

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
              <ShieldCheckIcon className="h-5 w-5" />
              <span>Su confianza es nuestra prioridad</span>
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
                  <DocumentTextIcon className="h-6 w-6 text-white dark:text-secondary-900" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                    Introducción
                  </h2>
                  <p className="text-secondary-700 dark:text-secondary-300 mb-4">
                    KopTup - Soluciones Tecnológicas (&quot;nosotros&quot;, &quot;nuestro&quot; o &quot;la empresa&quot;) se compromete a proteger la privacidad de nuestros clientes y usuarios. Esta Política de Privacidad describe cómo recopilamos, utilizamos, compartimos y protegemos la información personal cuando utiliza nuestros servicios de desarrollo de software, consultoría tecnológica y soluciones digitales.
                  </p>
                  <p className="text-secondary-700 dark:text-secondary-300">
                    Al utilizar nuestros servicios, usted acepta las prácticas descritas en esta política. Si no está de acuerdo con esta política, por favor no utilice nuestros servicios.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Sections */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={index} variant="bordered" className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-primary-50 dark:bg-primary-950 p-6 border-b border-secondary-200 dark:border-secondary-800">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-600 dark:bg-primary-400 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-white dark:text-secondary-900" />
                      </div>
                      <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
                        {section.title}
                      </h2>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    {section.content.map((item, idx) => (
                      <div key={idx}>
                        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
                          {item.subtitle}
                        </h3>
                        <p className="text-secondary-700 dark:text-secondary-300 leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* User Rights */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              Sus Derechos
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              Usted tiene derecho a controlar su información personal. A continuación se detallan sus derechos:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rights.map((right, index) => (
              <Card key={index} variant="bordered" className="hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <ShieldCheckIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                    <h3 className="text-lg font-bold text-secondary-900 dark:text-white">
                      {right.title}
                    </h3>
                  </div>
                  <p className="text-secondary-700 dark:text-secondary-300 text-sm">
                    {right.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card variant="bordered" className="mt-8 bg-secondary-50 dark:bg-secondary-900">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-3">
                Cómo Ejercer sus Derechos
              </h3>
              <p className="text-secondary-700 dark:text-secondary-300 mb-4">
                Para ejercer cualquiera de estos derechos, contáctenos a través de:
              </p>
              <div className="flex flex-col sm:flex-row gap-4 text-secondary-700 dark:text-secondary-300">
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <a href="mailto:ronald@koptup.com" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    ronald@koptup.com
                  </a>
                </div>
              </div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-4">
                Responderemos a su solicitud dentro de 30 días hábiles.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Additional Sections */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Cookies */}
          <Card variant="bordered">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                6. Cookies y Tecnologías Similares
              </h2>
              <p className="text-secondary-700 dark:text-secondary-300 mb-4">
                Utilizamos cookies y tecnologías similares para mejorar su experiencia, analizar el uso de nuestros servicios y personalizar el contenido. Las cookies son pequeños archivos de texto que se almacenan en su dispositivo.
              </p>
              <p className="text-secondary-700 dark:text-secondary-300 mb-4">
                Puede controlar el uso de cookies a través de la configuración de su navegador. Sin embargo, tenga en cuenta que deshabilitar las cookies puede afectar la funcionalidad de nuestros servicios.
              </p>
              <p className="text-secondary-700 dark:text-secondary-300">
                Para más información, consulte nuestra <a href="/cookies" className="text-primary-600 dark:text-primary-400 hover:underline">Política de Cookies</a>.
              </p>
            </CardContent>
          </Card>

          {/* International Transfers */}
          <Card variant="bordered">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                7. Transferencias Internacionales
              </h2>
              <p className="text-secondary-700 dark:text-secondary-300 mb-4">
                Su información puede ser transferida y almacenada en servidores ubicados fuera de Colombia. Tomamos medidas para garantizar que su información reciba un nivel adecuado de protección dondequiera que se procese.
              </p>
              <p className="text-secondary-700 dark:text-secondary-300">
                Al utilizar nuestros servicios, usted consiente estas transferencias internacionales de su información.
              </p>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card variant="bordered">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                8. Privacidad de Menores
              </h2>
              <p className="text-secondary-700 dark:text-secondary-300">
                Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos intencionalmente información personal de menores. Si descubrimos que hemos recopilado información de un menor sin el consentimiento parental apropiado, eliminaremos esa información inmediatamente.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Policy */}
          <Card variant="bordered">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                9. Cambios a esta Política
              </h2>
              <p className="text-secondary-700 dark:text-secondary-300 mb-4">
                Podemos actualizar esta Política de Privacidad periódicamente para reflejar cambios en nuestras prácticas o por otras razones operativas, legales o reglamentarias. La fecha de &quot;Última actualización&quot; en la parte superior indica cuándo se revisó la política por última vez.
              </p>
              <p className="text-secondary-700 dark:text-secondary-300">
                Le notificaremos sobre cambios materiales publicando la nueva política en nuestro sitio web y, cuando sea apropiado, por correo electrónico. Le recomendamos revisar esta política periódicamente.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card variant="bordered" className="bg-primary-50 dark:bg-primary-950 border-primary-200 dark:border-primary-800">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                10. Contacto
              </h2>
              <p className="text-secondary-700 dark:text-secondary-300 mb-4">
                Si tiene preguntas, inquietudes o solicitudes relacionadas con esta Política de Privacidad o nuestras prácticas de manejo de datos, contáctenos:
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
                <div className="flex items-start gap-2">
                  <strong>Dirección:</strong>
                  <span>Av. 68 #1-63, Bogotá, Colombia</span>
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
          <p className="text-sm text-secondary-500 dark:text-secondary-500">
            © 2025 KopTup - Soluciones Tecnológicas. Todos los derechos reservados.
          </p>
        </div>
      </section>
    </>
  );
}
