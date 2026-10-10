'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import { EnvelopeIcon, ArrowLeftIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { FaWhatsapp } from 'react-icons/fa';
import { KOPTUP_WHATSAPP_NUMBER } from '@/lib/demo-system';

export default function ForgotPasswordPage() {
  const t = useTranslations('passwordRecovery.forgot');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  // Sin correo configurado en el servidor no sale ningún enlace: se dice tal cual
  // y se ofrece pedirlo al equipo (que lo genera desde el panel).
  const [noEmail, setNoEmail] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // El backend responde lo mismo exista o no la cuenta (anti-enumeración).
      const res = await api.requestPasswordReset(email);
      if (res?.data?.correo === 'no_configurado') setNoEmail(true);
      else setSuccess(true);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429) setError(t('errorRateLimited'));
      else if (!err?.response) setError(t('errorNetwork'));
      else setError(t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  const whatsappHref = `https://wa.me/${KOPTUP_WHATSAPP_NUMBER}?text=${encodeURIComponent(t('whatsappMessage', { email }))}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-black dark:to-primary-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">K</span>
            </div>
            <span className="font-display font-bold text-2xl text-secondary-900 dark:text-white">
              KopTup
            </span>
          </Link>
          <h1 className="mt-6 text-3xl font-bold text-secondary-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
            {t('subtitle')}
          </p>
        </div>

        <Card variant="elevated" className="shadow-xl">
          <CardContent className="p-8">
            {noEmail ? (
              <div className="text-center space-y-5" data-testid="forgot-no-email">
                <div className="flex justify-center">
                  <ExclamationTriangleIcon className="h-14 w-14 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">{t('noEmailTitle')}</h2>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('noEmailBody')}</p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button fullWidth asChild>
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                      <FaWhatsapp className="h-5 w-5 mr-2" />
                      {t('noEmailWhatsapp')}
                    </a>
                  </Button>
                  <Button fullWidth variant="outline" asChild>
                    <Link href="/contact">{t('noEmailContact')}</Link>
                  </Button>
                  <Link href="/login" className="inline-flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-500">
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    {t('backToLogin')}
                  </Link>
                </div>
              </div>
            ) : success ? (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <CheckCircleIcon className="h-16 w-16 text-green-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
                    {t('successTitle')}
                  </h2>
                  {/* El backend responde igual exista o no la cuenta: no se afirma que el correo salió. */}
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    {t.rich('successBody', { email, strong: (chunks) => <span className="font-semibold">{chunks}</span> })}
                  </p>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-2">
                    {t('successHint')}
                  </p>
                </div>
                <Button fullWidth variant="outline" asChild>
                  <Link href="/login">
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    {t('backToLogin')}
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      {t('email')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-secondary-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder={t('emailPlaceholder')}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    fullWidth
                    disabled={isLoading}
                  >
                    {isLoading ? t('submitting') : t('submit')}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link href="/login" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500">
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    {t('backToLogin')}
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Back to Home */}
        <p className="text-center">
          <Link href="/" className="text-sm text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white">
            {t('backHome')}
          </Link>
        </p>
      </div>
    </div>
  );
}
