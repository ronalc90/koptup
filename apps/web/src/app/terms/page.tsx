'use client';

import Badge from '@/components/ui/Badge';
import Card, { CardContent } from '@/components/ui/Card';
import {
  DocumentCheckIcon,
  ScaleIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';

export default function TermsPage() {
  const sections = [
    {
      icon: DocumentCheckIcon,
      title: '1. Aceptación de los Términos',
      content: [
        {
          text: 'Al acceder y utilizar los servicios de KopTup - Soluciones Tecnológicas (&quot;KopTup&quot;, &quot;nosotros&quot;, &quot;nuestro&quot;), usted acepta estar legalmente vinculado por estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios.',
        },
        {
          text: 'Estos términos se aplican a todos los usuarios, clientes y visitantes de nuestro sitio web y servicios, incluyendo pero no limitado a: desarrollo de software, desarrollo web, aplicaciones móviles, inteligencia artificial, chatbots, e-commerce, consultoría tecnológica y cualquier otro servicio ofrecido por KopTup.',
        },
        {
          text: 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigencia inmediatamente después de su publicación en nuestro sitio web. Su uso continuado de nuestros servicios constituye su aceptación de los términos modificados.',
        },
      ],
    },
    {
      icon: CodeBracketIcon,
      title: '2. Servicios Ofrecidos',
      content: [
        {
          subtitle: '2.1 Descripción de Servicios',
          text: 'KopTup ofrece servicios profesionales de desarrollo de software y soluciones tecnológicas, incluyendo pero no limitado a: desarrollo de aplicaciones web y móviles, sistemas de inteligencia artificial, chatbots, plataformas de e-commerce, integraciones API, consultoría tecnológica, diseño UX/UI y servicios de mantenimiento.',
        },
        {
          subtitle: '2.2 Alcance del Proyecto',
          text: 'El alcance específico de cada proyecto se definirá en una propuesta comercial o contrato separado. Cada proyecto incluirá: objetivos específicos, entregables, cronograma, presupuesto y condiciones de pago.',
        },
        {
          subtitle: '2.3 Modificaciones al Alcance',
          text: 'Cualquier modificación al alcance original del proyecto debe ser acordada por escrito y puede resultar en ajustes al cronograma y presupuesto. Los cambios significativos pueden requerir una adenda al contrato original.',
        },
      ],
    },
    {
      icon: BanknotesIcon,
      title: '3. Precios y Pagos',
      content: [
        {
          subtitle: '3.1 Precios',
          text: 'Los precios de nuestros servicios se especificarán en la propuesta comercial correspondiente. Todos los precios están expresados en pesos colombianos (COP) o dólares estadounidenses (USD), según se acuerde, y no incluyen impuestos aplicables a menos que se especifique lo contrario.',
        },
        {
          subtitle: '3.2 Condiciones de Pago',
          text: 'Generalmente requerimos un anticipo del 50% al inicio del proyecto y el 50% restante al finalizar. Para proyectos de mayor envergadura, podemos establecer hitos de pago específicos. Los pagos deben realizarse dentro de los 15 días posteriores a la emisión de la factura.',
        },
        {
          subtitle: '3.3 Pagos Atrasados',
          text: 'Los pagos no realizados en la fecha de vencimiento estarán sujetos a un interés moratorio del 1.5% mensual. KopTup se reserva el derecho de suspender los servicios hasta que se regularice el pago.',
        },
        {
          subtitle: '3.4 Gastos Adicionales',
          text: 'Cualquier gasto adicional requerido para el proyecto (licencias de software, servicios de terceros, hosting, etc.) será facturado por separado o incluido en la propuesta si se conoce de antemano.',
        },
      ],
    },
    {
      icon: ScaleIcon,
      title: '4. Propiedad Intelectual',
      content: [
        {
          subtitle: '4.1 Derechos del Cliente',
          text: 'Una vez completado el pago total del proyecto, el cliente recibirá los derechos de uso del software desarrollado específicamente para su proyecto. Esto incluye el código fuente personalizado y los diseños creados exclusivamente para el cliente.',
        },
        {
          subtitle: '4.2 Derechos de KopTup',
          text: 'KopTup retiene la propiedad de: frameworks, herramientas, componentes reutilizables, metodologías y cualquier código o material preexistente utilizado en el proyecto. También nos reservamos el derecho de utilizar el conocimiento general y experiencia adquirida en proyectos futuros.',
        },
        {
          subtitle: '4.3 Licencias de Terceros',
          text: 'El software puede incluir componentes de código abierto o licencias de terceros. El cliente es responsable de cumplir con los términos de dichas licencias. KopTup proporcionará documentación de las licencias utilizadas.',
        },
        {
          subtitle: '4.4 Portfolio y Marketing',
          text: 'KopTup se reserva el derecho de incluir el proyecto en su portfolio, materiales de marketing y estudios de caso, a menos que exista un acuerdo de confidencialidad específico que lo prohíba.',
        },
      ],
    },
    {
      icon: ShieldCheckIcon,
      title: '5. Confidencialidad',
      content: [
        {
          subtitle: '5.1 Información Confidencial',
          text: 'Ambas partes acuerdan mantener confidencial toda información propietaria, comercial o técnica compartida durante la relación comercial. Esto incluye pero no se limita a: código fuente, diseños, estrategias de negocio, datos de clientes y información financiera.',
        },
        {
          subtitle: '5.2 Excepciones',
          text: 'La obligación de confidencialidad no se aplica a información que: sea de dominio público, sea desarrollada independientemente, sea requerida por ley, o sea autorizada por escrito para su divulgación.',
        },
        {
          subtitle: '5.3 Duración',
          text: 'Las obligaciones de confidencialidad permanecerán vigentes durante la relación comercial y por un período de 3 años después de su terminación.',
        },
      ],
    },
    {
      icon: ClockIcon,
      title: '6. Plazos y Entregas',
      content: [
        {
          subtitle: '6.1 Cronograma',
          text: 'Los plazos de entrega se especificarán en la propuesta del proyecto y se consideran estimaciones basadas en el alcance acordado. Haremos nuestro mejor esfuerzo para cumplir con los plazos establecidos.',
        },
        {
          subtitle: '6.2 Retrasos',
          text: 'Los plazos pueden extenderse debido a: cambios en el alcance solicitados por el cliente, retrasos en la provisión de información o materiales necesarios, circunstancias de fuerza mayor, o problemas técnicos imprevistos.',
        },
        {
          subtitle: '6.3 Colaboración del Cliente',
          text: 'El cumplimiento de los plazos depende de la colaboración oportuna del cliente, incluyendo: provisión de contenidos, feedback en tiempo, aprobaciones y acceso a sistemas necesarios.',
        },
      ],
    },
    {
      icon: ExclamationTriangleIcon,
      title: '7. Garantías y Limitaciones',
      content: [
        {
          subtitle: '7.1 Garantía de Servicios',
          text: 'Garantizamos que los servicios se realizarán con profesionalismo y de acuerdo con los estándares de la industria. Proporcionamos un período de garantía de 30-90 días (según lo acordado) para corregir errores o defectos en el código entregado.',
        },
        {
          subtitle: '7.2 Exclusiones de Garantía',
          text: 'La garantía no cubre: problemas causados por modificaciones del cliente, uso inadecuado, cambios en el entorno de hosting, servicios de terceros, o problemas en equipos/software del cliente.',
        },
        {
          subtitle: '7.3 Limitación de Responsabilidad',
          text: 'En ningún caso KopTup será responsable por daños indirectos, incidentales, especiales o consecuentes. Nuestra responsabilidad total no excederá el monto pagado por el cliente para el proyecto específico.',
        },
        {
          subtitle: '7.4 Descargo de Responsabilidad',
          text: 'Los servicios se proporcionan &quot;tal cual&quot;. No garantizamos que el software estará libre de errores o que funcionará sin interrupciones. El cliente es responsable de mantener respaldos adecuados de sus datos.',
        },
      ],
    },
  ];

  const additionalTerms = [
    {
      icon: UserGroupIcon,
      title: '8. Soporte y Mantenimiento',
      content: 'El soporte posterior a la entrega se especifica en el contrato del proyecto. El soporte de garantía cubre la corrección de errores en el código entregado. Los servicios de mantenimiento continuo, actualizaciones de funcionalidades y soporte técnico extendido están disponibles mediante contratos separados.',
    },
    {
      icon: ExclamationTriangleIcon,
      title: '9. Terminación del Servicio',
      content: 'Cualquiera de las partes puede terminar el contrato con 30 días de aviso por escrito. En caso de terminación, el cliente pagará por todo el trabajo completado hasta la fecha. Si el cliente termina el contrato sin causa justificada, el anticipo no será reembolsable. KopTup puede terminar inmediatamente el contrato en caso de incumplimiento material del cliente.',
    },
    {
      icon: ScaleIcon,
      title: '10. Ley Aplicable y Jurisdicción',
      content: 'Estos términos se regirán e interpretarán de acuerdo con las leyes de la República de Colombia. Cualquier disputa derivada de estos términos estará sujeta a la jurisdicción exclusiva de los tribunales de Bogotá, Colombia. Las partes intentarán resolver cualquier disputa mediante negociación de buena fe antes de recurrir a procedimientos legales.',
    },
    {
      icon: DocumentCheckIcon,
      title: '11. Acuerdo Completo',
      content: 'Estos términos, junto con cualquier propuesta o contrato específico del proyecto, constituyen el acuerdo completo entre las partes. Cualquier modificación debe realizarse por escrito y ser firmada por ambas partes. Si alguna disposición se considera inválida, las disposiciones restantes permanecerán en vigor.',
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
              Términos y Condiciones
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Estos términos rigen el uso de nuestros servicios y establecen los derechos y obligaciones entre KopTup y nuestros clientes.
            </p>
            <div className="flex items-center justify-center gap-2 text-primary-100">
              <ScaleIcon className="h-5 w-5" />
              <span>Transparencia y claridad en nuestras relaciones comerciales</span>
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
                  <DocumentCheckIcon className="h-6 w-6 text-white dark:text-secondary-900" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                    Bienvenido a KopTup
                  </h2>
                  <p className="text-secondary-700 dark:text-secondary-300 mb-4">
                    Estos Términos y Condiciones (&quot;Términos&quot;) constituyen un acuerdo legalmente vinculante entre usted (el &quot;Cliente&quot;) y KopTup - Soluciones Tecnológicas (&quot;KopTup&quot;, &quot;nosotros&quot; o &quot;la Empresa&quot;) con respecto al uso de nuestros servicios de desarrollo de software y consultoría tecnológica.
                  </p>
                  <p className="text-secondary-700 dark:text-secondary-300">
                    Por favor, lea estos términos cuidadosamente antes de contratar nuestros servicios. Al utilizar nuestros servicios, usted confirma que ha leído, comprendido y aceptado estos términos en su totalidad.
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
                        {item.subtitle && (
                          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
                            {item.subtitle}
                          </h3>
                        )}
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

      {/* Additional Terms */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {additionalTerms.map((term, index) => {
            const Icon = term.icon;
            return (
              <Card key={index} variant="bordered">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-3">
                        {term.title}
                      </h2>
                      <p className="text-secondary-700 dark:text-secondary-300 leading-relaxed">
                        {term.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Contact Section */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card variant="bordered" className="bg-primary-50 dark:bg-primary-950 border-primary-200 dark:border-primary-800">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4 text-center">
                12. Información de Contacto
              </h2>
              <p className="text-secondary-700 dark:text-secondary-300 mb-6 text-center">
                Si tiene preguntas sobre estos Términos y Condiciones, contáctenos:
              </p>
              <div className="space-y-3 text-secondary-700 dark:text-secondary-300 max-w-md mx-auto">
                <div className="flex items-center gap-3">
                  <strong className="min-w-[100px]">Empresa:</strong>
                  <span>KopTup - Soluciones Tecnológicas</span>
                </div>
                <div className="flex items-center gap-3">
                  <strong className="min-w-[100px]">Email:</strong>
                  <a href="mailto:ronald@koptup.com" className="text-primary-600 dark:text-primary-400 hover:underline">
                    ronald@koptup.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <strong className="min-w-[100px]">Teléfono:</strong>
                  <a href="tel:+573024794842" className="text-primary-600 dark:text-primary-400 hover:underline">
                    +57 302 479 4842
                  </a>
                </div>
                <div className="flex items-start gap-3">
                  <strong className="min-w-[100px]">Dirección:</strong>
                  <span>Av. 68 #1-63, Bogotá, Colombia</span>
                </div>
                <div className="flex items-center gap-3">
                  <strong className="min-w-[100px]">Sitio Web:</strong>
                  <a href="https://www.koptup.com" className="text-primary-600 dark:text-primary-400 hover:underline">
                    www.koptup.com
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
            <a href="/cookies" className="text-primary-600 dark:text-primary-400 hover:underline">
              Política de Cookies
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
