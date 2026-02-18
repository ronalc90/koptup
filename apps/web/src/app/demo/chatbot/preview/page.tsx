'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useChatbot, ChatbotConfig } from '@/hooks/useChatbot';
import {
  PaperAirplaneIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  TrashIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import {
  FaRegCommentDots,
  FaComments,
  FaRocketchat,
  FaRobot,
  FaComment
} from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';

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
  const tcb = useTranslations('chatbotBuilder');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasClearedOnMount = useRef(false);
  const [inputMessage, setInputMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [previewDocuments, setPreviewDocuments] = useState<string[]>([]);
  const [config, setConfig] = useState<Partial<ChatbotConfig>>({
    title: tcb('defaults.title'),
    greeting: tcb('defaults.greeting'),
    placeholder: tcb('defaults.placeholder'),
    textColor: '#1F2937',
    headerColor: '#4F46E5',
    backgroundColor: '#FFFFFF',
    icon: 'FaComments',
    fontFamily: 'Inter',
  });

  // Load config from sessionStorage or URL params on mount
  useEffect(() => {
    // Try to get from sessionStorage first
    if (typeof window !== 'undefined') {
      const storedConfig = sessionStorage.getItem('chatbot_preview_config');
      if (storedConfig) {
        try {
          const data = JSON.parse(storedConfig);
          // Set documents from stored config
          setPreviewDocuments(data.uploadedDocuments || []);
          setConfig({
            title: data.chatConfig?.title || tcb('defaults.title'),
            greeting: data.chatConfig?.greeting || tcb('defaults.greeting'),
            placeholder: data.chatConfig?.placeholder || tcb('defaults.placeholder'),
            textColor: data.designConfig?.textColor || '#1F2937',
            headerColor: data.designConfig?.headerColor || '#4F46E5',
            backgroundColor: data.designConfig?.backgroundColor || '#FFFFFF',
            icon: data.designConfig?.icon || 'FaComments',
            fontFamily: data.typographyConfig?.fontFamily || 'Inter',
            customIconUrl: data.designConfig?.customIconUrl,
            restrictedTopics: data.restrictionsConfig?.restrictedTopics || [],
          });
          return;
        } catch (e) {
          console.error('Error parsing stored config:', e);
        }
      }
    }

    // Fallback to URL params (for embed usage)
    let parsedRestrictedTopics: string[] = [];
    try {
      const raw = searchParams.get('restrictedTopics');
      if (raw) parsedRestrictedTopics = JSON.parse(raw);
    } catch {}

    setConfig({
      title: searchParams.get('title') || tcb('defaults.title'),
      greeting: searchParams.get('greeting') || tcb('defaults.greeting'),
      placeholder: searchParams.get('placeholder') || tcb('defaults.placeholder'),
      textColor: searchParams.get('textColor') || '#1F2937',
      headerColor: searchParams.get('headerColor') || '#4F46E5',
      backgroundColor: searchParams.get('backgroundColor') || '#FFFFFF',
      icon: searchParams.get('icon') || 'FaComments',
      fontFamily: searchParams.get('fontFamily') || 'Inter',
      customIconUrl: searchParams.get('customIconUrl') || undefined,
      restrictedTopics: parsedRestrictedTopics,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const {
    sessionId,
    messages,
    isLoading,
    error,
    uploadedDocuments,
    sendMessage,
    clearMessages,
  } = useChatbot(config);

  // Limpiar chat al entrar al preview (siempre empieza limpio)
  useEffect(() => {
    if (sessionId && !hasClearedOnMount.current) {
      hasClearedOnMount.current = true;
      clearMessages();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Auto-scroll al último mensaje dentro del contenedor del chat
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isLoading]);

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
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: '#F3F4F6',
        fontFamily: config.fontFamily ? `'${config.fontFamily}', sans-serif` : 'Inter, sans-serif'
      }}
    >
      <div className="flex gap-4 w-full max-w-7xl h-[90vh]">
        {/* Sidebar Panel */}
        <div
          className={`bg-white rounded-2xl shadow-xl transition-all duration-300 overflow-hidden ${
            showSidebar ? 'w-80' : 'w-0'
          }`}
        >
          {showSidebar && (
            <div className="h-full flex flex-col p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Cog6ToothIcon className="h-6 w-6 text-gray-700" />
                  <h2 className="text-lg font-semibold text-gray-900">{tcb('previewPage.configuration')}</h2>
                </div>
              </div>

              {/* Configuration Details */}
              <div className="flex-1 overflow-y-auto space-y-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">{tcb('previewPage.chatDesign')}</h3>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">{tcb('previewPage.titleLabel')}</p>
                    <p className="text-sm font-medium text-gray-900">{config.title}</p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">{tcb('previewPage.welcomeMessage')}</p>
                    <p className="text-sm text-gray-900">{config.greeting}</p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">{tcb('previewPage.placeholder')}</p>
                    <p className="text-sm text-gray-900">{config.placeholder}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">{tcb('previewPage.headerColor')}</p>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-md border-2 border-gray-200"
                          style={{ backgroundColor: config.headerColor }}
                        />
                        <p className="text-xs font-mono text-gray-700">{config.headerColor}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">{tcb('previewPage.textColor')}</p>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-md border-2 border-gray-200"
                          style={{ backgroundColor: config.textColor }}
                        />
                        <p className="text-xs font-mono text-gray-700">{config.textColor}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">{tcb('previewPage.font')}</p>
                    <p className="text-sm font-medium text-gray-900">{config.fontFamily || 'Inter'}</p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">{tcb('previewPage.icon')}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {config.customIconUrl ? (
                        <Image src={config.customIconUrl} alt="Icon" width={32} height={32} className="rounded-full" unoptimized />
                      ) : (
                        <SelectedIcon className="h-8 w-8" style={{ color: config.headerColor }} />
                      )}
                      <p className="text-sm text-gray-900">{config.icon}</p>
                    </div>
                  </div>
                </div>

                {/* Restricted Topics Section */}
                {config.restrictedTopics && config.restrictedTopics.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                      <ShieldExclamationIcon className="h-4 w-4 text-red-500" />
                      {tcb('previewPage.restrictedTopics')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {config.restrictedTopics.map((topic, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 px-2 py-1 bg-red-50 border border-red-200 rounded-lg"
                        >
                          <ShieldExclamationIcon className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                          <span className="text-xs text-red-800">{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents Section */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">{tcb('previewPage.uploadedDocuments')}</h3>
                  <div className="space-y-2">
                    {(previewDocuments.length > 0 || uploadedDocuments.length > 0) ? (
                      [...new Set([...previewDocuments, ...uploadedDocuments])].map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg">
                          <DocumentTextIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          <span className="text-sm text-blue-900 truncate">{doc}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">{tcb('previewPage.noDocuments')}</p>
                    )}
                  </div>
                </div>

                {/* Clear Chat Button */}
                {messages.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => clearMessages()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">{tcb('previewPage.clearConversation')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Main Chat Container */}
        <div className="flex-1 bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
          {/* Header */}
          <div
            className="px-4 py-4 shadow-lg flex items-center justify-between"
            style={{ backgroundColor: config.headerColor }}
          >
            <div className="flex items-center gap-3">
              <Link
                href="/demo/chatbot"
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title={tcb('previewPage.backToBuilder')}
              >
                <ArrowLeftIcon className="h-6 w-6 text-white" />
              </Link>
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title={showSidebar ? tcb('previewPage.hidePanel') : tcb('previewPage.showPanel')}
              >
                {showSidebar ? (
                  <ChevronLeftIcon className="h-6 w-6 text-white" />
                ) : (
                  <ChevronRightIcon className="h-6 w-6 text-white" />
                )}
              </button>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                {config.customIconUrl ? (
                  <Image
                    src={config.customIconUrl}
                    alt="Chat icon"
                    width={24}
                    height={24}
                    className="rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <SelectedIcon className="h-6 w-6 text-white" />
                )}
              </div>
              <h1 className="text-xl font-semibold text-white">{config.title}</h1>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => clearMessages()}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title={tcb('previewPage.clearTitle')}
              >
                <TrashIcon className="h-5 w-5 text-white" />
              </button>
            )}
          </div>

          {/* Messages Container */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-4">
              {/* Greeting Message */}
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-950 rounded-full flex items-center justify-center flex-shrink-0">
                  {config.customIconUrl ? (
                    <Image
                      src={config.customIconUrl}
                      alt="Assistant"
                      width={24}
                      height={24}
                      className="rounded-full object-cover"
                      unoptimized
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
                        <Image
                          src={config.customIconUrl}
                          alt="Assistant"
                          width={24}
                          height={24}
                          className="rounded-full object-cover"
                          unoptimized
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
                          {tcb('previewPage.source')}: {(msg as any).source}
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
                      <Image
                        src={config.customIconUrl}
                        alt="Assistant"
                        width={24}
                        height={24}
                        className="rounded-full object-cover"
                        unoptimized
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
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={config.placeholder}
                disabled={isLoading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white text-gray-900"
                style={{ fontFamily: config.fontFamily ? `'${config.fontFamily}', sans-serif` : 'Inter, sans-serif' }}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="px-6 py-3 rounded-full transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium"
                style={{ backgroundColor: config.headerColor }}
              >
                <PaperAirplaneIcon className="h-5 w-5" />
                <span className="hidden sm:inline">{tcb('previewPage.send')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
