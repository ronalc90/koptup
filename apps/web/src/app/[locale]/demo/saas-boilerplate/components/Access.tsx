'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircleIcon, DevicePhoneMobileIcon, KeyIcon, NoSymbolIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { useDemo } from '../lib/store';
import { BASE_DOMAIN, DEMO_TOTP_SECRET, PLANS } from '../lib/data';
import { totp } from '../lib/crypto';
import { isEmail, staffCount } from '../lib/logic';
import { useFmt } from '../lib/useFmt';
import type { Member, Role, Tenant } from '../lib/types';
import { ROLES } from '../lib/types';
import { FieldError, Panel, ProgressBar, ScreenHeader, SimNote, StatusBadge, TenantSelect, Toggle, inputCls, selectCls } from './ui';

type LoginMethod = 'password' | 'google' | 'microsoft';
const LOGIN_METHODS: LoginMethod[] = ['password', 'google', 'microsoft'];
const AUTH_KEYS: (keyof Tenant['sso'])[] = ['google', 'microsoft', 'mfa'];

export default function Access() {
  const t = useTranslations('demoSaas');
  const { s, select } = useDemo();
  const tenant = s.tenants.find((x) => x.id === s.selected.access && x.status !== 'cancelado') ?? s.tenants.find((x) => x.status !== 'cancelado');
  if (!tenant) return null;
  const members = s.members.filter((m) => m.tenantId === tenant.id);
  const staff = staffCount(s.members, tenant.id);
  const max = PLANS[tenant.plan].maxStaff;

  return (
    <div className="space-y-5">
      <ScreenHeader title={t('screens.access.title')} subtitle={t('screens.access.subtitle')} />
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-secondary-200 bg-white p-3 dark:border-secondary-700 dark:bg-secondary-900">
        <TenantSelect id="access-tenant" label={t('common.tenant')} value={tenant.id} onChange={(id) => select('access', id)} />
        <StatusBadge status={tenant.status} />
      </div>

      <Panel
        title={t('access.teamTitle', { tenant: tenant.name })}
        subtitle={t('access.teamSubtitle', { staff, max, plan: t(`plans.${tenant.plan}.name`) })}
      >
        <div className="mb-4 max-w-sm">
          <ProgressBar value={staff} max={max} />
        </div>
        <ul className="divide-y divide-secondary-100 rounded-lg border border-secondary-200 dark:divide-secondary-800 dark:border-secondary-700">
          {members.map((m) => (
            <MemberRow key={m.id} member={m} />
          ))}
        </ul>
        <div className="mt-3 grid gap-2 text-[11px] text-secondary-500 dark:text-secondary-400 sm:grid-cols-2">
          {ROLES.map((r) => (
            <p key={r}>
              <span className="font-semibold text-secondary-700 dark:text-secondary-200">{t(`roles.${r}`)}:</span> {t(`roleDesc.${r}`)}
            </p>
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <InviteForm key={`inv-${tenant.id}`} tenant={tenant} />
        <LoginSettings tenant={tenant} />
      </div>

      <LoginTest key={`login-${tenant.id}`} tenant={tenant} members={members} />
    </div>
  );
}

function MemberRow({ member: m }: { member: Member }) {
  const t = useTranslations('demoSaas');
  const f = useFmt();
  const { changeRole, resend, revoke, accept } = useDemo();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'idle' | 'accept' | 'revoke'>('idle');
  const [name, setName] = useState('');

  const onRole = (role: Role) => {
    const err = changeRole(m.id, role);
    setError(err ? t(err) : null);
  };

  return (
    <li className="px-3 py-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-secondary-900 dark:text-white">{m.name || m.email}</div>
          {m.name && <div className="truncate text-xs text-secondary-500">{m.email}</div>}
          <div className="mt-0.5 text-[11px] text-secondary-500">
            {m.status === 'activo' ? (
              <span className="text-emerald-700 dark:text-emerald-300">{t('access.memberStatus.activo')}</span>
            ) : (
              <span className="text-amber-700 dark:text-amber-300">
                {t('access.memberStatus.invitado')}
                {m.invitedAt ? ` · ${t('access.invitedAt', { date: f.dateTime(m.invitedAt) })}` : ''}
                {m.resent ? ` · ${t('access.resentTimes', { n: m.resent })}` : ''}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`role-${m.id}`}>{t('access.roleLabel', { email: m.email })}</label>
          <select id={`role-${m.id}`} value={m.role} onChange={(e) => onRole(e.target.value as Role)} className={`${selectCls} min-w-[15rem] max-w-full pr-8`}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{t(`roles.${r}`)}</option>
            ))}
          </select>
          {m.status === 'invitado' && mode === 'idle' && (
            <>
              <Button size="sm" variant="ghost" onClick={() => resend(m.id)}>{t('access.resend')}</Button>
              <Button size="sm" variant="ghost" className="text-red-600 dark:text-red-400" onClick={() => setMode('revoke')}>{t('access.revoke')}</Button>
              <Button size="sm" variant="outline" onClick={() => setMode('accept')}>{t('access.accept')}</Button>
            </>
          )}
        </div>
      </div>
      {mode === 'revoke' && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800 dark:bg-red-950/40 dark:text-red-200">
          <span className="break-all">{t('access.revokeConfirm', { email: m.email })}</span>
          <Button size="sm" variant="danger" onClick={() => { revoke(m.id); setMode('idle'); }}>{t('access.revoke')}</Button>
          <Button size="sm" variant="ghost" onClick={() => setMode('idle')}>{t('common.cancel')}</Button>
        </div>
      )}
      {mode === 'accept' && (
        <form
          className="mt-2 flex flex-col gap-2 rounded-lg bg-secondary-50 p-3 dark:bg-secondary-800/60 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            accept(m.id, name);
            setMode('idle');
          }}
        >
          <div className="min-w-0 flex-1">
            <label htmlFor={`accept-${m.id}`} className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('access.acceptName')}</label>
            <input id={`accept-${m.id}`} value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} placeholder={t('access.acceptPlaceholder')} className={inputCls} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" type="submit">{t('access.acceptConfirm')}</Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setMode('idle')}>{t('common.cancel')}</Button>
          </div>
        </form>
      )}
      <FieldError msg={error} />
    </li>
  );
}

