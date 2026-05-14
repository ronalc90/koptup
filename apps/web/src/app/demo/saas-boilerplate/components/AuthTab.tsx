'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  KeyIcon,
  FingerPrintIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { CodeBlock } from './shared';

type AuthMethod = 'sso' | 'mfa' | 'social' | 'magic';

export default function AuthTab() {
  const t = useTranslations('demoSaas');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('sso');
  const [magicSent, setMagicSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">{t('auth.title')}</h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">{t('auth.subtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['sso', 'mfa', 'social', 'magic'] as AuthMethod[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setAuthMethod(m);
              setMagicSent(false);
              setOtpVerified(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              authMethod === m
                ? 'bg-secondary-900 text-white dark:bg-white dark:text-secondary-900'
                : 'bg-white dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300 border border-secondary-200 dark:border-secondary-700'
            }`}
          >
            {t(`auth.methods.${m}`)}
          </button>
        ))}
      </div>

      {authMethod === 'sso' && (
        <Card variant="bordered">
          <h3 className="text-base font-semibold text-secondary-900 dark:text-white mb-4">{t('auth.sso.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['saml', 'oidc', 'scim'] as const).map((k) => (
              <div key={k} className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <KeyIcon className="w-4 h-4 text-primary-600" />
                  <span className="font-semibold text-sm text-secondary-900 dark:text-white">{t(`auth.sso.${k}`)}</span>
                </div>
                <p className="text-xs text-secondary-600 dark:text-secondary-400">{t(`auth.sso.${k}Desc`)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <CodeBlock
              lang="ts"
              code={`// SAML callback handler\nexport async function POST(req: Request) {\n  const samlResponse = await req.formData();\n  const { user, tenant } = await sso.verify(samlResponse);\n  await session.create({ userId: user.id, tenantId: tenant.id });\n  return redirect('/dashboard');\n}`}
            />
          </div>
        </Card>
      )}

      {authMethod === 'mfa' && (
        <Card variant="bordered">
          <h3 className="text-base font-semibold text-secondary-900 dark:text-white mb-4">{t('auth.mfa.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {([
              ['totp', DevicePhoneMobileIcon],
              ['webauthn', FingerPrintIcon],
              ['sms', EnvelopeIcon],
            ] as const).map(([k, Icon]) => (
              <div key={k} className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-primary-600" />
                  <span className="font-semibold text-sm text-secondary-900 dark:text-white">{t(`auth.mfa.${k}`)}</span>
                </div>
                <p className="text-xs text-secondary-600 dark:text-secondary-400">{t(`auth.mfa.${k}Desc`)}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-secondary-100 dark:bg-secondary-800 p-4">
            <div className="flex items-center gap-2 justify-center mb-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-10 h-12 rounded-md border-2 border-primary-500 bg-white dark:bg-secondary-900 flex items-center justify-center font-mono text-lg font-bold text-secondary-900 dark:text-white">
                  {otpVerified ? ['4', '7', '2', '9', '0', '1'][i] : ''}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2">
              {!otpVerified ? (
                <Button size="sm" onClick={() => setOtpVerified(true)}>{t('auth.verify')}</Button>
              ) : (
                <Badge variant="success">{t('auth.verified')}</Badge>
              )}
            </div>
          </div>
        </Card>
      )}

      {authMethod === 'social' && (
        <Card variant="bordered">
          <h3 className="text-base font-semibold text-secondary-900 dark:text-white mb-1">{t('auth.social.title')}</h3>
          <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-4">{t('auth.providersLabel')}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(t.raw('auth.social.items') as string[]).map((p) => (
              <button key={p} className="rounded-lg border border-secondary-200 dark:border-secondary-700 px-3 py-2.5 text-sm font-medium text-secondary-900 dark:text-white hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors">
                {p}
              </button>
            ))}
          </div>
        </Card>
      )}

      {authMethod === 'magic' && (
        <Card variant="bordered">
          <h3 className="text-base font-semibold text-secondary-900 dark:text-white mb-4">{t('auth.magic.title')}</h3>
          <ol className="space-y-2 mb-4">
            {(['step1', 'step2', 'step3'] as const).map((s, i) => (
              <li key={s} className="flex items-start gap-2 text-sm text-secondary-700 dark:text-secondary-300">
                <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <span>{t(`auth.magic.${s}`)}</span>
              </li>
            ))}
          </ol>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input type="email" placeholder="you@company.com" aria-label={t('auth.email')} className="flex-1" />
            <Button onClick={() => setMagicSent(true)}>{t('auth.sendCode')}</Button>
          </div>
          {magicSent && (
            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircleIcon className="w-4 h-4" />
              {t('auth.linkSent')}
            </div>
          )}
        </Card>
      )}
    </section>
  );
}
