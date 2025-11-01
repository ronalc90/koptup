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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const safeString = (value: any) =>
    typeof value === 'string' ? value : value == null ? '' : JSON.stringify(value);

  const loadConversations = async () => {
    try {
      const data = await api.getConversations();
      const normalized =
        Array.isArray(data) && data.length
          ? data.map((c: any) => ({
              id: String(c.id || c._id || `conv-${Date.now()}`),
              title: safeString(c.title || c.name || 'Sin título'),
              projectId: safeString(c.projectId || c.project || ''),
              lastMessage: safeString(c.lastMessage || c.preview || ''),
              lastMessageTime: safeString(c.lastMessageTime || c.updatedAt || new Date().toISOString()),
              unreadCount: Number(c.unreadCount || 0),
              avatar: safeString(c.avatar || c.image || ''),
              participants: Array.isArray(c.participants) ? c.participants.map(String) : [],
              status: c.status === 'archived' ? 'archived' : 'active',
            }))
          : [];

      if (normalized.length > 0) {
        setConversations(normalized);
        setSelectedConversation((prev) => prev ?? normalized[0]);
      } else {
        throw new Error('No conversations returned from API');
      }
    } catch (error) {
      console.error('Failed to load conversations from API, using fallback data:', error);

      const mockConversations: Conversation[] = [
        {
          id: 'conv-001',
          title: 'Sistema de gestión de inventario',
          projectId: 'PRJ-001',
          lastMessage: 'Hemos completado la primera fase del desarrollo',
          lastMessageTime: '2025-10-11T10:30:00',
          unreadCount: 3,
          participants: ['Cliente', 'Equipo KopTup'],
          status: 'active',
        },
        {
          id: 'conv-002',
          title: 'Aplicación móvil iOS/Android',
          projectId: 'PRJ-002',
          lastMessage: 'Necesitamos aclaración sobre los requisitos de la pantalla de login',
          lastMessageTime: '2025-10-10T15:45:00',
          unreadCount: 1,
          participants: ['Cliente', 'Equipo KopTup'],
          status: 'active',
        },
        {
          id: 'conv-003',
          title: 'Website corporativo',
          projectId: 'PRJ-003',
          lastMessage: 'Perfecto, procedemos con el diseño aprobado',
          lastMessageTime: '2025-10-09T09:20:00',
          unreadCount: 0,
          participants: ['Cliente', 'Equipo KopTup'],
          status: 'active',
        },
        {
          id: 'conv-004',
          title: 'Soporte - Actualización de módulo',
          projectId: 'ORD-001',
          lastMessage: 'La actualización se implementará este fin de semana',
          lastMessageTime: '2025-10-08T14:10:00',
          unreadCount: 0,
          participants: ['Cliente', 'Soporte KopTup'],
          status: 'active',
        },
      ];

      setConversations(mockConversations);
      if (mockConversations.length > 0) {
        setSelectedConversation(mockConversations[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const transformApiMessage = (apiMessage: any): Message => {
    const id = String(apiMessage.id || apiMessage._id || `msg-${Date.now()}`);
    const senderId = String(apiMessage.senderId || apiMessage.sender || 'unknown');
    const senderName = safeString(apiMessage.senderName || apiMessage.senderName || apiMessage.sender || 'Desconocido');
    const content = safeString(apiMessage.content ?? apiMessage.text ?? apiMessage.body ?? '');
    const timestamp = safeString(apiMessage.timestamp || apiMessage.createdAt || new Date().toISOString());
    const isOwnMessage = Boolean(apiMessage.isOwnMessage || apiMessage.fromSelf || apiMessage.senderId === 'user-001');
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
      // Try API first if available
      if (typeof api.getMessages === 'function') {
        const apiMessages = await api.getMessages(conversationId);
        if (Array.isArray(apiMessages)) {
          const normalized = apiMessages.map(transformApiMessage);
          setMessages(normalized);
          return;
        }
      }

      // If API not available or returned invalid data, try api.getConversationMessages or fallback
      if (typeof (api as any).getConversationMessages === 'function') {
        const apiMessages = await (api as any).getConversationMessages(conversationId);
        if (Array.isArray(apiMessages)) {
          const normalized = apiMessages.map(transformApiMessage);
          setMessages(normalized);
          return;
        }
      }

      // Fallback to mock data
      const mockMessages: Message[] = [
        {
          id: 'msg-001',
          senderId: 'user-001',
          senderName: 'Juan Pérez',
          content: 'Hola, quisiera saber el estado del proyecto',
          timestamp: '2025-10-11T09:00:00',
          isOwnMessage: true,
          status: 'read',
        },
        {
          id: 'msg-002',
          senderId: 'team-001',
          senderName: 'María González - KopTup',
          content: 'Buen día, con gusto te informo sobre el avance del proyecto.',
          timestamp: '2025-10-11T09:15:00',
          isOwnMessage: false,
          status: 'read',
        },
        {
          id: 'msg-003',
          senderId: 'team-001',
          senderName: 'María González - KopTup',
          content:
            'Hemos completado la primera fase del desarrollo que incluye el módulo de autenticación y el dashboard principal.',
          timestamp: '2025-10-11T09:16:00',
          isOwnMessage: false,
          status: 'read',
        },
        {
          id: 'msg-004',
          senderId: 'user-001',
          senderName: 'Juan Pérez',
          content: 'Excelente, ¿cuándo podré ver una demo?',
          timestamp: '2025-10-11T09:20:00',
          isOwnMessage: true,
          status: 'read',
        },
        {
          id: 'msg-005',
          senderId: 'team-001',
          senderName: 'María González - KopTup',
          content: 'Podemos agendar una reunión para mañana a las 10:00 AM para mostrarte la demo en vivo.',
          timestamp: '2025-10-11T09:25:00',
          isOwnMessage: false,
          status: 'read',
        },
        {
          id: 'msg-006',
          senderId: 'team-001',
          senderName: 'María González - KopTup',
          content: 'Te enviaré el link de la videollamada por correo.',
          timestamp: '2025-10-11T09:26:00',
          isOwnMessage: false,
          status: 'read',
        },
        {
          id: 'msg-007',
          senderId: 'user-001',
          senderName: 'Juan Pérez',
          content: 'Perfecto, allí estaré. Gracias!',
          timestamp: '2025-10-11T10:30:00',
          isOwnMessage: true,
          status: 'delivered',
        },
      ];

      setMessages(mockMessages);
    } catch (error) {
      console.error('Failed to load messages (mock fallback)', error);
      setMessages([]); // fallback seguro
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      if (typeof api.markConversationAsRead === 'function') {
        await api.markConversationAsRead(conversationId);
      }
      setConversations((prev) =>
        prev.map((conv) => (conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv))
      );
    } catch (error) {
      console.error('Failed to mark conversation as read via API, updating locally:', error);
      setConversations((prev) =>
        prev.map((conv) => (conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv))
      );
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent = newMessage;
    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'user-001',
      senderName: 'Tú',
      content: messageContent,
      timestamp: new Date().toISOString(),
      isOwnMessage: true,
      status: 'sent',
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage('');

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation.id
          ? { ...conv, lastMessage: messageContent, lastMessageTime: new Date().toISOString() }
          : conv
      )
    );

    try {
      if (typeof api.sendMessage === 'function') {
        await api.sendMessage({
          conversationId: selectedConversation.id,
          content: messageContent,
        });
      }
    } catch (error) {
      console.error('Failed to send message via API:', error);
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
