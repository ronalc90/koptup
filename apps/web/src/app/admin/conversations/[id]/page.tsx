'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { apiRequest } from '@/lib/demo-system';
import { describeError, formatDateTime, refreshPanelCounts } from '@/lib/portal';
import { ArrowLeftIcon, PaperAirplaneIcon, UserIcon } from '@heroicons/react/24/outline';

interface DetailMessage {
  id: string;
  senderName: string;
  senderRole: 'admin' | 'client' | 'support';
  content: string;
  type: string;
  timestamp: string;
  isOwnMessage: boolean;
  readByOthers?: boolean;
}

interface Detail {
  conversation: {
    id: string;
    title: string;
    projectName: string | null;
    orderId: string | null;
    participants: Array<{ name: string; email: string; role: 'admin' | 'client' | 'support' }>;
    status: 'active' | 'archived' | 'closed';
  };
  messages: DetailMessage[];
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400',
  client: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400',
  support: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400',
};

export default function AdminConversationDetailPage() {
  const params = useParams();
  const conversationId = String(params.id ?? '');
  const t = useTranslations('adminConversations');
  const tc = useTranslations('portalCommon');
  const locale = useLocale();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<{ status: number; message: string } | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const errorTexts = { network: tc('errors.network'), rateLimited: tc('errors.rateLimited'), server: tc('errors.server'), generic: tc('errors.generic') };

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const data = await apiRequest<Detail>(`/admin/conversations/${encodeURIComponent(conversationId)}`);
        setDetail(data);
        setLoadError(null);
        // Al abrirla, el equipo la leyó: el contador del menú baja.
        refreshPanelCounts();
      } catch (err) {
        const status = (err as { status?: number }).status ?? 0;
        setLoadError({ status, message: describeError(err, locale, errorTexts) });
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversationId, locale],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detail?.messages.length]);

  const send = async () => {
    const content = newMessage.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      await apiRequest(`/admin/conversations/${encodeURIComponent(conversationId)}/messages`, { method: 'POST', body: { content } });
      setNewMessage('');
      await load(true);
    } catch (err) {
      toast.error(describeError(err, locale, errorTexts));
    } finally {
      setSending(false);
    }
  };

  const changeStatus = async (status: Detail['conversation']['status']) => {
    try {
      await apiRequest(`/admin/conversations/${encodeURIComponent(conversationId)}/status`, { method: 'PATCH', body: { status } });
      toast.success(t('statusChanged'));
      await load(true);
    } catch (err) {
      toast.error(describeError(err, locale, errorTexts));
    }
  };

  const dayLabel = (iso: string) => {
    const d = new Date(iso);
    const key = (x: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(x);
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    if (key(d) === key(today)) return t('today');
    if (key(d) === key(yesterday)) return t('yesterday');
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Bogota' }).format(d);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!detail) {
    return (
      <AdminLayout>
        <div className="text-center py-12" role="alert">
          <p className="text-secondary-600 dark:text-secondary-400">{loadError?.status === 404 ? t('conversationNotFound') : loadError?.message}</p>
          <div className="mt-4 flex justify-center gap-2">
            {loadError?.status !== 404 && (
              <Button variant="outline" onClick={() => void load()}>
                {tc('retry')}
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/admin/conversations">{t('backToList')}</Link>
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const groups: Array<{ label: string; items: DetailMessage[] }> = [];
  for (const msg of detail.messages) {
    const label = dayLabel(msg.timestamp);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(msg);
    else groups.push({ label, items: [msg] });
  }
  const conv = detail.conversation;

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-[calc(100vh-8rem)]">
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="mb-4" asChild>
            <Link href="/admin/conversations">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              {t('backToList')}
            </Link>
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-white break-words">{conv.title}</h1>
              <p className="text-secondary-600 dark:text-secondary-400 mt-1">
                {[conv.orderId ? t('order', { id: conv.orderId }) : null, conv.projectName ? t('project', { name: conv.projectName }) : null].filter(Boolean).join(' · ')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={conv.status === 'active' ? 'primary' : 'secondary'} size="sm">
                {t(`status.${conv.status}`)}
              </Badge>
              <label htmlFor="conv-status" className="sr-only">
                {t('changeStatus')}
              </label>
              <select
                id="conv-status"
                value={conv.status}
                onChange={(e) => void changeStatus(e.target.value as Detail['conversation']['status'])}
                className="text-sm px-2 py-1 rounded border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white"
              >
                {(['active', 'archived', 'closed'] as const).map((s) => (
                  <option key={s} value={s}>
                    {t(`status.${s}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {conv.participants.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary-100 dark:bg-secondary-800">
                <UserIcon className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
                <span className="text-sm font-medium text-secondary-900 dark:text-white">{p.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${ROLE_COLORS[p.role] ?? ''}`}>{t(`roles.${p.role}`)}</span>
              </div>
            ))}
          </div>
        </div>

        <Card variant="bordered" className="flex-1 flex flex-col">
          <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-h-[60vh]">
            {groups.length === 0 && <p className="text-center text-secondary-500">{t('noMessages')}</p>}
            {groups.map((g) => (
              <div key={g.label}>
                <div className="flex items-center justify-center mb-4">
                  <span className="text-xs text-secondary-500 bg-secondary-100 dark:bg-secondary-800 px-3 py-1 rounded-full">{g.label}</span>
                </div>
                <div className="space-y-4">
                  {g.items.map((m) => (
                    <div key={m.id} className="flex gap-3" data-message-role={m.senderRole}>
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{m.senderName?.[0]?.toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold text-secondary-900 dark:text-white text-sm">{m.senderName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${ROLE_COLORS[m.senderRole] ?? ''}`}>{m.type === 'system' ? t('automatic') : t(`roles.${m.senderRole}`)}</span>
                          <span className="text-xs text-secondary-500">{formatDateTime(m.timestamp, locale)}</span>
                          {m.isOwnMessage && m.readByOthers && <span className="text-xs text-green-600">{t('read')}</span>}
                        </div>
                        <div className={`rounded-lg p-3 ${m.type === 'system' ? 'bg-amber-50 dark:bg-amber-950/40' : 'bg-secondary-50 dark:bg-secondary-900'}`}>
                          <p className="text-secondary-900 dark:text-white whitespace-pre-wrap break-words">{m.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </CardContent>

          <div className="border-t border-secondary-200 dark:border-secondary-700 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <label htmlFor="admin-reply" className="sr-only">
                {t('typeMessage')}
              </label>
              <textarea
                id="admin-reply"
                rows={2}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder={t('typeMessage')}
                maxLength={5000}
                className="flex-1 px-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                disabled={sending}
              />
              <Button onClick={() => void send()} disabled={!newMessage.trim() || sending} isLoading={sending} className="sm:self-end">
                <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                {sending ? t('sending') : t('send')}
              </Button>
            </div>
            <p className="text-xs text-secondary-500 mt-2">{t('replyHelp')}</p>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
