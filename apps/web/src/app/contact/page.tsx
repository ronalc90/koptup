'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { track, trackWhatsappClick } from '@/lib/analytics';
import { parseContactQuote, quotePayload, offeringNameKey } from '@/lib/contact-quote';
import { formatRagCOP, getRagPlan } from '@/lib/rag-plans';
import { SOCIAL_LINKS } from '@/lib/site';
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

/** Campos del formulario que pueden traer un error del servidor (POST /api/contact). */
const CONTACT_FIELDS = ['name', 'email', 'phone', 'company', 'service', 'budget', 'message', 'timeline', 'consentimiento', 'quote'];

function ContactPageInner() {
  const t = useTranslations('contactPage');
  const locale = useLocale();
  const tRag = useTranslations('ragPlans');
  const tCatalog = useTranslations('offeringsCatalog');
  const tAll = useTranslations();
  const searchParams = useSearchParams();
  // Cotización que llega por la URL (planes RAG, "Cotizar este tier" del
  // catálogo o una demo): solo valores conocidos (lib/contact-quote.ts).
  const quote = parseContactQuote(searchParams);

  // Nombre legible del servicio (nunca el slug).
  const cotizandoLabel = !quote
    ? null
    : quote.kind === 'rag'
      ? t('services.rag')
      : quote.kind === 'offering'
        ? tAll.has(offeringNameKey(quote.service))
          ? tAll(offeringNameKey(quote.service))
          : null
        : t(`quote.legacyServices.${quote.service}`);
  // Detalle elegido: el plan RAG, o el nivel y la modalidad de la solución.
  const planLabel = quote?.kind === 'rag' && quote.plan ? tRag(`plans.${quote.plan}.name`) : null;
  const quoteDetails = !cotizandoLabel
    ? []
    : quote?.kind === 'rag'
      ? planLabel
        ? [t('quote.plan', { plan: planLabel })]
        : []
      : quote?.kind === 'offering'
        ? [
            ...(quote.tier ? [t('quote.tier', { tier: tCatalog(`tier.${quote.tier}`) })] : []),
            ...(quote.modality ? [tCatalog(`modality.${quote.modality}`)] : []),
          ]
        : [];
  const quoteDetail = quoteDetails.join(' · ');
  // Plan RAG elegido: precio y duración en la tarjeta "Estás cotizando".
  const ragPlan = quote?.kind === 'rag' && quote.plan ? getRagPlan(quote.plan) : null;
  const ragPlanPrice = !ragPlan
    ? null
    : ragPlan.monthlyMode === 'none'
      ? t('quote.priceOnce', { price: formatRagCOP(ragPlan.setup.cop, locale) })
      : ragPlan.monthlyMode === 'fixed' && ragPlan.monthly
        ? t('quote.priceMonthly', {
            setup: formatRagCOP(ragPlan.setup.cop, locale),
            monthly: formatRagCOP(ragPlan.monthly.cop, locale),
          })
        : t('quote.priceFrom', { setup: formatRagCOP(ragPlan.setup.cop, locale) });
  const ragPlanDuration = !ragPlan
    ? null
    : ragPlan.monthlyMode === 'none'
      ? tRag('duration.pilot', { weeks: ragPlan.weeks.max })
      : tRag('duration.implementation', { min: ragPlan.weeks.min, max: ragPlan.weeks.max });
  // "Solicitar demo guiada" de la demo RAG llega con ?motivo=demo-guiada.
  const guidedDemo = quote?.kind === 'rag' && !quote.plan && searchParams?.get('motivo') === 'demo-guiada';

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
  // Autorización de datos (Ley 1581, obligatoria) y campo trampa contra bots:
  // van aparte del formulario para no tocar el reinicio de los demás campos.
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  /** Email con el que se envió la solicitud (lo repite el mensaje de éxito). */
  const [submittedEmail, setSubmittedEmail] = useState('');
  /** Plan RAG que viajó con la solicitud (null si la persona cambió de servicio). */
  const [submittedPlan, setSubmittedPlan] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Pre-llenar form si vienen query params
  useEffect(() => {
    if (cotizandoLabel) {
      setFormData((prev) => ({
        ...prev,
        service: cotizandoLabel,
        message: prev.message
          ? prev.message
          : quoteDetail
            ? t('quote.messageWithDetail', { service: cotizandoLabel, detail: quoteDetail })
            : guidedDemo
              ? t('quote.messageGuidedDemo')
              : t('quote.message', { service: cotizandoLabel }),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cotizandoLabel, quoteDetail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!consent) {
      setFieldErrors({ consentimiento: t('form.fieldErrors.consentimiento') });
      setError(t('form.errorCheckFields'));
      document.getElementById('consentimiento')?.focus();
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      // Si sigue elegido el servicio que se estaba cotizando, el plan (o el
      // nivel y la modalidad) viajan con el lead aunque la persona edite el
      // mensaje: en el texto del servicio y como identificadores en `quote`.
      const keepsQuote = !!cotizandoLabel && formData.service === cotizandoLabel;
      const payload = keepsQuote
        ? {
            ...formData,
            service: quoteDetail ? `${cotizandoLabel} — ${quoteDetail}` : formData.service,
            quote: quotePayload(quote),
          }
        : formData;
      await api.submitContactForm({ ...payload, consentimiento: true, website });

      // Conversión `generate_lead` (solo envío exitoso). Sin datos personales:
      // el servicio solo si es una opción del formulario y el plan RAG por id.
      track('generate_lead', {
        lead_source: 'contact_form',
        service: baseServices.includes(formData.service) ? formData.service : undefined,
        plan_id: quote?.kind === 'rag' && quote.plan ? quote.plan : undefined,
      });

      // La confirmación queda a la vista (dice qué pasa después) hasta que la
      // persona elige "Enviar otro mensaje".
      setSubmittedEmail(formData.email);
      setSubmittedPlan(keepsQuote ? planLabel : null);
      setIsSubmitted(true);
    } catch (err: any) {
      // Mensaje según lo que pasó: límite de envíos, red, o el campo que el
      // servidor rechazó (en español se muestra su texto; en inglés, el propio).
      const status: number | undefined = err?.response?.status;
      if (status === 400) {
        const data = (err?.response?.data ?? {}) as { fields?: unknown; errores?: Record<string, string> };
        const serverErrors = data.errores ?? {};
        const fields = Array.isArray(data.fields) ? (data.fields as string[]) : Object.keys(serverErrors);
        const mapped: Record<string, string> = {};
        for (const raw of fields) {
          const key = raw.split('.')[0];
          if (!CONTACT_FIELDS.includes(key) || mapped[key]) continue;
          mapped[key] = locale === 'es' && serverErrors[raw] ? serverErrors[raw] : t(`form.fieldErrors.${key}`);
        }
        setFieldErrors(mapped);
        setError(Object.keys(mapped).length ? t('form.errorCheckFields') : t('form.errorValidation'));
        const first = Object.keys(mapped)[0];
        if (first) document.getElementById(first === 'quote' ? 'service' : first)?.focus();
      } else {
        setError(status === 429 ? t('form.errorRateLimit') : !err?.response ? t('form.errorNetwork') : t('form.errorSubmit'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /** "Enviar otro mensaje": vuelve al formulario vacío (con la cotización de la URL, si la hay). */
  const handleSendAnother = () => {
    setIsSubmitted(false);
    setConsent(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      service: cotizandoLabel ?? '',
      budget: '',
      // Mismo mensaje inicial que al llegar (incluido el de demo guiada).
      message: cotizandoLabel
        ? quoteDetail
          ? t('quote.messageWithDetail', { service: cotizandoLabel, detail: quoteDetail })
          : guidedDemo
            ? t('quote.messageGuidedDemo')
            : t('quote.message', { service: cotizandoLabel })
        : '',
      timeline: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (fieldErrors[e.target.name]) setFieldErrors(({ [e.target.name]: _omit, ...rest }) => rest);
  };

  /** Error del campo (validación del navegador o del servidor). */
  const fieldError = (field: string) =>
    fieldErrors[field] ? (
      <p id={`${field}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
        {fieldErrors[field]}
      </p>
    ) : null;
  const invalidProps = (field: string) =>
    fieldErrors[field] ? { 'aria-invalid': true as const, 'aria-describedby': `${field}-error` } : {};

  // Enlace mailto real (no navegación por script): si no hay cliente de correo,
  // el correo queda escrito debajo del botón para copiarlo.
  const scheduleMailto = `mailto:ronald@koptup.com?subject=${encodeURIComponent(t('schedule.emailSubject'))}&body=${encodeURIComponent(t('schedule.emailBody'))}`;

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
      content: 'Bogotá, Colombia',
      link: null,
    },
    {
      icon: ClockIcon,
      title: t('info.hours.title'),
      content: t('info.hours.value'),
      link: null,
    },
  ];

  const baseServices = [
    t('services.rag'),
    t('services.ecommerce'),
    t('services.chatbot'),
    t('services.webDev'),
    t('services.other'),
  ];
  // El servicio que llega por ?service= debe ser una opción del select; si no,
  // el navegador deja el select vacío y el campo obligatorio bloquea el envío.
  const services =
    cotizandoLabel && !baseServices.includes(cotizandoLabel)
      ? [cotizandoLabel, ...baseServices]
      : baseServices;

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
        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${planLabel ? 'py-12 md:py-20' : 'py-20 md:py-32'}`}>
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" size="lg" className="mb-6 border-white/30 text-white">
              {t('badge')}
            </Badge>
            {/* Con un plan RAG elegido, el encabezado habla de ese plan (no del hero genérico). */}
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {planLabel ? t('hero.quoteTitle', { plan: planLabel }) : t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-primary-100">
              {planLabel ? t('hero.quoteSubtitle') : t('hero.subtitle')}
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
              {/* Banner cotizando — pre-fill desde /services (planes RAG y catálogo) */}
              {cotizandoLabel && (
                <Card
                  variant="bordered"
                  className="mb-6 border-primary-300 dark:border-primary-700 bg-gradient-to-r from-primary-50 to-white dark:from-primary-950 dark:to-secondary-950"
                >
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
                      <SparklesIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-wide font-semibold text-primary-700 dark:text-primary-300">
                        {t('quote.label')}
                      </p>
                      <p className="text-base font-bold text-secondary-900 dark:text-white">
                        {cotizandoLabel}
                        {quoteDetail && (
                          <span className="text-secondary-600 dark:text-secondary-400">
                            {' '}— {quoteDetail}
                          </span>
                        )}
                      </p>
                      {ragPlanPrice ? (
                        <p className="mt-1 text-sm text-secondary-700 dark:text-secondary-300" data-quote-price>
                          {ragPlanPrice} · {ragPlanDuration} · {t('quote.vat')}
                        </p>
                      ) : null}
                      {/* Debajo del texto (no al lado): en el celular el nombre del plan no se parte palabra por palabra. */}
                      <Badge variant="primary" size="sm" className="mt-2">{t('quote.prefilled')}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Qué pasa después de enviar (planes RAG) */}
              {quote?.kind === 'rag' && !isSubmitted ? (
                <div className="mb-6 rounded-xl border border-secondary-200 dark:border-secondary-800 bg-secondary-50 dark:bg-secondary-900 p-5">
                  <h2 className="text-sm font-bold text-secondary-900 dark:text-white">{t('quote.nextSteps.title')}</h2>
                  <ol className="mt-3 space-y-2 text-sm text-secondary-700 dark:text-secondary-300 list-decimal pl-5">
                    <li>{t('quote.nextSteps.call')}</li>
                    <li>{t('quote.nextSteps.scope')}</li>
                    <li>{quote.plan && quote.plan !== 'piloto' ? t('quote.nextSteps.plan') : t('quote.nextSteps.pilot')}</li>
                  </ol>
                  <p className="mt-3 text-sm font-medium text-secondary-800 dark:text-secondary-200">{t('quote.nextSteps.noPayment')}</p>
                </div>
              ) : null}

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
                        {submittedPlan ? t('form.success.titlePlan', { plan: submittedPlan }) : t('form.success.title')}
                      </h3>
                      <p className="text-secondary-600 dark:text-secondary-400 mb-2">
                        {t('form.success.subtitle', { email: submittedEmail })}
                      </p>
                      <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-6 max-w-md mx-auto">
                        {t('form.success.noAutoEmail')}
                      </p>
                      {/* Siguiente paso mientras el equipo responde. (Antes invitaba a
                          "hacer seguimiento desde tu dashboard", pero el portal no
                          muestra los mensajes de contacto.) */}
                      <div className="max-w-md mx-auto p-4 rounded-lg bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800">
                        <p className="text-sm text-secondary-700 dark:text-secondary-300 mb-3">
                          {t('form.success.nextStep')}
                        </p>
                        <Button size="sm" fullWidth asChild>
                          <Link href="/demo/chatbot">{t('form.success.nextStepCta')}</Link>
                        </Button>
                      </div>
                      <button
                        type="button"
                        onClick={handleSendAnother}
                        className="mt-6 text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:underline"
                      >
                        {t('form.success.another')}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Error Message */}
                      {error && (
                        <div role="alert" className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
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
                            {...invalidProps('name')}
                          />
                          {fieldError('name')}
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
                            {...invalidProps('email')}
                          />
                          {fieldError('email')}
                        </div>

                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            {t('form.phone')} <span className="font-normal text-secondary-500 dark:text-secondary-400">({t('form.optional')})</span>
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder={t('form.phonePlaceholder')}
                            {...invalidProps('phone')}
                          />
                          {fieldError('phone')}
                        </div>

                        <div>
                          <label htmlFor="company" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            {t('form.company')} <span className="font-normal text-secondary-500 dark:text-secondary-400">({t('form.optional')})</span>
                          </label>
                          <input
                            type="text"
                            id="company"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder={t('form.companyPlaceholder')}
                            {...invalidProps('company')}
                          />
                          {fieldError('company')}
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
                          {fieldError('service')}
                          {fieldError('quote')}
                        </div>

                        {/* Con un plan RAG elegido el precio ya está publicado: no se pide presupuesto. */}
                        {!ragPlan ? (
                        <div>
                          <label htmlFor="budget" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            {t('form.budget')} <span className="font-normal text-secondary-500 dark:text-secondary-400">({t('form.optional')})</span>
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
                          {fieldError('budget')}
                        </div>
                        ) : null}
                      </div>

                      {/* Plazo: se guarda con el contacto (Contact.plazo). */}
                      <div>
                        <label htmlFor="timeline" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                          {t('form.timeline')} <span className="font-normal text-secondary-500 dark:text-secondary-400">({t('form.optional')})</span>
                        </label>
                        <select
                          id="timeline"
                          name="timeline"
                          value={formData.timeline}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">{t('form.timelinePlaceholder')}</option>
                          {(['now', '1m', '3m', 'open'] as const).map((value) => (
                            <option key={value} value={value}>
                              {t(`form.timelineOptions.${value}`)}
                            </option>
                          ))}
                        </select>
                        {fieldError('timeline')}
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
                          {...invalidProps('message')}
                          {...(quote?.kind === 'rag' && !fieldErrors.message ? { 'aria-describedby': 'message-help' } : {})}
                        />
                        {quote?.kind === 'rag' ? (
                          <p id="message-help" className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                            {t('quote.messageHelpRag')}
                          </p>
                        ) : null}
                        {fieldError('message')}
                      </div>

                      {/* Campo trampa contra bots: display:none (atributo hidden). Un campo fuera de
                          pantalla sí lo autocompleta el navegador y un contacto real se descartaría. */}
                      <div hidden>
                        <label htmlFor="website">{t('form.honeypot')}</label>
                        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                      </div>

                      {/* Autorización de datos (Ley 1581 de 2012): obligatoria; el servidor guarda la prueba. */}
                      <div className="p-4 rounded-lg bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800">
                        <label htmlFor="consentimiento" className="flex items-start gap-3 cursor-pointer">
                          <input
                            id="consentimiento"
                            name="consentimiento"
                            type="checkbox"
                            checked={consent}
                            onChange={(e) => {
                              setConsent(e.target.checked);
                              if (e.target.checked && fieldErrors.consentimiento) setFieldErrors(({ consentimiento: _omit, ...rest }) => rest);
                            }}
                            className="mt-1 h-4 w-4 rounded border-secondary-400 text-primary-600 focus:ring-primary-500"
                            {...invalidProps('consentimiento')}
                          />
                          <span className="text-sm text-secondary-700 dark:text-secondary-300">
                            {t.rich('form.consent', {
                              link: (chunks) => (
                                <Link href="/privacy" target="_blank" className="text-primary-600 dark:text-primary-400 underline font-medium">
                                  {chunks}
                                </Link>
                              ),
                            })}{' '}
                            <span className="text-red-500">*</span>
                          </span>
                        </label>
                        {fieldError('consentimiento')}
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
                      onClick={() => trackWhatsappClick('contact_page')}
                      className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-900 transition-colors"
                      title="WhatsApp"
                    >
                      <FaWhatsapp className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </a>
                    <a
                      href={SOCIAL_LINKS.linkedin}
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
              <Card id="agenda" variant="elevated" className="scroll-mt-24 bg-primary-50 dark:bg-primary-950 border-primary-200 dark:border-primary-800">
                <CardContent className="p-6 text-center">
                  <CalendarDaysIcon className="h-12 w-12 text-primary-600 dark:text-primary-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-secondary-900 dark:text-white mb-2">
                    {t('schedule.title')}
                  </h3>
                  <p className="text-sm text-secondary-700 dark:text-secondary-300 mb-4">
                    {t('schedule.subtitle')}
                  </p>
                  <Button size="sm" fullWidth variant="primary" asChild>
                    <a href={scheduleMailto}>{t('schedule.button')}</a>
                  </Button>
                  <p className="mt-3 text-xs text-secondary-600 dark:text-secondary-400">ronald@koptup.com</p>
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
