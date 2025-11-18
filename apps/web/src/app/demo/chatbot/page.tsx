'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  DocumentArrowUpIcon,
  ChatBubbleLeftRightIcon,
  PaintBrushIcon,
  TrashIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  FaRegCommentDots,
  FaComments,
  FaRocketchat,
  FaRobot,
  FaComment
} from 'react-icons/fa';
import { useChatbot } from '@/hooks/useChatbot';

type TabType = 'documents' | 'chat' | 'design';

interface ChatConfig {
  greeting: string;
  title: string;
  placeholder: string;
}

interface DesignConfig {
  textColor: string;
  headerColor: string;
  backgroundColor: string;
  icon: string;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

export default function DemoPage() {
  const t = useTranslations('demo');
  const tc = useTranslations('common');

  const [activeTab, setActiveTab] = useState<TabType>('documents');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [chatConfig, setChatConfig] = useState<ChatConfig>({
    greeting: '¡Hola! 👋 Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
    title: 'Asistente Virtual',
    placeholder: 'Escribe tu mensaje aquí...',
  });
  const [designConfig, setDesignConfig] = useState<DesignConfig>({
    textColor: '#1F2937',
    headerColor: '#4F46E5',
    backgroundColor: '#FFFFFF',
    icon: 'FaComments',
  });
  const [previewInput, setPreviewInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Initialize chatbot hook
  const {
    messages,
    isLoading,
    error,
    uploadDocuments,
    sendMessage,
    updateConfig,
    clearMessages,
  } = useChatbot({
    title: chatConfig.title,
    greeting: chatConfig.greeting,
    placeholder: chatConfig.placeholder,
    textColor: designConfig.textColor,
    headerColor: designConfig.headerColor,
    backgroundColor: designConfig.backgroundColor,
    icon: designConfig.icon,
  });

  const chatIcons = [
    { id: 'FaComments', icon: FaComments, label: 'Burbujas' },
    { id: 'FaRegCommentDots', icon: FaRegCommentDots, label: 'Puntos' },
    { id: 'FaRocketchat', icon: FaRocketchat, label: 'Cohete' },
    { id: 'FaRobot', icon: FaRobot, label: 'Robot' },
    { id: 'FaComment', icon: FaComment, label: 'Comentario' },
  ];

  // Auto-scroll to bottom when messages change (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update chatbot config when design/chat config changes
  useEffect(() => {
    updateConfig({
      title: chatConfig.title,
      greeting: chatConfig.greeting,
      placeholder: chatConfig.placeholder,
      textColor: designConfig.textColor,
      headerColor: designConfig.headerColor,
      backgroundColor: designConfig.backgroundColor,
      icon: designConfig.icon,
    });
  }, [chatConfig, designConfig, updateConfig]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles([...uploadedFiles, ...newFiles]);

      // Upload to backend
      setIsUploading(true);
      const success = await uploadDocuments(newFiles);
      setIsUploading(false);

      if (!success) {
        // Remove files if upload failed
        setUploadedFiles(prev => prev.filter(f => !newFiles.includes(f)));
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSendPreviewMessage = async () => {
    if (previewInput.trim() && !isLoading) {
      const message = previewInput;
      setPreviewInput('');
      await sendMessage(message);
    }
  };

  const SelectedIcon = chatIcons.find(i => i.id === designConfig.icon)?.icon || FaComments;

  const tabs = [
    { id: 'documents' as TabType, label: 'Documentos', icon: DocumentArrowUpIcon },
    { id: 'chat' as TabType, label: 'Chat', icon: ChatBubbleLeftRightIcon },
    { id: 'design' as TabType, label: 'Diseño', icon: PaintBrushIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-black dark:to-primary-950 py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-3 sm:mb-4">
            Constructor de Chatbot
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-secondary-600 dark:text-secondary-400 px-4">
            Personaliza tu chatbot con IA y pruébalo en tiempo real
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-2">
            <Card variant="elevated" className="shadow-xl">
              <CardHeader>
                {/* Tabs */}
                <div className="flex border-b border-secondary-200 dark:border-secondary-700 overflow-x-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 font-medium transition-colors border-b-2 whitespace-nowrap flex-1 sm:flex-none justify-center ${
                          activeTab === tab.id
                            ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                            : 'border-transparent text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-sm sm:text-base">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6">
                {/* Documents Tab */}
                {activeTab === 'documents' && (
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-secondary-900 dark:text-white mb-3 sm:mb-4">
                        Subir Documentos
                      </h3>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3 sm:mb-4">
                        Sube documentos que el chatbot usará como contexto para responder preguntas
                      </p>
                    </div>

                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-secondary-300 dark:border-secondary-700 rounded-lg p-6 sm:p-8 text-center hover:border-primary-500 dark:hover:border-primary-500 transition-colors">
                      <input
                        type="file"
                        id="file-upload"
                        multiple
                        accept=".pdf,.docx,.txt,.csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center gap-3 sm:gap-4"
                      >
                        <DocumentArrowUpIcon className="h-12 w-12 sm:h-16 sm:w-16 text-secondary-400" />
                        <div>
                          <p className="text-base sm:text-lg font-medium text-secondary-900 dark:text-white mb-1">
                            Arrastra archivos aquí o haz clic para seleccionar
                          </p>
                          <p className="text-xs sm:text-sm text-secondary-500">
                            PDF, DOCX, TXT, CSV (máx. 10MB por archivo)
                          </p>
                        </div>
                        <Button variant="outline" className="text-sm">Seleccionar Archivos</Button>
                      </label>
                    </div>

                    {/* Upload Status */}
                    {isUploading && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          Subiendo documentos...
                        </p>
                      </div>
                    )}

                    {/* Error Display */}
                    {error && (
                      <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200">
                          {error}
                        </p>
                      </div>
                    )}

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-secondary-900 dark:text-white">
                          Archivos Subidos ({uploadedFiles.length})
                        </h4>
                        <div className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-900 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <DocumentArrowUpIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                <div>
                                  <p className="text-sm font-medium text-secondary-900 dark:text-white">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-secondary-500">
                                    {(file.size / 1024).toFixed(2)} KB
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveFile(index)}
                                className="p-2 hover:bg-red-100 dark:hover:bg-red-950 rounded-lg transition-colors"
                              >
                                <TrashIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Chat Configuration Tab */}
                {activeTab === 'chat' && (
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-secondary-900 dark:text-white mb-3 sm:mb-4">
                        Configuración del Chat
                      </h3>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3 sm:mb-4">
                        Personaliza los mensajes y textos del chatbot
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                          Título del Chatbot
                        </label>
                        <input
                          type="text"
                          value={chatConfig.title}
                          onChange={(e) => setChatConfig({ ...chatConfig, title: e.target.value })}
                          className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Ej: Asistente Virtual"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                          Mensaje de Saludo
                        </label>
                        <textarea
                          value={chatConfig.greeting}
                          onChange={(e) => setChatConfig({ ...chatConfig, greeting: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Ej: ¡Hola! ¿En qué puedo ayudarte?"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                          Placeholder del Input
                        </label>
                        <input
                          type="text"
                          value={chatConfig.placeholder}
                          onChange={(e) => setChatConfig({ ...chatConfig, placeholder: e.target.value })}
                          className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Ej: Escribe tu mensaje..."
                        />
                      </div>

                      {/* Clear Messages Button */}
                      {messages.length > 0 && (
                        <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700">
                          <Button
                            variant="outline"
                            onClick={() => clearMessages()}
                            className="w-full text-red-600 hover:text-red-700 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Limpiar Conversación
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Design Tab */}
                {activeTab === 'design' && (
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-secondary-900 dark:text-white mb-3 sm:mb-4">
                        Diseño Visual
                      </h3>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3 sm:mb-4">
                        Personaliza los colores e icono del chatbot
                      </p>
                    </div>

                    <div className="space-y-4 sm:space-y-6">
                      {/* Icon Selection */}
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
                          Icono del Chat
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                          {chatIcons.map((iconItem) => {
                            const Icon = iconItem.icon;
                            return (
                              <button
                                key={iconItem.id}
                                onClick={() => setDesignConfig({ ...designConfig, icon: iconItem.id })}
                                className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                                  designConfig.icon === iconItem.id
                                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-950'
                                    : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-400'
                                }`}
                              >
                                <Icon className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-secondary-700 dark:text-secondary-300" />
                                <p className="text-xs mt-1.5 sm:mt-2 text-secondary-600 dark:text-secondary-400 truncate">
                                  {iconItem.label}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Color Pickers */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            Color del Header
                          </label>
                          <input
                            type="color"
                            value={designConfig.headerColor}
                            onChange={(e) => setDesignConfig({ ...designConfig, headerColor: e.target.value })}
                            className="w-full h-12 rounded-lg border border-secondary-300 dark:border-secondary-700 cursor-pointer"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            Color de Fondo
                          </label>
                          <input
                            type="color"
                            value={designConfig.backgroundColor}
                            onChange={(e) => setDesignConfig({ ...designConfig, backgroundColor: e.target.value })}
                            className="w-full h-12 rounded-lg border border-secondary-300 dark:border-secondary-700 cursor-pointer"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            Color del Texto
                          </label>
                          <input
                            type="color"
                            value={designConfig.textColor}
                            onChange={(e) => setDesignConfig({ ...designConfig, textColor: e.target.value })}
                            className="w-full h-12 rounded-lg border border-secondary-300 dark:border-secondary-700 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <Card variant="bordered">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Vista Previa</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <div className="bg-secondary-100 dark:bg-secondary-900 rounded-lg p-3 sm:p-4 h-[500px] sm:h-[550px] lg:h-[600px] flex items-end justify-end">
                    {/* Chat Widget */}
                    {isChatOpen ? (
                      <div className="w-full max-w-sm bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl flex flex-col h-[420px] sm:h-[470px] lg:h-[500px]">
                        {/* Header */}
                        <div
                          className="p-3 sm:p-4 rounded-t-2xl flex items-center justify-between"
                          style={{ backgroundColor: designConfig.headerColor }}
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <SelectedIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-white text-sm sm:text-base truncate">{chatConfig.title}</h3>
                          </div>
                          <button
                            onClick={() => setIsChatOpen(false)}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                          >
                            <XMarkIcon className="h-5 w-5 text-white" />
                          </button>
                        </div>

                        {/* Messages */}
                        <div
                          className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2 sm:space-y-3"
                          style={{ backgroundColor: designConfig.backgroundColor }}
                        >
                          {/* Greeting */}
                          <div className="flex gap-1.5 sm:gap-2">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-100 dark:bg-primary-950 rounded-full flex items-center justify-center flex-shrink-0">
                              <SelectedIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div className="bg-secondary-100 dark:bg-secondary-700 rounded-2xl rounded-tl-sm p-2.5 sm:p-3 max-w-[80%]">
                              <p className="text-xs sm:text-sm" style={{ color: designConfig.textColor }}>
                                {chatConfig.greeting}
                              </p>
                            </div>
                          </div>

                          {/* Real Messages from Chatbot */}
                          {messages.map((msg, index) => (
                            <div
                              key={index}
                              className={`flex gap-1.5 sm:gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}
                            >
                              {msg.role === 'assistant' && (
                                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-100 dark:bg-primary-950 rounded-full flex items-center justify-center flex-shrink-0">
                                  <SelectedIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600 dark:text-primary-400" />
                                </div>
                              )}
                              <div
                                className={`rounded-2xl p-2.5 sm:p-3 max-w-[80%] ${
                                  msg.role === 'user'
                                    ? 'rounded-tr-sm'
                                    : 'rounded-tl-sm bg-secondary-100 dark:bg-secondary-700'
                                }`}
                                style={msg.role === 'user' ? { backgroundColor: designConfig.headerColor } : {}}
                              >
                                <p
                                  className="text-xs sm:text-sm"
                                  style={{ color: msg.role === 'user' ? '#FFFFFF' : designConfig.textColor }}
                                >
                                  {msg.content}
                                </p>
                              </div>
                            </div>
                          ))}

                          {/* Loading Indicator */}
                          {isLoading && (
                            <div className="flex gap-1.5 sm:gap-2">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-100 dark:bg-primary-950 rounded-full flex items-center justify-center flex-shrink-0">
                                <SelectedIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600 dark:text-primary-400" />
                              </div>
                              <div className="bg-secondary-100 dark:bg-secondary-700 rounded-2xl rounded-tl-sm p-2.5 sm:p-3">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                  <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                  <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Auto-scroll anchor */}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 sm:p-4 border-t border-secondary-200 dark:border-secondary-700">
                          <div className="flex gap-1.5 sm:gap-2">
                            <input
                              type="text"
                              value={previewInput}
                              onChange={(e) => setPreviewInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSendPreviewMessage()}
                              placeholder={chatConfig.placeholder}
                              disabled={isLoading}
                              className="flex-1 px-3 sm:px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <button
                              onClick={handleSendPreviewMessage}
                              disabled={isLoading || !previewInput.trim()}
                              className="p-2 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{ backgroundColor: designConfig.headerColor }}
                            >
                              <PaperAirplaneIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsChatOpen(true)}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110"
                        style={{ backgroundColor: designConfig.headerColor }}
                      >
                        <SelectedIcon className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
