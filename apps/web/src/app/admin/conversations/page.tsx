'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Modal } from '@/components/admin/demos/shared';
import ClientPicker from '@/components/admin/ClientPicker';
import { apiRequest } from '@/lib/demo-system';
import { describeError, formatDateTime, type ClientAccount } from '@/lib/portal';
import { ChatBubbleLeftRightIcon, ClockIcon, MagnifyingGlassIcon, PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface ConversationRow {
  id: string;
  title: string;
  projectName: string | null;
  orderId: string | null;
  participants: Array<{ name: string; email: string; role: string }>;
  client: { name: string; email: string } | null;
  lastMessage: string;
  lastMessageTime: string;
  teamUnread: number;
  status: 'active' | 'archived' | 'closed';
}

const FILTERS = ['all', 'active', 'archived', 'closed'] as const;

export default function AdminConversationsPage() {
  const t = useTranslations('adminConversations');
  const tc = useTranslations('portalCommon');
  const locale = useLocale();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof FILTERS)[number]>('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams({ status: statusFilter });
      if (query) params.set('q', query);
      const data = await apiRequest<ConversationRow[]>(`/admin/conversations?${params}`);
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      setConversations([]);
      setLoadError(describeError(err, locale, { network: tc('errors.network'), rateLimited: tc('errors.rateLimited'), server: tc('errors.server'), generic: tc('errors.generic') }));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, query, locale, tc]);

  useEffect(() => {
    void load();
  }, [load]);

  const statusBadge = (status: ConversationRow['status']) => (
    <Badge variant={status === 'active' ? 'primary' : 'secondary'} size="sm">
      {t(`status.${status}`)}
    </Badge>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">{t('title')}</h1>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">{t('subtitle')}</p>
          </div>
          <Button onClick={() => setCreating(true)}>
            <PlusIcon className="h-5 w-5 mr-2" />
            {t('newConversation')}
          </Button>
        </div>

        <Card variant="bordered">
          <CardContent className="p-4 space-y-4">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setQuery(search.trim());
              }}
            >
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  aria-label={t('searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white"
                />
              </div>
              <Button type="submit" size="sm">
                {tc('search')}
              </Button>
            </form>
            <div className="flex gap-2 flex-wrap">
              {FILTERS.map((f) => (
                <Button key={f} variant={statusFilter === f ? 'primary' : 'outline'} size="sm" onClick={() => setStatusFilter(f)} aria-pressed={statusFilter === f}>
                  {f === 'all' ? t('filterAll') : t(`filters.${f}`)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <CardTitle>
              {t('allConversations')} ({conversations.length})
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
            ) : conversations.length === 0 ? (
              <div className="text-center py-12">
                <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto text-secondary-400 mb-4" />
                <p className="text-secondary-600 dark:text-secondary-400">{query || statusFilter !== 'all' ? t('noResults') : t('noConversations')}</p>
                {!query && statusFilter === 'all' && <p className="text-sm text-secondary-500 mt-1">{t('emptyHint')}</p>}
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.map((c) => (
                  <Link
                    key={c.id}
                    href={`/admin/conversations/${c.id}`}
                    className="block p-4 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-900 transition-colors"
                    data-conversation={c.id}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold text-secondary-900 dark:text-white break-words">{c.title}</h3>
                          {statusBadge(c.status)}
                          {c.teamUnread > 0 && (
                            <Badge variant="warning" size="sm" data-testid="team-unread">
                              {t('unreadCount', { count: c.teamUnread })}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400">
                          {[c.client ? `${c.client.name} · ${c.client.email}` : null, c.orderId ? t('order', { id: c.orderId }) : null, c.projectName ? t('project', { name: c.projectName }) : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      <div className="text-sm text-secondary-500 flex items-center gap-1 flex-shrink-0">
                        <ClockIcon className="h-4 w-4" />
                        <span>{formatDateTime(c.lastMessageTime, locale)}</span>
                      </div>
                    </div>
                    {c.lastMessage && <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2 line-clamp-2">{c.lastMessage}</p>}
                    <div className="flex items-center gap-2 text-xs text-secondary-500">
                      <UserGroupIcon className="h-4 w-4" />
                      <span>{c.participants.map((p) => p.name).join(', ')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {creating && <NewConversationModal onClose={() => setCreating(false)} onCreated={(id) => router.push(`/admin/conversations/${id}`)} />}
      </div>
    </AdminLayout>
  );
}

function NewConversationModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const t = useTranslations('adminConversations');
  const tc = useTranslations('portalCommon');
  const locale = useLocale();
  const [client, setClient] = useState<ClientAccount | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!client) return setError(t('form.clientRequired'));
    if (title.trim().length < 3) return setError(t('form.titleRequired'));
    if (!message.trim()) return setError(t('form.messageRequired'));
    setBusy(true);
    try {
      const res = await apiRequest<{ id: string }>('/messages/conversations', { method: 'POST', body: { clientId: client.id, title: title.trim(), message: message.trim() } });
      onCreated(res.id);
    } catch (err) {
      setError(describeError(err, locale, { network: tc('errors.network'), rateLimited: tc('errors.rateLimited'), server: tc('errors.server'), generic: tc('errors.generic') }));
      setBusy(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white';
  return (
    <Modal title={t('newConversation')} onClose={onClose} wide>
      <div className="space-y-4">
        <ClientPicker value={client} onChange={setClient} label={t('form.client')} />
        <div>
          <label htmlFor="conv-title" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
            {t('form.title')}
          </label>
          <input id="conv-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className={inputCls} />
        </div>
        <div>
          <label htmlFor="conv-message" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
            {t('form.message')}
          </label>
          <textarea id="conv-message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={5000} className={inputCls} />
          <p className="text-xs text-secondary-500 mt-1">{t('form.notifyHelp')}</p>
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {tc('cancel')}
          </Button>
          <Button onClick={() => void submit()} isLoading={busy} disabled={busy}>
            {t('form.submit')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