function InviteForm({ tenant }: { tenant: Tenant }) {
  const t = useTranslations('demoSaas');
  const { invite } = useDemo();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('contador');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = invite(tenant.id, email, role);
    if (err) {
      setError(t(err));
      return;
    }
    setError(null);
    setEmail('');
  };

  return (
    <Panel title={t('access.inviteTitle')}>
      <form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <label htmlFor="invite-email" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('access.inviteEmail')}</label>
          <input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('access.invitePlaceholder')} className={inputCls} aria-invalid={!!error} />
        </div>
        <div>
          <label htmlFor="invite-role" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('access.inviteRole')}</label>
          <select id="invite-role" value={role} onChange={(e) => setRole(e.target.value as Role)} className={`${selectCls} w-full`}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{t(`roles.${r}`)}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <FieldError msg={error} />
          <Button type="submit" size="sm" className="mt-1">
            <UserPlusIcon className="mr-1 h-4 w-4" />
            {t('access.inviteButton')}
          </Button>
        </div>
      </form>
      <SimNote>{t('access.inviteNote')}</SimNote>
    </Panel>
  );
}

function LoginSettings({ tenant }: { tenant: Tenant }) {
  const t = useTranslations('demoSaas');
  const { setAuth } = useDemo();
  return (
    <Panel title={t('access.loginTitle')} subtitle={t('access.loginSubtitle')}>
      <ul className="space-y-3">
        <li className="flex items-center justify-between gap-3 text-sm">
          <span className="text-secondary-800 dark:text-secondary-100">{t('access.settings.password')}</span>
          <span className="text-xs text-secondary-500">{t('access.alwaysOn')}</span>
        </li>
        {AUTH_KEYS.map((k) => (
          <li key={k} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-secondary-800 dark:text-secondary-100">{t(`access.settings.${k}`)}</span>
            <Toggle checked={tenant.sso[k]} onChange={() => setAuth(tenant.id, k, !tenant.sso[k])} label={t(`access.settings.${k}`)} />
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-secondary-500 dark:text-secondary-400">{t('access.settingsHint')}</p>
    </Panel>
  );
}

type Phase = 'form' | 'mfa' | 'ok' | 'denied';

function LoginTest({ tenant, members }: { tenant: Tenant; members: Member[] }) {
  const t = useTranslations('demoSaas');
  const { s, logLogin } = useDemo();
  const firstActive = members.find((m) => m.status === 'activo');
  const [email, setEmail] = useState(firstActive?.email ?? '');
  const [method, setMethod] = useState<LoginMethod>('password');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<Phase>('form');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const url = `${tenant.slug}.${BASE_DOMAIN}`;
  const other = s.members.find((m) => m.tenantId !== tenant.id && m.status === 'activo');

  const deny = (msg: string) => {
    logLogin(tenant.id, email.trim().toLowerCase(), method, false);
    setMessage(msg);
    setPhase('denied');
  };

  const succeed = (m: Member) => {
    logLogin(tenant.id, m.email, method, true);
    setMessage(t('access.ok', { name: m.name || m.email, role: t(`roles.${m.role}`), url }));
    setPhase('ok');
  };

  const signIn = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!isEmail(clean)) {
      setMessage(t('errors.email'));
      return;
    }
    setMessage('');
    if (tenant.status === 'suspendido' || tenant.status === 'cancelado') return deny(t('access.denied.inactive'));
    const m = members.find((x) => x.email === clean);
    if (!m) return deny(t('access.denied.notMember'));
    if (m.status !== 'activo') return deny(t('access.denied.invited'));
    if (method !== 'password' && !tenant.sso[method]) return deny(t('access.denied.method', { method: t(`access.methods.${method}`) }));
    if (method === 'password' && password.length < 8) {
      setMessage(t('access.denied.password'));
      return;
    }
    if (tenant.sso.mfa) {
      setCode('');
      setPhase('mfa');
      return;
    }
    succeed(m);
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    const m = members.find((x) => x.email === email.trim().toLowerCase());
    if (!m) return;
    setBusy(true);
    try {
      const now = Date.now();
      const valid = await Promise.all([totp(DEMO_TOTP_SECRET, now), totp(DEMO_TOTP_SECRET, now - 30000)]);
      if (valid[0] === null) {
        setMessage(t('access.noCrypto'));
        return;
      }
      if (valid.includes(code.replace(/\D/g, ''))) succeed(m);
      else setMessage(t('access.denied.code'));
    } finally {
      setBusy(false);
    }
  };

  const restart = () => {
    setPhase('form');
    setMessage('');
    setPassword('');
    setCode('');
  };

  return (
    <Panel title={t('access.testTitle')} subtitle={t('access.testSubtitle', { url })}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          {phase === 'form' && (
            <form onSubmit={signIn} noValidate className="space-y-3">
              <div>
                <label htmlFor="login-email" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('access.testEmail')}</label>
                <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
                <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                  {firstActive && (
                    <button type="button" onClick={() => setEmail(firstActive.email)} className="rounded-full bg-secondary-100 px-2 py-0.5 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-200">
                      {t('access.useMember')}
                    </button>
                  )}
                  {other && (
                    <button type="button" onClick={() => setEmail(other.email)} className="rounded-full bg-secondary-100 px-2 py-0.5 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-200">
                      {t('access.useOther')}
                    </button>
                  )}
                </div>
              </div>
              <fieldset>
                <legend className="mb-1 text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('access.testMethod')}</legend>
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-secondary-100 p-1 dark:bg-secondary-800">
                  {LOGIN_METHODS.map((lm) => (
                    <button
                      key={lm}
                      type="button"
                      aria-pressed={method === lm}
                      onClick={() => setMethod(lm)}
                      className={`rounded-md px-2 py-1.5 text-xs font-medium sm:text-sm ${method === lm ? 'bg-white text-secondary-900 shadow-sm dark:bg-secondary-900 dark:text-white' : 'text-secondary-600 dark:text-secondary-300'}`}
                    >
                      {t(`access.methods.${lm}`)}
                    </button>
                  ))}
                </div>
              </fieldset>
              {method === 'password' ? (
                <div>
                  <label htmlFor="login-pass" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('access.testPassword')}</label>
                  <input id="login-pass" type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
                  <p className="mt-1 text-[11px] text-secondary-500">{t('access.passwordHint')}</p>
                </div>
              ) : (
                <p className="text-[11px] text-secondary-500">{t('access.ssoHint', { method: t(`access.methods.${method}`) })}</p>
              )}
              {message && <p className="text-xs text-red-600 dark:text-red-400">{message}</p>}
              <Button type="submit" size="sm">
                <KeyIcon className="mr-1 h-4 w-4" />
                {t('access.signIn')}
              </Button>
            </form>
          )}
          {phase === 'mfa' && (
            <form onSubmit={verify} noValidate className="space-y-3">
              <div className="text-sm font-semibold text-secondary-900 dark:text-white">{t('access.mfaTitle')}</div>
              <p className="text-xs text-secondary-600 dark:text-secondary-300">{t('access.mfaText')}</p>
              <div>
                <label htmlFor="login-code" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('access.mfaCode')}</label>
                <input id="login-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" className={`${inputCls} max-w-[10rem] font-mono tracking-widest`} />
              </div>
              {message && <p className="text-xs text-red-600 dark:text-red-400">{message}</p>}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm" disabled={code.length !== 6 || busy} isLoading={busy}>{t('access.verify')}</Button>
                <Button type="button" size="sm" variant="ghost" onClick={restart}>{t('common.cancel')}</Button>
              </div>
            </form>
          )}
          {(phase === 'ok' || phase === 'denied') && (
            <div
              className={`rounded-lg border p-3 text-sm ${
                phase === 'ok'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100'
                  : 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100'
              }`}
              role="status"
            >
              <div className="flex items-start gap-2">
                {phase === 'ok' ? <CheckCircleIcon className="h-5 w-5 shrink-0" /> : <NoSymbolIcon className="h-5 w-5 shrink-0" />}
                <div className="min-w-0">
                  <div className="font-semibold">{phase === 'ok' ? t('access.okTitle') : t('access.deniedTitle')}</div>
                  <p className="mt-0.5 break-words text-xs">{message}</p>
                  <p className="mt-1 text-[11px] opacity-80">{t('access.logged')}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="mt-3" onClick={restart}>{t('access.again')}</Button>
            </div>
          )}
        </div>
        <AuthenticatorApp active={tenant.sso.mfa} />
      </div>
      <SimNote>{t('access.ssoNote')}</SimNote>
    </Panel>
  );
}

