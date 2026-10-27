'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { trackWhatsappClick } from '@/lib/analytics';
import { SOCIAL_LINKS } from '@/lib/site';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import { EnvelopeIcon, PhoneIcon, MapPinIcon, ClockIcon, ChatBubbleLeftRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { FaWhatsapp, FaLinkedin } from 'react-icons/fa';
import ContactHero, { ContactHeroView } from './ContactHero';
import ContactForm from './ContactForm';

/**
 * /contact. Solo el encabezado (plan RAG elegido) y el formulario leen la URL
 * con useSearchParams: cada uno va en su propio Suspense. Así el h1, la
 * introducción, el horario, los enlaces de contacto y las preguntas frecuentes
 * salen en el HTML del servidor.
 */
export default function ContactPage() {
  const t = useTranslations('contactPage');

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
      {/* Hero Section: el h1 genérico es el que llega en el HTML del servidor */}
      <Suspense fallback={<ContactHeroView planLabel={null} />}>
        <ContactHero />
      </Suspense>

      {/* Contact Form & Info Section */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Suspense
                fallback={
                  <div className="flex min-h-[32rem] items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
                  </div>
                }
              >
                <ContactForm />
              </Suspense>
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
