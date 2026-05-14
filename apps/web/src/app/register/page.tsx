'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { FaGoogle, FaGithub } from 'react-icons/fa';

// TODO: extract to i18n
const COP_FMT = (n: number) =>
  '$ ' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n) + ' COP';

const PLAN_PREVIEW: Record<string, { name: string; tiers: Record<string, { label: string; price: number; bullets: string[] }> }> = {
  'chatbot-rag-ia': {
    name: 'Chatbot RAG con IA',
    tiers: {
      starter: { label: 'Starter', price: 249000, bullets: ['Hasta 3.000 conversaciones/mes', '20 documentos RAG', 'Soporte por email'] },
      profesional: { label: 'Profesional', price: 489000, bullets: ['Hasta 15.000 conversaciones/mes', '100 documentos RAG', 'WhatsApp + Web'] },
      enterprise: { label: 'Enterprise', price: 1290000, bullets: ['Conversaciones ilimitadas', 'Documentos ilimitados', 'SLA y soporte 24/7'] },
    },
  },
  'agente-ia-ventas': {
    name: 'Agente IA de Ventas',
    tiers: {
      growth: { label: 'Growth', price: 1290000, bullets: ['Calificación de leads', 'Integración CRM', 'Reportes semanales'] },
      pro: { label: 'Pro', price: 2490000, bullets: ['Multi-canal', 'A/B testing', 'Dashboard ejecutivo'] },
    },
  },
};

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('registerPage');

  const planSlug = searchParams.get('plan');
  const tierSlug = searchParams.get('tier');
  const sourceParam = searchParams.get('source');
  const serviceParam = searchParams.get('service');

  const planContext =
    planSlug && PLAN_PREVIEW[planSlug]
      ? {
          name: PLAN_PREVIEW[planSlug].name,
          tier: tierSlug && PLAN_PREVIEW[planSlug].tiers[tierSlug]
            ? PLAN_PREVIEW[planSlug].tiers[tierSlug]
            : null,
          slug: planSlug,
        }
      : null;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError(t('errorPasswordMismatch'));
      return;
    }

    if (formData.password.length < 8) {
      setError(t('errorPasswordLength'));
      return;
    }

    if (!formData.agreeTerms) {
      setError(t('errorTerms'));
      return;
    }

    setIsLoading(true);

    try {
      // Register user in backend
      await api.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      // Auto-login after successful registration
      const { user } = await api.login(formData.email, formData.password);

      // Save user data
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify({
          ...user,
          company: formData.company,
          phone: formData.phone,
        }));
      }

      // Redirect to dashboard con welcome flag y contexto del plan
      const params = new URLSearchParams();
      params.set('welcome', '1');
      if (planSlug) params.set('plan', planSlug);
      if (tierSlug) params.set('tier', tierSlug);
      // Si vino con plan/tier, asumimos cliente SaaS; si vino con service, servicio a medida
      if (planSlug) {
        params.set('type', 'plan');
      } else if (serviceParam) {
        params.set('type', 'service');
      }
      router.push(`/dashboard?${params.toString()}`);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al crear la cuenta');
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSocialRegister = (provider: string) => {
    if (provider === 'google') {
      // Redirect to backend Google OAuth endpoint
      window.location.href = api.getGoogleOAuthURL();
    }
    // GitHub OAuth (to be implemented)
  };

  const passwordRequirements = [
    { met: formData.password.length >= 8, text: t('reqLength') },
    { met: /[A-Z]/.test(formData.password), text: t('reqUppercase') },
    { met: /[a-z]/.test(formData.password), text: t('reqLowercase') },
    { met: /[0-9]/.test(formData.password), text: t('reqNumber') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-black dark:to-primary-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className={planContext ? 'max-w-6xl w-full space-y-8' : 'max-w-2xl w-full space-y-8'}>
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
          <h2 className="mt-6 text-3xl font-bold text-secondary-900 dark:text-white">
            {t('title')}
          </h2>
          <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
            {t('subtitle')}
          </p>
        </div>

        {/* Banner contexto: viene de contact form */}
        {/* TODO: extract to i18n */}
        {sourceParam === 'contact' && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Tu solicitud de contacto fue enviada. Creá tu cuenta para hacer seguimiento desde tu dashboard.
            </p>
          </div>
        )}

        <div className={planContext ? 'grid grid-cols-1 lg:grid-cols-3 gap-6' : ''}>
        <Card variant="elevated" className={planContext ? 'shadow-xl lg:col-span-2' : 'shadow-xl'}>
          <CardContent className="p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Social Register */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => handleSocialRegister('google')}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-secondary-300 dark:border-secondary-700 rounded-lg text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
              >
                <FaGoogle className="h-5 w-5" />
                <span className="font-medium">{t('socialGoogle')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialRegister('github')}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-secondary-300 dark:border-secondary-700 rounded-lg text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
              >
                <FaGithub className="h-5 w-5" />
                <span className="font-medium">{t('socialGithub')}</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary-300 dark:border-secondary-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-secondary-950 text-secondary-500">
                  {t('divider')}
                </span>
              </div>
            </div>

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    {t('name')} *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-secondary-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={t('namePlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    {t('email')} *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-5 w-5 text-secondary-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={t('emailPlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    {t('phone')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <PhoneIcon className="h-5 w-5 text-secondary-400" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={t('phonePlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    {t('company')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BuildingOfficeIcon className="h-5 w-5 text-secondary-400" />
                    </div>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      value={formData.company}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={t('companyPlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    {t('password')} *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-secondary-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-10 py-3 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={t('passwordPlaceholder')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-secondary-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-secondary-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    {t('confirmPassword')} *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-secondary-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-10 py-3 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={t('passwordPlaceholder')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-secondary-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-secondary-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Requirements */}
              {formData.password && (
                <div className="bg-secondary-50 dark:bg-secondary-900 rounded-lg p-4">
                  <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    {t('passwordRequirements')}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {passwordRequirements.map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircleIcon
                          className={`h-4 w-4 ${
                            req.met ? 'text-green-600 dark:text-green-400' : 'text-secondary-400'
                          }`}
                        />
                        <span
                          className={`text-xs ${
                            req.met
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-secondary-600 dark:text-secondary-400'
                          }`}
                        >
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Terms */}
              <div className="flex items-start">
                <input
                  id="agreeTerms"
                  name="agreeTerms"
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="h-4 w-4 mt-1 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                />
                <label htmlFor="agreeTerms" className="ml-2 block text-sm text-secondary-700 dark:text-secondary-300">
                  {t('agreeTerms')}{' '}
                  <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                    {t('termsLink')}
                  </Link>{' '}
                  {t('and')}{' '}
                  <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                    {t('privacyLink')}
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                size="lg"
                fullWidth
                disabled={isLoading}
              >
                {/* TODO: extract to i18n */}
                {isLoading ? t('creating') : (planContext ? 'Crear cuenta y empezar' : t('createButton'))}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Plan summary aside */}
        {/* TODO: extract to i18n */}
        {planContext && (
          <aside className="lg:col-span-1">
            <Card variant="bordered" className="sticky top-6 border-primary-200 dark:border-primary-800 bg-gradient-to-br from-primary-50 to-white dark:from-primary-950 dark:to-secondary-950">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <SparklesIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <span className="text-xs uppercase tracking-wide font-semibold text-primary-700 dark:text-primary-300">
                    Tu plan elegido
                  </span>
                </div>
                <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-1">
                  {planContext.name}
                </h3>
                {planContext.tier && (
                  <Badge variant="primary" size="sm" className="mb-4">
                    Plan {planContext.tier.label}
                  </Badge>
                )}
                {planContext.tier && (
                  <>
                    <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                      {COP_FMT(planContext.tier.price)}
                    </p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-4">
                      / mes · sin permanencia
                    </p>
                    <ul className="space-y-2 mb-4">
                      {planContext.tier.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-sm text-secondary-700 dark:text-secondary-300">
                          <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-900 text-xs text-secondary-600 dark:text-secondary-400">
                  Al crear tu cuenta podrás configurar este plan, integrar tus APIs y empezar a usarlo en minutos.
                </div>
                <Link
                  href="/pricing"
                  className="block mt-3 text-xs text-center text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Cambiar de plan
                </Link>
              </CardContent>
            </Card>
          </aside>
        )}
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-secondary-600 dark:text-secondary-400">
          {t('hasAccount')}{' '}
          <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
            {t('loginLink')}
          </Link>
        </p>

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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-black">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      }
    >
      <RegisterPageInner />
    </Suspense>
  );
}
