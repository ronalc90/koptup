'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChatbot, ChatbotConfig } from '@/hooks/useChatbot';
import { PaperAirplaneIcon, ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import {
  FaRegCommentDots,
  FaComments,
  FaRocketchat,
  FaRobot,
  FaComment
} from 'react-icons/fa';
import Link from 'next/link';

const chatIcons = [
  { id: 'FaComments', icon: FaComments },
  { id: 'FaRegCommentDots', icon: FaRegCommentDots },
  { id: 'FaRocketchat', icon: FaRocketchat },
  { id: 'FaRobot', icon: FaRobot },
  { id: 'FaComment', icon: FaComment },
];

export default function ChatbotPreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputMessage, setInputMessage] = useState('');

  // Get config from URL params or use defaults
  const config: Partial<ChatbotConfig> = {
    title: searchParams.get('title') || 'Asistente Virtual',
    greeting: searchParams.get('greeting') || '¡Hola! 👋 Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
    placeholder: searchParams.get('placeholder') || 'Escribe tu mensaje aquí...',
    textColor: searchParams.get('textColor') || '#1F2937',
    headerColor: searchParams.get('headerColor') || '#4F46E5',
    backgroundColor: searchParams.get('backgroundColor') || '#FFFFFF',
    icon: searchParams.get('icon') || 'FaComments',
    fontFamily: searchParams.get('fontFamily') || 'Inter',
    customIconUrl: searchParams.get('customIconUrl') || undefined,
  };

  const {
    messages,
    isLoading,
    error,
    sendMessage,
  } = useChatbot(config);

  const [hasScrolled, setHasScrolled] = useState(false);

  // Auto-scroll to bottom when new messages arrive (but not on initial load)
  useEffect(() => {
    if (messages.length > 0 && hasScrolled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (messages.length > 0) {
      setHasScrolled(true);
    }
  }, [messages, hasScrolled]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() && !isLoading) {
      const message = inputMessage;
      setInputMessage('');
      await sendMessage(message);
    }
  };

  const SelectedIcon = chatIcons.find(i => i.id === config.icon)?.icon || FaComments;

  // Load Google Font if specified
  useEffect(() => {
    if (config.fontFamily && config.fontFamily !== 'Inter') {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${config.fontFamily.replace(' ', '+')}:wght@400;500;600;700&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, [config.fontFamily]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: config.backgroundColor,
        fontFamily: config.fontFamily ? `'${config.fontFamily}', sans-serif` : 'Inter, sans-serif'
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-4 shadow-lg flex items-center justify-between"
        style={{ backgroundColor: config.headerColor }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/demo/chatbot"
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6 text-white" />
          </Link>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            {config.customIconUrl ? (
              <img
                src={config.customIconUrl}
                alt="Chat icon"
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <SelectedIcon className="h-6 w-6 text-white" />
            )}
          </div>
          <h1 className="text-xl font-semibold text-white">{config.title}</h1>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="space-y-4">
          {/* Greeting Message */}
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-950 rounded-full flex items-center justify-center flex-shrink-0">
              {config.customIconUrl ? (
                <img
                  src={config.customIconUrl}
                  alt="Assistant"
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <SelectedIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              )}
            </div>
            <div className="bg-secondary-100 dark:bg-secondary-700 rounded-2xl rounded-tl-sm p-4 max-w-[85%] sm:max-w-[75%]">
              <p className="text-base" style={{ color: config.textColor }}>
                {config.greeting}
              </p>
            </div>
          </div>

          {/* Chat Messages */}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-950 rounded-full flex items-center justify-center flex-shrink-0">
                  {config.customIconUrl ? (
                    <img
                      src={config.customIconUrl}
                      alt="Assistant"
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <SelectedIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  )}
                </div>
              )}
              <div className="flex flex-col max-w-[85%] sm:max-w-[75%]">
                <div
                  className={`rounded-2xl p-4 ${
                    msg.role === 'user'
                      ? 'rounded-tr-sm'
                      : 'rounded-tl-sm bg-secondary-100 dark:bg-secondary-700'
                  }`}
                  style={msg.role === 'user' ? { backgroundColor: config.headerColor } : {}}
                >
                  <p
                    className="text-base whitespace-pre-wrap break-words"
                    style={{ color: msg.role === 'user' ? '#FFFFFF' : config.textColor }}
                  >
                    {msg.content}
                  </p>
                </div>
                {/* Source indicator */}
                {msg.role === 'assistant' && (msg as any).source && (
                  <div className="flex items-center gap-1.5 mt-1 ml-2">
                    <DocumentTextIcon className="h-3.5 w-3.5 text-secondary-400" />
                    <span className="text-xs text-secondary-500">
                      Fuente: {(msg as any).source}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-950 rounded-full flex items-center justify-center flex-shrink-0">
                {config.customIconUrl ? (
                  <img
                    src={config.customIconUrl}
                    alt="Assistant"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <SelectedIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                )}
              </div>
              <div className="bg-secondary-100 dark:bg-secondary-700 rounded-2xl rounded-tl-sm p-4">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2.5 h-2.5 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2.5 h-2.5 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 dark:text-red-400">!</span>
              </div>
              <div className="bg-red-50 dark:bg-red-950 rounded-2xl rounded-tl-sm p-4 max-w-[85%] sm:max-w-[75%] border border-red-200 dark:border-red-800">
                <p className="text-base text-red-800 dark:text-red-200 break-words">
                  {error}
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto w-full flex gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={config.placeholder}
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-secondary-300 dark:border-secondary-600 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white"
            style={{ fontFamily: config.fontFamily ? `'${config.fontFamily}', sans-serif` : 'Inter, sans-serif' }}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="px-6 py-3 rounded-full transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium"
            style={{ backgroundColor: config.headerColor }}
          >
            <PaperAirplaneIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
