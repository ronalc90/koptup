'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Cookies from 'js-cookie';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { UserCircleIcon, KeyIcon, ShieldCheckIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ApiError, apiRequest, formatDate } from '@/lib/demo-system';

/**
 * Portal › Mi perfil. Todo sale del backend y se guarda de verdad:
 *  - GET /api/auth/me: datos de la cuenta (nombre, email, teléfono, empresa, rol, fechas).
 *  - PATCH /api/auth/me: nombre, teléfono y empresa (el email y el rol no se cambian aquí).
 *  - POST /api/auth/change-password: verifica la contraseña actual y devuelve una sesión nueva.
 */

interface Profile {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  company: string | null;
  provider: 'local' | 'google';
  accountStatus: 'invitado' | 'activo';
  created_at: string | null;
  last_login: string | null;
}

interface Session {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string; role: string };
}

const ROLE_KEYS = ['admin', 'manager', 'sales', 'developer', 'prospect', 'client', 'user'] as const;
const MIN_PASSWORD = 8;

type Draft = { name: string; phone: string; company: string };
type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';

export default function ProfilePage() {
  const t = useTranslations('profilePage');
  const locale = useLocale();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>({ name: '', phone: '', company: '' });
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState<{ field?: keyof Draft; message: string } | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const [passwords, setPasswords] = useState<Record<PasswordField, string>>({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState<{ field?: PasswordField; message: string } | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [changing, setChanging] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const data = await apiRequest<Profile>('/auth/me');
      setProfile(data);
      setDraft({ name: data.name ?? '', phone: data.phone ?? '', company: data.company ?? '' });
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const serverMessage = (err: unknown, fallback: string) =>
    err instanceof ApiError && err.status >= 400 && err.status < 500 && locale === 'es' && !/^HTTP \d+/.test(err.message) ? err.message : fallback;

  const startEdit = () => {
    if (!profile) return;
    setDraft({ name: profile.name ?? '', phone: profile.phone ?? '', company: profile.company ?? '' });
    setProfileError(null);
    setProfileSaved(false);
    setEditing(true);
  };

  const saveProfile = async () => {
    setProfileError(null);
    setProfileSaved(false);
    if (draft.name.trim().length < 2) return setProfileError({ field: 'name', message: t('errors.name') });
    if (draft.phone.trim() && !/^[+0-9 ().-]{7,40}$/.test(draft.phone.trim())) return setProfileError({ field: 'phone', message: t('errors.phone') });
    setSaving(true);
    try {
      const data = await apiRequest<Profile>('/auth/me', {
        method: 'PATCH',
        body: { name: draft.name.trim(), phone: draft.phone.trim(), company: draft.company.trim() },
      });
      setProfile(data);
      setEditing(false);
      setProfileSaved(true);
      // El nombre también se muestra en el encabezado (guardado al iniciar sesión).
      try {
        const stored = JSON.parse(localStorage.getItem('user') ?? 'null');
        if (stored) localStorage.setItem('user', JSON.stringify({ ...stored, name: data.name }));
      } catch {
        // sin almacenamiento local: solo cambia el encabezado al volver a entrar
      }
    } catch (err) {
      const field = err instanceof ApiError && Array.isArray(err.data.fields) ? (String(err.data.fields[0]) as keyof Draft) : undefined;
      setProfileError({ field, message: serverMessage(err, t('errors.save')) });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);
    if (!passwords.currentPassword) return setPasswordError({ field: 'currentPassword', message: t('errors.currentRequired') });
    if (passwords.newPassword.length < MIN_PASSWORD) return setPasswordError({ field: 'newPassword', message: t('errors.passwordShort', { min: MIN_PASSWORD }) });
    if (passwords.newPassword !== passwords.confirmPassword) return setPasswordError({ field: 'confirmPassword', message: t('passwordMismatch') });
    setChanging(true);
    try {
      const session = await apiRequest<Session>('/auth/change-password', {
        method: 'POST',
        body: { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword },
      });
      // Sesión nueva (la anterior deja de servir en otros navegadores).
      Cookies.set('accessToken', session.accessToken, { expires: 1 / 96 });
      Cookies.set('refreshToken', session.refreshToken, { expires: 7 });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSaved(true);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      const field: PasswordField | undefined = code === 'wrong_password' ? 'currentPassword' : code === 'invalid_password' ? 'newPassword' : undefined;
      const fallback = err instanceof ApiError && err.status === 429 ? t('errors.tooMany') : code === 'wrong_password' ? t('errors.wrongPassword') : t('errors.passwordSave');
      setPasswordError({ field, message: serverMessage(err, fallback) });
    } finally {
      setChanging(false);
    }
  };

  const roleLabel = (role: string) => t(`accountRoles.${(ROLE_KEYS as readonly string[]).includes(role) ? role : 'user'}`);

  if (!profile) {
    return (
      <DashboardLayout>
        {loadError ? (
          <div className="p-6 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 flex flex-wrap items-center justify-between gap-3" role="alert">
            <p className="text-sm text-red-700 dark:text-red-300">{t('loadError')}</p>
            <Button size="sm" variant="outline" onClick={load}>
              {t('retry')}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96" role="status" aria-label={t('loading')}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}
      </DashboardLayout>
    );
  }

  const localAccount = profile.provider !== 'google';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">{t('title')}</h1>
          <p className="text-secondary-600 dark:text-secondary-400">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Datos personales */}
            <Card variant="bordered">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <UserCircleIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    <CardTitle>{t('personalInfo')}</CardTitle>
                  </div>
                  {!editing ? (
                    <Button variant="outline" size="sm" onClick={startEdit} data-testid="profile-edit">
                      <PencilIcon className="h-4 w-4 mr-2" />
                      {t('edit')}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>
                        <XMarkIcon className="h-4 w-4 mr-2" />
                        {t('cancel')}
                      </Button>
                      <Button size="sm" onClick={saveProfile} isLoading={saving} data-testid="profile-save">
                        <CheckIcon className="h-4 w-4 mr-2" />
                        {t('save')}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    id="profile-name"
                    label={t('fullName')}
                    value={editing ? draft.name : profile.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    disabled={!editing}
                    maxLength={120}
                    autoComplete="name"
                    error={profileError?.field === 'name' ? profileError.message : undefined}
                  />
                  <Input id="profile-email" label={t('email')} type="email" value={profile.email} disabled helperText={t('emailHelp')} />
                  <Input
                    id="profile-phone"
                    label={t('phone')}
                    type="tel"
                    value={editing ? draft.phone : profile.phone ?? ''}
                    placeholder={editing ? t('phonePlaceholder') : t('notProvided')}
                    onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                    disabled={!editing}
                    maxLength={40}
                    autoComplete="tel"
                    error={profileError?.field === 'phone' ? profileError.message : undefined}
                  />
                  <Input
                    id="profile-company"
                    label={t('companyName')}
                    value={editing ? draft.company : profile.company ?? ''}
                    placeholder={editing ? '' : t('notProvided')}
                    onChange={(e) => setDraft({ ...draft, company: e.target.value })}
                    disabled={!editing}
                    maxLength={160}
                    autoComplete="organization"
                  />
                </div>
                {profileError && !profileError.field && (
                  <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
                    {profileError.message}
                  </p>
                )}
                {profileSaved && (
                  <p role="status" className="mt-4 text-sm text-green-700 dark:text-green-400" data-testid="profile-saved">
                    {t('profileSaved')}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Contraseña */}
            <Card variant="bordered">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <KeyIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  <div>
                    <CardTitle>{t('changePassword')}</CardTitle>
                    <CardDescription>{localAccount ? t('changePasswordDesc') : t('googleAccount')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              {localAccount && (
                <CardContent>
                  <form className="space-y-4" onSubmit={changePassword} noValidate data-testid="password-form">
                    <Input
                      id="current-password"
                      label={t('currentPassword')}
                      type="password"
                      autoComplete="current-password"
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                      placeholder={t('currentPasswordPlaceholder')}
                      error={passwordError?.field === 'currentPassword' ? passwordError.message : undefined}
                    />
                    <Input
                      id="new-password"
                      label={t('newPassword')}
                      type="password"
                      autoComplete="new-password"
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      placeholder={t('newPasswordPlaceholder')}
                      error={passwordError?.field === 'newPassword' ? passwordError.message : undefined}
                    />
                    <Input
                      id="confirm-password"
                      label={t('confirmNewPassword')}
                      type="password"
                      autoComplete="new-password"
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      placeholder={t('confirmNewPasswordPlaceholder')}
                      error={passwordError?.field === 'confirmPassword' ? passwordError.message : undefined}
                    />
                    {passwordError && !passwordError.field && (
                      <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                        {passwordError.message}
                      </p>
                    )}
                    {passwordSaved && (
                      <p role="status" className="text-sm text-green-700 dark:text-green-400" data-testid="password-saved">
                        {t('passwordUpdated')}
                      </p>
                    )}
                    <Button type="submit" isLoading={changing} disabled={changing}>
                      {t('changePassword')}
                    </Button>
                  </form>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Cuenta */}
          <div className="space-y-6">
            <Card variant="bordered">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  <CardTitle>{t('account')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-secondary-600 dark:text-secondary-400">{t('accountType')}</dt>
                    <dd>
                      <Badge variant="primary" size="sm">
                        {roleLabel(profile.role)}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-secondary-600 dark:text-secondary-400">{t('signInMethod')}</dt>
                    <dd className="text-secondary-900 dark:text-white">{localAccount ? t('signInPassword') : t('signInGoogle')}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-secondary-600 dark:text-secondary-400">{t('memberSince')}</dt>
                    <dd className="text-secondary-900 dark:text-white">{formatDate(profile.created_at, locale)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-secondary-600 dark:text-secondary-400">{t('lastLogin')}</dt>
                    <dd className="text-secondary-900 dark:text-white">{formatDate(profile.last_login, locale, true)}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs text-secondary-500 dark:text-secondary-400">{t('accountHelp')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
