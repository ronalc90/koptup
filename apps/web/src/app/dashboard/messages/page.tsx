'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Modal } from '@/components/admin/demos/shared';
import { PortalError, PortalLoading } from '@/components/dashboard/PortalStates';
import { useErrorText } from '@/hooks/useErrorText';
import { apiRequest } from '@/lib/demo-system';
import { formatDateTime, refreshPanelCounts } from '@/lib/portal';
import { ArrowLeftIcon, ChatBubbleLeftRightIcon, CheckIcon, MagnifyingGlassIcon, PaperAirplaneIcon, PlusIcon } from '@heroicons/react/24/outline';

interface ConversationRow {
  id: string;
  title: string;
  projectName: string | null;
  orderId: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  participants: string[];
  status: 'active' | 'archived' | 'closed';
}

interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: 'admin' | 'client' | 'support';
  content: string;
  type: string;
  timestamp: string;
  isOwnMessage: boolean;
  status: 'sent' | 'read';
}

interface ConversationDetail {
  conversation: { id: string; title: string; status: string; projectName: string | null; orderId: string | null; participants: Array<{ name: string; role: string }> };
  messages: ChatMessage[];
}

/** Revisa si hay respuestas nuevas mientras la conversación está abierta. */
const POLL_MS = 30_000;

function NewConversationModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const t = useTranslations('messagesPage');
  const errorText = useErrorText();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError(t('new.titleRequired'));
    if (!message.trim()) return setError(t('new.messageRequired'));
    setBusy(true);
    setError('');
    try {
      const created = await apiRequest<{ id: string }>('/messages/conversations/support', { method: 'POST', body: { title: title.trim(), message: message.trim() } });
      toast.success(t('new.sent'));
      onCreated(created.id);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white';
  return (
    <Modal title={t('new.title')} onClose={busy ? () => undefined : onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('new.help')}</p>
        <div>
          <label htmlFor="conv-title" className="block text-sm font-medium text-secondary-800 dark:text-secondary-200 mb-1">
            {t('new.subject')}
          </label>
          <input id="conv-title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="conv-message" className="block text-sm font-medium text-secondary-800 dark:text-secondary-200 mb-1">
            {t('new.message')}
          </label>
          <textarea id="conv-message" rows={5} maxLength={5000} value={message} onChange={(e) => setMessage(e.target.value)} className={inputCls} />
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            {t('new.cancel')}
          </Button>
          <Button type="submit" isLoading={busy} disabled={busy}>
            {t('new.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function MessagesContent() {
  const t = useTranslations('messagesPage');
  const locale = useLocale();
  const errorText = useErrorText();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get('c');
  const [conversations, setConversations] = useState<ConversationRow[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [detailError, setDetailError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [creating, setCreating] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const seenCount = useRef<Record<string, number>>({});

  const loadConversations = useCallback(async () => {
    setLoadError('');
    try {
      const data = await apiRequest<ConversationRow[]>('/messages/conversations');
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError(errorText(err));
    }
  }, [errorText]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  // Conversación pedida en la URL (?c=CONV-0001) o la primera de la lista (en pantallas grandes).
  useEffect(() => {
    if (!conversations) return;
    if (requested && conversations.some((c) => c.id === requested)) setSelectedId(requested);
    else if (!selectedId && conversations.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 1024) setSelectedId(conversations[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, requested]);

  const loadDetail = useCallback(
    async (id: string, silent = false) => {
      if (!silent) {
        setDetail(null);
        setDetailError('');
      }
      try {
        const data = await apiRequest<ConversationDetail>(`/messages/conversations/${encodeURIComponent(id)}`);
        setDetail(data);
        setDetailError('');
        // Al abrirla (o si llegó algo nuevo mientras está abierta) queda leída.
        const changed = seenCount.current[id] !== data.messages.length;
        seenCount.current[id] = data.messages.length;
        if (!silent || changed) {
          await apiRequest(`/messages/conversations/${encodeURIComponent(id)}/read`, { method: 'POST' }).catch(() => undefined);
          setConversations((prev) => (prev ? prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)) : prev));
          refreshPanelCounts();
        }
      } catch (err) {
        if (!silent) setDetailError(errorText(err));
      }
    },
    [errorText],
  );

  useEffect(() => {
    if (!selectedId) return;
    void loadDetail(selectedId);
    const timer = window.setInterval(() => void loadDetail(selectedId, true), POLL_MS);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [detail?.messages.length]);

  const select = (id: string | null) => {
    setSelectedId(id);
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set('c', id);
    else params.delete('c');
    router.replace(`/dashboard/messages${params.toString() ? `?${params}` : ''}`, { scroll: false });
  };

  const send = async () => {
    const content = newMessage.trim();
    if (!content || !selectedId || sending) return;
    setSending(true);
    try {
      await apiRequest('/messages/send', { method: 'POST', body: { conversationId: selectedId, content } });
      setNewMessage('');
      await loadDetail(selectedId, true);
      setConversations((prev) =>
        prev ? prev.map((c) => (c.id === selectedId ? { ...c, lastMessage: content, lastMessageTime: new Date().toISOString() } : c)) : prev,
      );
    } catch (err) {
      toast.error(errorText(err, t('sendError')));
    } finally {
      setSending(false);
    }
  };

  const q = searchTerm.trim().toLowerCase();
  const filtered = (conversations ?? []).filter((c) => !q || c.title.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q));

  if (loadError) return <PortalError message={loadError} onRetry={() => void loadConversations()} />;
  if (!conversations) return <PortalLoading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">{t('title')}</h1>
          <p className="text-secondary-600 dark:text-secondary-400">{t('subtitle')}</p>
        </div>
        <Button onClick={() => setCreating(true)} data-testid="new-conversation">
          <PlusIcon className="h-5 w-5 mr-2" />
          {t('new.button')}
        </Button>
      </div>

      {conversations.length === 0 ? (
        <Card variant="bordered">
          <CardContent className="p-10 text-center" data-testid="portal-empty">
            <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto text-secondary-400 mb-4" />
            <p className="font-semibold text-secondary-900 dark:text-white">{t('emptyTitle')}</p>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-2 max-w-xl mx-auto">{t('emptyBody')}</p>
            <Button className="mt-5" size="sm" onClick={() => setCreating(true)}>
              {t('new.button')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[calc(100vh-260px)] lg:min-h-[520px]">
          {/* Lista */}
          <Card variant="bordered" className={`lg:col-span-1 flex flex-col min-h-0 ${selectedId ? 'hidden lg:flex' : 'flex'}`}>
            <CardContent className="p-4 flex-1 overflow-hidden flex flex-col min-h-0">
              <div className="relative mb-4">
                <label htmlFor="conv-search" className="sr-only">
                  {t('searchPlaceholder')}
                </label>
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <input
                  id="conv-search"
                  type="search"
                  placeholder={t('searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <ul className="flex-1 overflow-y-auto space-y-2" data-testid="conversation-list">
                {filtered.length === 0 ? (
                  <li className="text-center py-8 text-secondary-600 dark:text-secondary-400">{t('noConversations')}</li>
                ) : (
                  filtered.map((conv) => (
                    <li key={conv.id}>
                      <button
                        type="button"
                        onClick={() => select(conv.id)}
                        aria-current={selectedId === conv.id}
                        className={`w-full p-3 rounded-lg text-left transition-colors border-2 ${
                          selectedId === conv.id ? 'bg-primary-50 dark:bg-primary-950 border-primary-500' : 'hover:bg-secondary-50 dark:hover:bg-secondary-800 border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-secondary-900 dark:text-white' : 'font-semibold text-secondary-900 dark:text-white'}`}>{conv.title}</span>
                          {conv.unreadCount > 0 && (
                            <Badge variant="danger" size="sm" aria-label={t('unread', { count: conv.unreadCount })}>
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400 truncate mb-1">{conv.lastMessage || t('noMessages')}</p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-secondary-500 truncate">{conv.orderId ?? conv.projectName ?? ''}</span>
                          <span className="text-xs text-secondary-500 flex-shrink-0">{formatDateTime(conv.lastMessageTime, locale)}</span>
                        </div>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Conversación */}
          <Card variant="bordered" className={`lg:col-span-2 flex flex-col min-h-[480px] lg:min-h-0 ${selectedId ? 'flex' : 'hidden lg:flex'}`}>
            {!selectedId ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <p className="text-secondary-600 dark:text-secondary-400">{t('selectConversation')}</p>
              </div>
            ) : detailError ? (
              <div className="p-6">
                <PortalError compact message={detailError} onRetry={() => void loadDetail(selectedId)} />
              </div>
            ) : !detail ? (
              <PortalLoading />
            ) : (
              <>
                <div className="border-b border-secondary-200 dark:border-secondary-700 p-4 flex items-start gap-3">
                  <button type="button" className="lg:hidden p-1 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800" onClick={() => select(null)} aria-label={t('backToList')}>
                    <ArrowLeftIcon className="h-5 w-5" />
                  </button>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-secondary-900 dark:text-white break-words">{detail.conversation.title}</h2>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      {detail.conversation.participants.map((p) => p.name).join(', ') || t('noParticipants')}
                    </p>
                  </div>
                </div>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0" data-testid="message-thread">
                  {detail.messages.length === 0 && <p className="text-center text-secondary-500">{t('noMessages')}</p>}
                  {detail.messages.map((m) =>
                    m.type === 'system' ? (
                      <div key={m.id} className="text-center">
                        <p className="inline-block text-xs text-secondary-700 dark:text-secondary-300 bg-amber-50 dark:bg-amber-950/40 rounded-lg px-3 py-2 whitespace-pre-wrap text-left max-w-[90%]">{m.content}</p>
                        <p className="text-[11px] text-secondary-500 mt-1">{formatDateTime(m.timestamp, locale)}</p>
                      </div>
                    ) : (
                      <div key={m.id} className={`flex ${m.isOwnMessage ? 'justify-end' : 'justify-start'}`} data-own={m.isOwnMessage ? 'true' : 'false'}>
                        <div className="max-w-[85%] sm:max-w-[70%]">
                          {!m.isOwnMessage && <p className="text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">{m.senderName}</p>}
                          <div className={`rounded-lg p-3 ${m.isOwnMessage ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white'}`}>
                            <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-1 ${m.isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-xs text-secondary-500">{formatDateTime(m.timestamp, locale)}</span>
                            {m.isOwnMessage && (
                              <span className="text-secondary-500 flex" title={m.status === 'read' ? t('read') : t('sent')} aria-label={m.status === 'read' ? t('read') : t('sent')}>
                                <CheckIcon className="h-4 w-4" />
                                {m.status === 'read' && <CheckIcon className="h-4 w-4 -ml-2" />}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                  <div ref={endRef} />
                </CardContent>
                <div className="border-t border-secondary-200 dark:border-secondary-700 p-4">
                  <div className="flex items-end gap-2">
                    <label htmlFor="portal-reply" className="sr-only">
                      {t('messagePlaceholder')}
                    </label>
                    <textarea
                      id="portal-reply"
                      value={newMessage}
                      maxLength={5000}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void send();
                        }
                      }}
                      placeholder={t('messagePlaceholder')}
                      rows={2}
                      disabled={sending}
                      className="flex-1 px-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    />
                    <Button onClick={() => void send()} disabled={!newMessage.trim() || sending} isLoading={sending} className="flex-shrink-0" aria-label={t('send')}>
                      <PaperAirplaneIcon className="h-5 w-5" />
                    </Button>
                  </div>
                  <p className="text-xs text-secondary-500 mt-2">{t('enterToSend')}</p>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {creating && (
        <NewConversationModal
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false);
            void loadConversations().then(() => select(id));
          }}
        />
      )}
    </div>
  );
}

/** Portal › Mensajes: conversaciones con el equipo (lectura, respuesta y nuevas). */
export default function MessagesPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<PortalLoading />}>
        <MessagesContent />
      </Suspense>
    </DashboardLayout>
  );
}