/** App autenticadora simulada: el código TOTP se calcula de verdad en tu navegador. */
function AuthenticatorApp({ active }: { active: boolean }) {
  const t = useTranslations('demoSaas');
  const [code, setCode] = useState<string | null>(null);
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!active) return;
    let alive = true;
    const tick = () => {
      const now = Date.now();
      setLeft(30 - (Math.floor(now / 1000) % 30));
      totp(DEMO_TOTP_SECRET, now).then((c) => {
        if (alive) setCode(c);
      });
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [active]);

  return (
    <div className="rounded-xl border border-secondary-200 bg-secondary-50 p-4 dark:border-secondary-700 dark:bg-secondary-800/50">
      <div className="flex items-center gap-2 text-sm font-semibold text-secondary-900 dark:text-white">
        <DevicePhoneMobileIcon className="h-5 w-5" />
        {t('access.authApp')}
      </div>
      {active ? (
        <>
          <div className="mt-3 font-mono text-3xl font-bold tracking-[0.3em] text-secondary-900 dark:text-white" aria-live="polite" data-testid="totp-code">
            {code ? `${code.slice(0, 3)} ${code.slice(3)}` : '··· ···'}
          </div>
          <div className="mt-1 text-xs text-secondary-500">{left !== null ? t('access.secondsLeft', { s: left }) : ' '}</div>
          <p className="mt-3 text-[11px] text-secondary-600 dark:text-secondary-300">{t('access.authAppHint', { secret: DEMO_TOTP_SECRET })}</p>
        </>
      ) : (
        <p className="mt-2 text-xs text-secondary-600 dark:text-secondary-300">{t('access.mfaOff')}</p>
      )}
    </div>
  );
}
