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
      title: t('types.ct1.title'),
      description: t('types.ct1.description'),
      required: true,
      enabled: essentialEnabled,
      setEnabled: setEssentialEnabled,
      cookies: [
        { name: 'session_id', purpose: t('types.ct1.ck1.purpose'), duration: t('types.ct1.ck1.duration'), type: t('types.ct1.ck1.type') },
        { name: 'auth_token', purpose: t('types.ct1.ck2.purpose'), duration: t('types.ct1.ck2.duration'), type: t('types.ct1.ck2.type') },
        { name: 'csrf_token', purpose: t('types.ct1.ck3.purpose'), duration: t('types.ct1.ck3.duration'), type: t('types.ct1.ck3.type') },
        { name: 'cookie_consent', purpose: t('types.ct1.ck4.purpose'), duration: t('types.ct1.ck4.duration'), type: t('types.ct1.ck4.type') },
      ],
    },
    {
      icon: Cog6ToothIcon,
      title: t('types.ct2.title'),
      description: t('types.ct2.description'),
      required: false,
      enabled: functionalEnabled,
      setEnabled: setFunctionalEnabled,
      cookies: [
        { name: 'language', purpose: t('types.ct2.ck1.purpose'), duration: t('types.ct2.ck1.duration'), type: t('types.ct2.ck1.type') },
        { name: 'theme', purpose: t('types.ct2.ck2.purpose'), duration: t('types.ct2.ck2.duration'), type: t('types.ct2.ck2.type') },
        { name: 'user_preferences', purpose: t('types.ct2.ck3.purpose'), duration: t('types.ct2.ck3.duration'), type: t('types.ct2.ck3.type') },
      ],
    },
    {
      icon: ChartBarIcon,
      title: t('types.ct3.title'),
      description: t('types.ct3.description'),
      required: false,
      enabled: analyticsEnabled,
      setEnabled: setAnalyticsEnabled,
      cookies: [
        { name: '_ga', purpose: t('types.ct3.ck1.purpose'), duration: t('types.ct3.ck1.duration'), type: t('types.ct3.ck1.type') },
        { name: '_gid', purpose: t('types.ct3.ck2.purpose'), duration: t('types.ct3.ck2.duration'), type: t('types.ct3.ck2.type') },
        { name: '_gat', purpose: t('types.ct3.ck3.purpose'), duration: t('types.ct3.ck3.duration'), type: t('types.ct3.ck3.type') },
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
    localStorage.setItem('cookie_preferences', JSON.stringify(preferences));
    alert(t('preferences.alertSaved'));
  };

  const handleAcceptAll = () => {
    setEssentialEnabled(true);
    setFunctionalEnabled(true);
    setAnalyticsEnabled(true);
    const preferences = { essential: true, functional: true, analytics: true, timestamp: new Date().toISOString() };
    localStorage.setItem('cookie_preferences', JSON.stringify(preferences));
    alert(t('preferences.alertAccepted'));
  };

  const handleRejectOptional = () => {
    setEssentialEnabled(true);
    setFunctionalEnabled(false);
    setAnalyticsEnabled(false);
    const preferences = { essential: true, functional: false, analytics: false, timestamp: new Date().toISOString() };
    localStorage.setItem('cookie_preferences', JSON.stringify(preferences));
    alert(t('preferences.alertEssential'));
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" size="lg" className="mb-6 border-white/30 text-white">
              {t('updatedBadge')}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              {t('hero.subtitle')}
            </p>
            <div className="flex items-center justify-center gap-2 text-primary-100">
              <CakeIcon className="h-5 w-5" />
              <span>{t('heroClaim')}</span>
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
                    {t('intro.title')}
                  </h2>
                  <p className="text-secondary-700 dark:text-secondary-300 mb-4">
                    {t('intro.p1')}
                  </p>
                  <p className="text-secondary-700 dark:text-secondary-300">
                    {t('intro.p2')}
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
              {t('types.title')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              {t('types.subtitle')}
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
                                {t('types.alwaysActive')}
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
                                {t('types.colName')}
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-900 dark:text-white">
                                {t('types.colPurpose')}
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-900 dark:text-white">
                                {t('types.colDuration')}
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-900 dark:text-white">
                                {t('types.colType')}
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
                {t('preferences.title')}
              </h2>
              <p className="text-secondary-700 dark:text-secondary-300 mb-6 text-center">
                {t('preferences.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="primary" size="lg" onClick={handleAcceptAll}>
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  {t('preferences.acceptAll')}
                </Button>
                <Button variant="outline" size="lg" onClick={handleRejectOptional}>
                  <XCircleIcon className="h-5 w-5 mr-2" />
                  {t('preferences.essentialOnly')}
                </Button>
                <Button variant="secondary" size="lg" onClick={handleSavePreferences}>
                  {t('preferences.savePreferences')}
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
                {t('control.title')}
              </h2>
              <div className="space-y-4 text-secondary-700 dark:text-secondary-300">
                <p>
                  {t('control.p1')}{' '}
                  <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
                    {t('control.aboutCookiesLink')}
                  </a>.
                </p>
                <div>
                  <h3 className="font-semibold text-secondary-900 dark:text-white mb-2">
                    {t('control.browserTitle')}
                  </h3>
                  <p className="mb-2">{t('control.browserP1')}</p>
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
                <p>{t('control.browserWarning')}</p>
              </div>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                {t('thirdParty.title')}
              </h2>
              <p className="text-secondary-700 dark:text-secondary-300 mb-4">
                {t('thirdParty.p1')}
              </p>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-secondary-900 dark:text-white mb-2">
                    {t('thirdParty.googleTitle')}
                  </h3>
                  <p className="text-secondary-700 dark:text-secondary-300 text-sm">
                    {t('thirdParty.googleP1')}{' '}
                    <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
                      {t('thirdParty.googleLink')}
                    </a>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                {t('updates.title')}
              </h2>
              <p className="text-secondary-700 dark:text-secondary-300 mb-4">{t('updates.p1')}</p>
              <p className="text-secondary-700 dark:text-secondary-300">{t('updates.p2')}</p>
            </CardContent>
          </Card>

          <Card variant="bordered" className="bg-primary-50 dark:bg-primary-950 border-primary-200 dark:border-primary-800">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                {t('contact.title')}
              </h2>
              <p className="text-secondary-700 dark:text-secondary-300 mb-4">{t('contact.text')}</p>
              <div className="space-y-2 text-secondary-700 dark:text-secondary-300">
                <div className="flex items-center gap-2">
                  <strong>{t('contact.labelEmail')}</strong>
                  <a href="mailto:ronald@koptup.com" className="text-primary-600 dark:text-primary-400 hover:underline">
                    ronald@koptup.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <strong>{t('contact.labelPhone')}</strong>
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
            <span className="text-sm">{t('footer.updated')}</span>
          </div>
          <p className="text-sm text-secondary-500 dark:text-secondary-500 mb-2">
            {t('footer.copyright')}
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <a href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
              {t('footer.linkPrivacy')}
            </a>
            <span className="text-secondary-400">•</span>
            <a href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">
              {t('footer.linkTerms')}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
