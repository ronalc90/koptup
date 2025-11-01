'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
} from '@heroicons/react/24/outline';
import { FaWhatsapp, FaLinkedin } from 'react-icons/fa';

export default function ContactPage() {
  const t = useTranslations('contactPage');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    budget: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulamos el envío del formulario
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset form después de 3 segundos
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
      });
    }, 3000);
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
    const subject = encodeURIComponent('Solicitud de Agendamiento de Llamada - KopTup');
    const body = encodeURIComponent(
      `Hola equipo de KopTup,\n\n` +
      `Me gustaría agendar una llamada para discutir mis necesidades tecnológicas.\n\n` +
      `Por favor, confirmen disponibilidad y agendemos una reunión.\n\n` +
      `Saludos cordiales`
    );

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
                      <p className="text-secondary-600 dark:text-secondary-400">
                        {t('form.success.subtitle')}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
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
                    {isScheduling ? 'Abriendo...' : t('schedule.button')}
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
      <section className="h-96 bg-secondary-200 dark:bg-secondary-800">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <MapPinIcon className="h-16 w-16 mx-auto text-secondary-400 dark:text-secondary-600 mb-4" />
            <p className="text-secondary-600 dark:text-secondary-400">
              {t('map.title')}
            </p>
            <p className="text-sm text-secondary-500 dark:text-secondary-500 mt-2">
              {t('map.subtitle')}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
