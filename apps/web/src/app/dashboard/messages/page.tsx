'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  MagnifyingGlassIcon,
  PaperClipIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isOwnMessage: boolean;
  status: 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: string;
  title: string;
  projectId: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatar?: string;
  participants: string[];
  status: 'active' | 'archived';
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markAsRead(selectedConversation.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation]);

  const safeString = (value: any) =>
    typeof value === 'string' ? value : value == null ? '' : JSON.stringify(value);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await api.getConversations();

      const normalized: Conversation[] =
        Array.isArray(data) && data.length > 0
          ? data.map((c: any): Conversation => ({
              id: String(c.id || c._id || `conv-${Date.now()}`),
              title: safeString(c.title || c.name || 'Sin título'),
              projectId: safeString(c.projectId || c.project?.id || c.project || ''),
              lastMessage: safeString(c.lastMessage || c.preview || ''),
              lastMessageTime: safeString(c.lastMessageTime || c.updatedAt || new Date().toISOString()),
              unreadCount: Number(c.unreadCount || 0),
              avatar: safeString(c.avatar || c.image || '') || undefined,
              participants: Array.isArray(c.participants) ? c.participants.map(String) : [],
              status: c.status === 'archived' ? 'archived' : 'active',
            }))
          : [];

      setConversations(normalized);
      if (normalized.length > 0) {
        setSelectedConversation((prev) => prev ?? normalized[0]);
      }
    } catch (error) {
      console.error('Failed to load conversations from API:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const transformApiMessage = (apiMessage: any): Message => {
    const id = String(apiMessage.id || apiMessage._id || `msg-${Date.now()}`);
    const senderId = String(apiMessage.senderId || apiMessage.sender?._id || apiMessage.sender || 'unknown');
    const senderName = safeString(
      apiMessage.senderName ||
      apiMessage.sender?.name ||
      apiMessage.sender?.email ||
      apiMessage.sender ||
      'Desconocido'
    );
    const content = safeString(apiMessage.content ?? apiMessage.text ?? apiMessage.body ?? '');
    const timestamp = safeString(apiMessage.timestamp || apiMessage.createdAt || new Date().toISOString());
    const isOwnMessage = Boolean(
      apiMessage.isOwnMessage ||
      apiMessage.fromSelf ||
      apiMessage.isOwn ||
      senderId === 'current-user'
    );
    const status = (apiMessage.status as Message['status']) || (apiMessage.read ? 'read' : 'sent');

    return {
      id,
      senderId,
      senderName,
      content,
      timestamp,
      isOwnMessage,
      status,
    };
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const conversationData = await api.getConversationById(conversationId);

      // Extract messages from conversation data
      const apiMessages = conversationData?.messages || [];

      if (Array.isArray(apiMessages) && apiMessages.length > 0) {
        const normalized = apiMessages.map(transformApiMessage);
        setMessages(normalized);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load messages from API:', error);
      setMessages([]);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await api.markConversationAsRead(conversationId);
      setConversations((prev) =>
        prev.map((conv) => (conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv))
      );
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent = newMessage;
    setNewMessage('');

    // Optimistic UI update - add message immediately
    const optimisticMessage: Message = {
      id: `msg-temp-${Date.now()}`,
      senderId: 'current-user',
      senderName: 'Tú',
      content: messageContent,
      timestamp: new Date().toISOString(),
      isOwnMessage: true,
      status: 'sent',
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    // Update conversation preview
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation.id
          ? { ...conv, lastMessage: messageContent, lastMessageTime: new Date().toISOString() }
          : conv
      )
    );

    try {
      const response = await api.sendMessage({
        conversationId: selectedConversation.id,
        content: messageContent,
      });

      // Update the optimistic message with the real one from API
      if (response) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticMessage.id ? transformApiMessage(response) : msg
          )
        );
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
      // Restore the message in the input
      setNewMessage(messageContent);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    }
  };

  const getMessageStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sent':
        return <CheckIcon className="h-4 w-4" />;
      case 'delivered':
      case 'read':
        return (
          <div className="flex">
            <CheckIcon className="h-4 w-4 -mr-1" />
            <CheckIcon className="h-4 w-4" />
          </div>
        );
      default:
        return null;
    }
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      (conv.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.lastMessage || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">Mensajes</h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Comunícate con el equipo de KopTup sobre tus proyectos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
          <div className="lg:col-span-1">
            <Card variant="bordered" className="h-full flex flex-col">
              <CardContent className="p-4 flex-1 overflow-hidden flex flex-col">
                <div className="mb-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                    <input
                      type="text"
                      placeholder="Buscar conversaciones..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                  {filteredConversations.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-secondary-600 dark:text-secondary-400">No se encontraron conversaciones</p>
                    </div>
                  ) : (
                    filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          selectedConversation?.id === conv.id
                            ? 'bg-primary-50 dark:bg-primary-950 border-2 border-primary-500'
                            : 'hover:bg-secondary-50 dark:hover:bg-secondary-800 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center flex-shrink-0">
                            <UserCircleIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-sm text-secondary-900 dark:text-white truncate">{conv.title}</h4>
                              {conv.unreadCount > 0 && (
                                <Badge variant="secondary" size="sm" className="ml-2 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-secondary-600 dark:text-secondary-400 truncate mb-1">
                              {typeof conv.lastMessage === 'string' ? conv.lastMessage : safeString(conv.lastMessage)}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" size="sm">
                                {conv.projectId}
                              </Badge>
                              <span className="text-xs text-secondary-500">{formatTime(conv.lastMessageTime)}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card variant="bordered" className="h-full flex flex-col">
                <div className="border-b border-secondary-200 dark:border-secondary-700 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">{selectedConversation.title}</h3>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        {selectedConversation.participants?.join(', ') || 'Sin participantes'}
                      </p>
                    </div>
                    <Badge variant="primary" size="sm">
                      {selectedConversation.projectId}
                    </Badge>
                  </div>
                </div>

                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => {
                    const messageId = String(message?.id || `msg-${Date.now()}`);
                    const messageContent = typeof message?.content === 'string' ? message.content : safeString(message?.content);
                    const messageSenderName = safeString(message?.senderName || 'Desconocido');
                    const messageTimestamp = safeString(message?.timestamp || new Date().toISOString());
                    const messageIsOwnMessage = Boolean(message?.isOwnMessage);
                    const messageStatus = message?.status || 'sent';

                    return (
                      <div key={messageId} className={`flex ${messageIsOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${messageIsOwnMessage ? 'order-2' : 'order-1'}`}>
                          {!messageIsOwnMessage && (
                            <p className="text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">
                              {messageSenderName}
                            </p>
                          )}
                          <div
                            className={`rounded-lg p-3 ${
                              messageIsOwnMessage ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{messageContent}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-1 ${messageIsOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-xs text-secondary-500">{formatTime(messageTimestamp)}</span>
                            {messageIsOwnMessage && <span className="text-secondary-500">{getMessageStatusIcon(messageStatus)}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </CardContent>

                <div className="border-t border-secondary-200 dark:border-secondary-700 p-4">
                  <div className="flex items-end gap-2">
                    <button
                      className="p-2 rounded-lg text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
                      title="Adjuntar archivo"
                    >
                      <PaperClipIcon className="h-6 w-6" />
                    </button>
                    <div className="flex-1">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Escribe un mensaje..."
                        rows={2}
                        className="w-full px-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      />
                    </div>
                    <Button onClick={sendMessage} disabled={!newMessage.trim()} className="flex-shrink-0">
                      <PaperAirplaneIcon className="h-5 w-5" />
                    </Button>
                  </div>
                  <p className="text-xs text-secondary-500 mt-2">Presiona Enter para enviar, Shift + Enter para nueva línea</p>
                </div>
              </Card>
            ) : (
              <Card variant="bordered" className="h-full flex items-center justify-center">
                <div className="text-center">
                  <UserCircleIcon className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
                  <p className="text-secondary-600 dark:text-secondary-400">Selecciona una conversación para comenzar</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
