'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { FaWhatsapp, FaLinkedin } from 'react-icons/fa';

// TODO: extract to i18n
const SERVICE_NAME_BY_SLUG: Record<string, string> = {
  'chatbot-rag-ia': 'Chatbot RAG con IA',
  'agente-ia-ventas': 'Agente IA de Ventas',
  'desarrollo-web': 'Desarrollo web a medida',
  'ecommerce': 'E-commerce',
  'auditoria-cups': 'Auditoría CUPS',
  'liquidacion': 'Liquidación de salud',
};

function ContactPageInner() {
  const t = useTranslations('contactPage');
  const searchParams = useSearchParams();
  const queryService = searchParams.get('service');
  const queryPlan = searchParams.get('plan');

  const cotizandoLabel = queryService
    ? (SERVICE_NAME_BY_SLUG[queryService] || queryService.replace(/-/g, ' '))
    : null;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    budget: '',
    message: '',
    timeline: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [error, setError] = useState('');

  // Pre-llenar form si vienen query params
  useEffect(() => {
    if (cotizandoLabel) {
      setFormData((prev) => ({
        ...prev,
        service: cotizandoLabel,
        message: prev.message
          ? prev.message
          : `Hola, estoy interesado en cotizar ${cotizandoLabel}${queryPlan ? ` (plan ${queryPlan})` : ''}.`,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cotizandoLabel, queryPlan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await api.submitContactForm(formData);

      setIsSubmitted(true);

      // Reset form después de 6 segundos (más tiempo para que el usuario vea el CTA)
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          service: '',
          budget: '',
          message: '',
          timeline: '',
        });
      }, 6000);
    } catch (err: any) {
      console.error('Error submitting contact form:', err);
      setError(t('form.errorSubmit'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleScheduleCall = () => {
    setIsScheduling(true);

    // Crear el mailto con ambos destinatarios
    const recipients = 'ronald@koptup.com,ronalddemiancipagauta@gmail.com';
    const subject = encodeURIComponent(t('schedule.emailSubject'));
    const body = encodeURIComponent(t('schedule.emailBody'));

    // Abrir cliente de email con los datos
    window.location.href = `mailto:${recipients}?subject=${subject}&body=${body}`;

    // Reset después de un momento
    setTimeout(() => {
      setIsScheduling(false);
    }, 1000);
  };

  const contactInfo = [
    {
      icon: EnvelopeIcon,
      title: t('info.email.title'),
      content: 'ronald@koptup.com',
      link: 'mailto:ronald@koptup.com',
    },
    {
      icon: PhoneIcon,
      title: t('info.phone.title'),
      content: '+57 302 479 4842',
      link: 'tel:+573024794842',
    },
    {
      icon: MapPinIcon,
      title: t('info.location.title'),
      content: 'Av. 68 #1-63, Bogotá, Colombia',
      link: 'https://www.google.com/maps/search/?api=1&query=Av.+68+1-63+Bogota+Colombia',
    },
    {
      icon: ClockIcon,
      title: t('info.hours.title'),
      content: t('info.hours.value'),
      link: null,
    },
  ];

  const services = [
    t('services.ecommerce'),
    t('services.chatbot'),
    t('services.webDev'),
    t('services.mobileDev'),
    t('services.apiIntegrations'),
    t('services.uxui'),
    t('services.consulting'),
    t('services.other'),
  ];

  const budgetRanges = [
    t('budgetRanges.1'),
    t('budgetRanges.2'),
    t('budgetRanges.3'),
    t('budgetRanges.4'),
    t('budgetRanges.5'),
  ];

  const faqs = [
    {
      question: t('faq.items.time.question'),
      answer: t('faq.items.time.answer'),
    },
    {
      question: t('faq.items.guarantee.question'),
      answer: t('faq.items.guarantee.answer'),
    },
    {
      question: t('faq.items.startups.question'),
      answer: t('faq.items.startups.answer'),
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" size="lg" className="mb-6 border-white/30 text-white">
              {t('badge')}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-primary-100">
              {t('hero.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info Section */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              {/* Banner cotizando — pre-fill desde /services o /pricing */}
              {/* TODO: extract to i18n */}
              {cotizandoLabel && (
                <Card
                  variant="bordered"
                  className="mb-6 border-primary-300 dark:border-primary-700 bg-gradient-to-r from-primary-50 to-white dark:from-primary-950 dark:to-secondary-950"
                >
                  <CardContent className="p-5 flex items-center gap-4 flex-wrap">
                    <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
                      <SparklesIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-wide font-semibold text-primary-700 dark:text-primary-300">
                        Estás cotizando
                      </p>
                      <p className="text-base font-bold text-secondary-900 dark:text-white">
                        {cotizandoLabel}
                        {queryPlan && <span className="text-secondary-600 dark:text-secondary-400"> — Plan {queryPlan}</span>}
                      </p>
                    </div>
                    <Badge variant="primary" size="sm">Solicitud pre-llenada</Badge>
                  </CardContent>
                </Card>
              )}

              <Card variant="bordered" className="shadow-xl">
                <CardHeader>
                  <CardTitle className="text-3xl">{t('form.title')}</CardTitle>
                  <CardDescription>
                    {t('form.subtitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isSubmitted ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircleIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
                        {t('form.success.title')}
                      </h3>
                      <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                        {t('form.success.subtitle')}
                      </p>
                      {/* CTA crear cuenta para seguir conversación — TODO: extract to i18n */}
                      <div className="max-w-md mx-auto p-4 rounded-lg bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800">
                        <p className="text-sm text-secondary-700 dark:text-secondary-300 mb-3">
                          Creá tu cuenta para hacer seguimiento de esta solicitud desde tu dashboard.
                        </p>
                        <Button size="sm" fullWidth asChild>
                          <Link
                            href={`/register?source=contact${queryService ? `&service=${queryService}` : ''}${queryPlan ? `&plan=${queryService || ''}&tier=${queryPlan}` : ''}`}
                          >
                            Crear mi cuenta para seguir hablando
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Error Message */}
                      {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            {t('form.name')} *
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder={t('form.namePlaceholder')}
                          />
                        </div>

                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            {t('form.email')} *
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder={t('form.emailPlaceholder')}
                          />
                        </div>

                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            {t('form.phone')}
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder={t('form.phonePlaceholder')}
                          />
                        </div>

                        <div>
                          <label htmlFor="company" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            {t('form.company')}
                          </label>
                          <input
                            type="text"
                            id="company"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder={t('form.companyPlaceholder')}
                          />
                        </div>

                        <div>
                          <label htmlFor="service" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            {t('form.service')} *
                          </label>
                          <select
                            id="service"
                            name="service"
                            required
                            value={formData.service}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">{t('form.servicePlaceholder')}</option>
                            {services.map((service) => (
                              <option key={service} value={service}>
                                {service}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="budget" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            {t('form.budget')}
                          </label>
                          <select
                            id="budget"
                            name="budget"
                            value={formData.budget}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">{t('form.budgetPlaceholder')}</option>
                            {budgetRanges.map((range) => (
                              <option key={range} value={range}>
                                {range}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Timeline — TODO: extract to i18n */}
                      <div>
                        <label htmlFor="timeline" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                          ¿Cuándo querés empezar?
                        </label>
                        <select
                          id="timeline"
                          name="timeline"
                          value={formData.timeline}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Seleccioná una opción</option>
                          <option value="now">Ya, lo antes posible</option>
                          <option value="1m">En el próximo mes</option>
                          <option value="3m">En 2-3 meses</option>
                          <option value="open">Sin definir, solo explorando</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                          {t('form.message')} *
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          required
                          rows={6}
                          value={formData.message}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder={t('form.messagePlaceholder')}
                        />
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        fullWidth
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>{t('form.submitting')}</>
                        ) : (
                          <>
                            <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                            {t('form.submit')}
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Contact Info Sidebar */}
            <div className="space-y-6">
              {/* Contact Cards */}
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <Card key={index} variant="bordered" className="hover:shadow-medium transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-secondary-900 dark:text-white mb-1">
                            {info.title}
                          </h3>
                          {info.link ? (
                            <a
                              href={info.link}
                              className="text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            >
                              {info.content}
                            </a>
                          ) : (
                            <p className="text-secondary-700 dark:text-secondary-300">
                              {info.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Social Media */}
              <Card variant="bordered">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-secondary-900 dark:text-white mb-4">
                    {t('social.title')}
                  </h3>
                  <div className="flex gap-3">
                    <a
                      href="https://wa.me/573024794842"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-900 transition-colors"
                      title="WhatsApp"
                    >
                      <FaWhatsapp className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </a>
                    <a
                      href="https://www.linkedin.com/company/109543617"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
                      title="LinkedIn"
                    >
                      <FaLinkedin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Call */}
              <Card variant="elevated" className="bg-primary-50 dark:bg-primary-950 border-primary-200 dark:border-primary-800">
                <CardContent className="p-6 text-center">
                  <CalendarDaysIcon className="h-12 w-12 text-primary-600 dark:text-primary-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-secondary-900 dark:text-white mb-2">
                    {t('schedule.title')}
                  </h3>
                  <p className="text-sm text-secondary-700 dark:text-secondary-300 mb-4">
                    {t('schedule.subtitle')}
                  </p>
                  <Button
                    size="sm"
                    fullWidth
                    variant="primary"
                    onClick={handleScheduleCall}
                    disabled={isScheduling}
                  >
                    {isScheduling ? t('schedule.opening') : t('schedule.button')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('faq.title')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400">
              {t('faq.subtitle')}
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <Card key={idx} variant="bordered">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-3 flex items-center gap-2">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    {faq.question}
                  </h3>
                  <p className="text-secondary-700 dark:text-secondary-300 pl-7">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="h-72 sm:h-96 bg-secondary-200 dark:bg-secondary-800">
        <div className="w-full h-full">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.9146859817846!2d-74.11588!3d4.609572!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f9e8f8f8f8f8f%3A0x8f8f8f8f8f8f8f8f!2sAv.%2068%20%231-63%2C%20Bogot%C3%A1%2C%20Colombia!5e0!3m2!1ses!2sco!4v1234567890123!5m2!1ses!2sco"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Ubicación de KopTup en Bogotá, Colombia"
          />
        </div>
      </section>
    </>
  );
}

export default function ContactPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-black">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      }
    >
      <ContactPageInner />
    </Suspense>
  );
}
