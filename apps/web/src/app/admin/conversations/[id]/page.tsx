'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

export default function AdminConversationDetailPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversation();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/conversations/${conversationId}`);
      setConversation(response.data?.data?.conversation);
      setMessages(response.data?.data?.messages || []);
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      await api.post('/messages/send', {
        conversationId,
        content: newMessage.trim(),
        type: 'text',
      });
      setNewMessage('');
      await loadConversation();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400',
      client: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400',
      support: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400',
      project_manager: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400',
    };
    return colors[role] || 'bg-secondary-100 text-secondary-800';
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

  if (!conversation) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-secondary-600 dark:text-secondary-400">
            Conversación no encontrada
          </p>
          <Link href="/admin/conversations">
            <Button variant="outline" className="mt-4">
              Volver a conversaciones
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  // Group messages by date
  const groupedMessages: Record<string, any[]> = {};
  messages.forEach((msg) => {
    const dateKey = formatMessageDate(msg.timestamp);
    if (!groupedMessages[dateKey]) {
      groupedMessages[dateKey] = [];
    }
    groupedMessages[dateKey].push(msg);
  });

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/conversations">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Volver a conversaciones
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
                {conversation.title}
              </h1>
              {conversation.projectName && (
                <p className="text-secondary-600 dark:text-secondary-400 mt-1">
                  Proyecto: {conversation.projectName}
                </p>
              )}
            </div>
            <Badge variant="primary" size="sm">
              {conversation.status}
            </Badge>
          </div>

          {/* Participants */}
          <div className="mt-4 flex gap-3">
            {conversation.participants.map((participant: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary-100 dark:bg-secondary-800"
              >
                <UserIcon className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
                <span className="text-sm font-medium text-secondary-900 dark:text-white">
                  {participant.name}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded ${getRoleBadgeColor(participant.role)}`}
                >
                  {participant.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        <Card variant="bordered" className="flex-1 flex flex-col">
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                <div className="flex items-center justify-center mb-4">
                  <span className="text-xs text-secondary-500 bg-secondary-100 dark:bg-secondary-800 px-3 py-1 rounded-full">
                    {date}
                  </span>
                </div>
                <div className="space-y-4">
                  {msgs.map((message) => (
                    <div key={message.id} className="flex gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center">
                        {message.senderAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={message.senderAvatar}
                            alt={message.senderName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                            {message.senderName[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-secondary-900 dark:text-white text-sm">
                            {message.senderName}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${getRoleBadgeColor(
                              message.senderRole
                            )}`}
                          >
                            {message.senderRole}
                          </span>
                          <span className="text-xs text-secondary-500">
                            {formatMessageTime(message.timestamp)}
                          </span>
                        </div>
                        <div className="bg-secondary-50 dark:bg-secondary-900 rounded-lg p-3">
                          <p className="text-secondary-900 dark:text-white whitespace-pre-wrap">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input */}
          <div className="border-t border-secondary-200 dark:border-secondary-700 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Escribe tu mensaje..."
                className="flex-1 px-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                disabled={sending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                className="px-6"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
