'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

function ResetPasswordInner() {
  const t = useTranslations('passwordRecovery.reset');
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  // El enlace no sirve (usado, reemplazado o vencido): se ofrece pedir otro.
  const [linkProblem, setLinkProblem] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError(t('errorInvalidLink'));
      setLinkProblem(true);
      return;
    }
    if (password.length < 8) {
      setError(t('errorLength'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('errorMismatch'));
      return;
    }

    setIsLoading(true);
    try {
      await api.resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      // Un mensaje por motivo: enlace usado, reemplazado, vencido o inválido.
      const code = err?.response?.data?.code;
      const status = err?.response?.status;
      if (code === 'token_used' || code === 'token_replaced' || code === 'token_expired' || code === 'token_invalid') {
        setError(t(`errors.${code}`));
        setLinkProblem(true);
      } else if (status === 429) setError(t('errorRateLimited'));
      else if (!err?.response) setError(t('errorNetwork'));
      else setError(t('errorGeneric'));
    } finally {
      setIsLoading(false);
    }
  };

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
            {success ? (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <CheckCircleIcon className="h-16 w-16 text-green-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
                    {t('successTitle')}
                  </h2>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    {t('successBody')}
                  </p>
                </div>
                <Button fullWidth asChild>
                  <Link href="/login">{t('goToLogin')}</Link>
                </Button>
              </div>
            ) : (
              <>
                {error && (
                  <div role="alert" className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    {linkProblem && (
                      <Link href="/forgot-password" className="mt-2 inline-block text-sm font-semibold text-primary-600 hover:text-primary-500">
                        {t('requestNew')}
                      </Link>
                    )}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      {t('password')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5 text-secondary-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-10 py-3 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder={t('passwordPlaceholder')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600"
                        aria-label={showPassword ? t('hide') : t('show')}
                      >
                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      {t('confirm')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5 text-secondary-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder={t('confirmPlaceholder')}
                      />
                    </div>
                  </div>

                  <Button type="submit" size="lg" fullWidth disabled={isLoading}>
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
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
