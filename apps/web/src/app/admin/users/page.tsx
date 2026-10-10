'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { FaWhatsapp } from 'react-icons/fa';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/admin/demos/shared';
import { apiRequest, copyText, whatsappLink } from '@/lib/demo-system';
import { USER_ROLES, describeError, formatDateTime, type UserRole } from '@/lib/portal';
import { useSessionUser } from '@/hooks/useSessionUser';
import { ClipboardDocumentIcon, KeyIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  provider: 'local' | 'google';
  accountStatus: 'activo' | 'invitado';
  company: string | null;
  phone: string | null;
  avatar?: string;
  lastLogin?: string;
  createdAt?: string;
}

const ROLE_VARIANT: Record<UserRole, 'primary' | 'info' | 'warning' | 'secondary' | 'success'> = {
  admin: 'primary',
  manager: 'primary',
  sales: 'info',
  developer: 'secondary',
  client: 'success',
  prospect: 'warning',
  user: 'secondary',
};

const ROLE_FILTERS = ['all', ...USER_ROLES] as const;

export default function AdminUsersPage() {
  const t = useTranslations('adminUsers');
  const tc = useTranslations('portalCommon');
  const locale = useLocale();
  const { state } = useSessionUser();
  // Solo un admin cambia roles y genera enlaces de restablecimiento (el backend lo exige).
  const isAdmin = state.status === 'ok' && state.user.role === 'admin';
  const myId = state.status === 'ok' ? state.user.id : null;
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [query, setQuery] = useState('');
  const [roleChange, setRoleChange] = useState<{ user: UserRow; role: UserRole } | null>(null);
  const [resetFor, setResetFor] = useState<UserRow | null>(null);
  const [resetLink, setResetLink] = useState<{ url: string; expiresAt: string; phone: string | null; name: string } | null>(null);

  const errorTexts = { network: tc('errors.network'), rateLimited: tc('errors.rateLimited'), server: tc('errors.server'), generic: tc('errors.generic') };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (query) params.set('search', query);
      const data = await apiRequest<UserRow[]>(`/admin/users${params.toString() ? `?${params}` : ''}`);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setUsers([]);
      setLoadError(describeError(err, locale, errorTexts));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, query, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyRole = async () => {
    if (!roleChange) return;
    try {
      await apiRequest(`/admin/users/${roleChange.user.id}/role`, { method: 'PATCH', body: { role: roleChange.role } });
      toast.success(t('roleUpdated'));
      setRoleChange(null);
      await load();
    } catch (err) {
      toast.error(describeError(err, locale, errorTexts));
    }
  };

  const generateReset = async () => {
    if (!resetFor) return;
    try {
      const res = await apiRequest<{ resetUrl: string; expiresAt: string; user: { phone: string | null; name: string } }>(`/admin/users/${resetFor.id}/reset-link`, { method: 'POST' });
      setResetLink({ url: res.resetUrl, expiresAt: res.expiresAt, phone: res.user.phone, name: res.user.name });
      setResetFor(null);
    } catch (err) {
      toast.error(describeError(err, locale, errorTexts));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">{t('title')}</h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">{isAdmin ? t('subtitle') : t('subtitleReadOnly')}</p>
        </div>

        <Card variant="bordered">
          <CardContent className="p-4 space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setQuery(searchQuery.trim());
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  aria-label={t('searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <Button type="submit">{t('search')}</Button>
            </form>
            <div className="flex gap-2 flex-wrap">
              {ROLE_FILTERS.map((r) => (
                <Button key={r} variant={roleFilter === r ? 'primary' : 'outline'} size="sm" onClick={() => setRoleFilter(r)} aria-pressed={roleFilter === r}>
                  {r === 'all' ? t('filterAll') : tc(`roles.${r}`)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <CardTitle>
              {t('allUsers')} ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : loadError ? (
              <div className="text-center py-12" role="alert">
                <p className="text-red-600 dark:text-red-400 mb-4">{loadError}</p>
                <Button variant="outline" onClick={() => void load()}>
                  {tc('retry')}
                </Button>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <UserIcon className="h-12 w-12 mx-auto text-secondary-400 mb-4" />
                <p className="text-secondary-600 dark:text-secondary-400">{t('noUsers')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px]">
                  <thead className="border-b border-secondary-200 dark:border-secondary-700">
                    <tr>
                      <th className="text-left py-3 px-3 text-sm font-semibold text-secondary-900 dark:text-white">{t('tableUser')}</th>
                      <th className="text-left py-3 px-3 text-sm font-semibold text-secondary-900 dark:text-white">{t('tableRole')}</th>
                      <th className="text-left py-3 px-3 text-sm font-semibold text-secondary-900 dark:text-white">{t('tableAccount')}</th>
                      <th className="text-left py-3 px-3 text-sm font-semibold text-secondary-900 dark:text-white">{t('tableLastLogin')}</th>
                      <th className="text-right py-3 px-3 text-sm font-semibold text-secondary-900 dark:text-white">{t('tableActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-900" data-user={user.email}>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{user.name?.[0]?.toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-secondary-900 dark:text-white truncate">{user.name}</p>
                              <p className="text-xs text-secondary-500 truncate">
                                {user.email}
                                {user.company ? ` · ${user.company}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={ROLE_VARIANT[user.role] ?? 'secondary'} size="sm" data-role={user.role}>
                            {tc(`roles.${user.role}`)}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-sm text-secondary-600 dark:text-secondary-400">
                          {user.accountStatus === 'invitado' ? t('notActivated') : user.provider === 'google' ? t('providerGoogle') : t('providerLocal')}
                        </td>
                        <td className="py-3 px-3 text-sm text-secondary-600 dark:text-secondary-400">{user.lastLogin ? formatDateTime(user.lastLogin, locale) : '—'}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-end gap-2">
                            {isAdmin ? (
                              <>
                                <label htmlFor={`role-${user.id}`} className="sr-only">
                                  {t('changeRoleFor', { name: user.name })}
                                </label>
                                <select
                                  id={`role-${user.id}`}
                                  value={user.role}
                                  disabled={user.id === myId}
                                  title={user.id === myId ? t('ownRole') : undefined}
                                  onChange={(e) => setRoleChange({ user, role: e.target.value as UserRole })}
                                  className="text-sm px-2 py-1 rounded border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white disabled:opacity-60"
                                >
                                  {USER_ROLES.map((r) => (
                                    <option key={r} value={r}>
                                      {tc(`roles.${r}`)}
                                    </option>
                                  ))}
                                </select>
                                {user.provider === 'local' && (
                                  <Button size="sm" variant="ghost" onClick={() => setResetFor(user)} title={t('resetLink')} aria-label={t('resetLinkFor', { name: user.name })}>
                                    <KeyIcon className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-secondary-500">{t('adminOnly')}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-secondary-500">{t('rolesHelp')}</p>

        {roleChange && (
          <ConfirmDialog
            title={t('confirmRoleTitle')}
            message={t('confirmRoleChange', { name: roleChange.user.name, from: tc(`roles.${roleChange.user.role}`), to: tc(`roles.${roleChange.role}`) })}
            confirmLabel={t('confirmRoleButton')}
            cancelLabel={tc('cancel')}
            onConfirm={applyRole}
            onClose={() => setRoleChange(null)}
          />
        )}
        {resetFor && (
          <ConfirmDialog
            title={t('resetLink')}
            message={t('resetConfirm', { name: resetFor.name, email: resetFor.email })}
            confirmLabel={t('resetGenerate')}
            cancelLabel={tc('cancel')}
            onConfirm={generateReset}
            onClose={() => setResetFor(null)}
          />
        )}
        {resetLink && (
          <Modal title={t('resetLink')} onClose={() => setResetLink(null)}>
            <ResetLinkPanel link={resetLink} />
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}

function ResetLinkPanel({ link }: { link: { url: string; expiresAt: string; phone: string | null; name: string } }) {
  const t = useTranslations('adminUsers');
  const locale = useLocale();
  const expires = formatDateTime(link.expiresAt, locale);
  const wa = whatsappLink(link.phone, t('resetWhatsapp', { name: link.name.split(' ')[0] ?? '', url: link.url, date: expires }));
  return (
    <div className="space-y-3" data-testid="reset-link-panel">
      <p className="text-sm text-secondary-700 dark:text-secondary-300">{t('resetHelp', { date: expires })}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          readOnly
          value={link.url}
          onFocus={(e) => e.currentTarget.select()}
          aria-label={t('resetLink')}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white text-sm font-mono"
          data-testid="reset-link"
        />
        <Button
          onClick={async () => {
            if (await copyText(link.url)) toast.success(t('copied'));
            else toast.error(t('copyFailed'));
          }}
        >
          <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
          {t('copy')}
        </Button>
      </div>
      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-green-600 text-green-700 dark:text-green-400 text-sm font-semibold hover:bg-green-100 dark:hover:bg-green-950"
        >
          <FaWhatsapp className="h-4 w-4" />
          {t('whatsapp')}
        </a>
      ) : (
        <p className="text-xs text-secondary-500">{t('noPhone')}</p>
      )}
    </div>
  );
}
