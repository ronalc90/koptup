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
  CodeBracketIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  ShieldExclamationIcon,
  PhotoIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import {
  FaRegCommentDots,
  FaComments,
  FaRocketchat,
  FaRobot,
  FaComment,
  FaFont,
} from 'react-icons/fa';
import { useChatbot } from '@/hooks/useChatbot';
import Link from 'next/link';

type TabType = 'documents' | 'chat' | 'design' | 'typography' | 'restrictions' | 'embed';

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
  customIconUrl?: string;
}

interface TypographyConfig {
  fontFamily: string;
}

interface RestrictionsConfig {
  restrictedTopics: string[];
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
  const [typographyConfig, setTypographyConfig] = useState<TypographyConfig>({
    fontFamily: 'Inter',
  });
  const [restrictionsConfig, setRestrictionsConfig] = useState<RestrictionsConfig>({
    restrictedTopics: [],
  });
  const [newRestrictedTopic, setNewRestrictedTopic] = useState('');
  const [previewInput, setPreviewInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [customIconFile, setCustomIconFile] = useState<File | null>(null);
  const [embedCopied, setEmbedCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chatbot hook
  const {
    messages,
    isLoading,
    error,
    uploadDocuments,
    sendMessage,
    clearMessages,
  } = useChatbot({
    title: chatConfig.title,
    greeting: chatConfig.greeting,
    placeholder: chatConfig.placeholder,
    textColor: designConfig.textColor,
    headerColor: designConfig.headerColor,
    backgroundColor: designConfig.backgroundColor,
    icon: designConfig.icon,
    fontFamily: typographyConfig.fontFamily,
    customIconUrl: designConfig.customIconUrl,
    restrictedTopics: restrictionsConfig.restrictedTopics,
  });

  const chatIcons = [
    { id: 'FaComments', icon: FaComments, label: 'Burbujas' },
    { id: 'FaRegCommentDots', icon: FaRegCommentDots, label: 'Puntos' },
    { id: 'FaRocketchat', icon: FaRocketchat, label: 'Cohete' },
    { id: 'FaRobot', icon: FaRobot, label: 'Robot' },
    { id: 'FaComment', icon: FaComment, label: 'Comentario' },
  ];

  const fontOptions = [
    { id: 'Inter', label: 'Inter', preview: 'font-sans' },
    { id: 'Roboto', label: 'Roboto', preview: 'font-sans' },
    { id: 'Open Sans', label: 'Open Sans', preview: 'font-sans' },
    { id: 'Lato', label: 'Lato', preview: 'font-sans' },
    { id: 'Montserrat', label: 'Montserrat', preview: 'font-sans' },
    { id: 'Poppins', label: 'Poppins', preview: 'font-sans' },
    { id: 'Raleway', label: 'Raleway', preview: 'font-sans' },
    { id: 'Playfair Display', label: 'Playfair Display', preview: 'font-serif' },
    { id: 'Merriweather', label: 'Merriweather', preview: 'font-serif' },
  ];

  // Load Google Fonts dynamically
  useEffect(() => {
    const fonts = fontOptions.map(f => f.id.replace(' ', '+')).join('&family=');
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?${fonts.split('&family=').map(f => `family=${f}:wght@400;500;600;700`).join('&')}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles([...uploadedFiles, ...newFiles]);

      setIsUploading(true);
      const success = await uploadDocuments(newFiles);
      setIsUploading(false);

      if (!success) {
        setUploadedFiles(prev => prev.filter(f => !newFiles.includes(f)));
      }
    }
  };

  const handleCustomIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setCustomIconFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setDesignConfig({ ...designConfig, customIconUrl: event.target?.result as string });
      };
      reader.readAsDataURL(file);
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

  const handleAddRestrictedTopic = () => {
    if (newRestrictedTopic.trim() && !restrictionsConfig.restrictedTopics.includes(newRestrictedTopic.trim())) {
      setRestrictionsConfig({
        restrictedTopics: [...restrictionsConfig.restrictedTopics, newRestrictedTopic.trim()]
      });
      setNewRestrictedTopic('');
    }
  };

  const handleRemoveRestrictedTopic = (topic: string) => {
    setRestrictionsConfig({
      restrictedTopics: restrictionsConfig.restrictedTopics.filter(t => t !== topic)
    });
  };

  const generateEmbedCode = () => {
    const params = new URLSearchParams({
      title: chatConfig.title,
      greeting: chatConfig.greeting,
      placeholder: chatConfig.placeholder,
      textColor: designConfig.textColor,
      headerColor: designConfig.headerColor,
      backgroundColor: designConfig.backgroundColor,
      icon: designConfig.icon,
      fontFamily: typographyConfig.fontFamily,
    });

    if (designConfig.customIconUrl) {
      params.append('customIconUrl', designConfig.customIconUrl);
    }

    const embedUrl = `${window.location.origin}/demo/chatbot/preview?${params.toString()}`;

    return `<iframe
  src="${embedUrl}"
  width="100%"
  height="600px"
  frameborder="0"
  style="border: none; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
  allow="clipboard-write"
></iframe>`;
  };

  const getPreviewUrl = () => {
    const params = new URLSearchParams({
      title: chatConfig.title,
      greeting: chatConfig.greeting,
      placeholder: chatConfig.placeholder,
      textColor: designConfig.textColor,
      headerColor: designConfig.headerColor,
      backgroundColor: designConfig.backgroundColor,
      icon: designConfig.icon,
      fontFamily: typographyConfig.fontFamily,
    });

    if (designConfig.customIconUrl) {
      params.append('customIconUrl', designConfig.customIconUrl);
    }

    return `/demo/chatbot/preview?${params.toString()}`;
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(generateEmbedCode());
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  const SelectedIcon = chatIcons.find(i => i.id === designConfig.icon)?.icon || FaComments;

  const tabs = [
    { id: 'documents' as TabType, label: 'Documentos', icon: DocumentArrowUpIcon },
    { id: 'chat' as TabType, label: 'Chat', icon: ChatBubbleLeftRightIcon },
    { id: 'design' as TabType, label: 'Diseño', icon: PaintBrushIcon },
    { id: 'typography' as TabType, label: 'Tipografía', icon: FaFont },
    { id: 'restrictions' as TabType, label: 'Restricciones', icon: ShieldExclamationIcon },
    { id: 'embed' as TabType, label: 'Embed', icon: CodeBracketIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-black dark:to-primary-950 py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-3 sm:mb-4">
            Constructor de Chatbot Profesional
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-secondary-600 dark:text-secondary-400 px-4 mb-6">
            Personaliza tu chatbot con IA y pruébalo en tiempo real
          </p>

          {/* Preview Button */}
          <Link
            href={getPreviewUrl()}
            target="_blank"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            <EyeIcon className="h-5 w-5" />
            Abrir Preview en Pantalla Completa
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </Link>
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
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
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
                      <div
                        onClick={() => document.getElementById('file-upload')?.click()}
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
                        <Button variant="outline" className="text-sm">
                          Seleccionar Archivos
                        </Button>
                      </div>
                    </div>

                    {isUploading && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          Subiendo documentos...
                        </p>
                      </div>
                    )}

                    {error && (
                      <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200">
                          {error}
                        </p>
                      </div>
                    )}

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
                      {/* Custom Icon Upload */}
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
                          Icono Personalizado (Temporal)
                        </label>
                        <div className="flex items-center gap-4">
                          <input
                            type="file"
                            id="icon-upload"
                            accept="image/*"
                            onChange={handleCustomIconUpload}
                            className="hidden"
                          />
                          <button
                            onClick={() => document.getElementById('icon-upload')?.click()}
                            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-secondary-300 dark:border-secondary-700 rounded-lg hover:border-primary-500 transition-colors"
                          >
                            <PhotoIcon className="h-5 w-5 text-secondary-500" />
                            <span className="text-sm">Subir Icono</span>
                          </button>
                          {designConfig.customIconUrl && (
                            <div className="flex items-center gap-2">
                              <img
                                src={designConfig.customIconUrl}
                                alt="Custom icon"
                                className="w-10 h-10 rounded-full object-cover border-2 border-primary-500"
                              />
                              <button
                                onClick={() => setDesignConfig({ ...designConfig, customIconUrl: undefined })}
                                className="text-xs text-red-600 hover:text-red-700"
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Icon Selection */}
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
                          O elige un icono predefinido
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                          {chatIcons.map((iconItem) => {
                            const Icon = iconItem.icon;
                            return (
                              <button
                                key={iconItem.id}
                                onClick={() => {
                                  setDesignConfig({ ...designConfig, icon: iconItem.id, customIconUrl: undefined });
                                }}
                                className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                                  designConfig.icon === iconItem.id && !designConfig.customIconUrl
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

                {/* Typography Tab */}
                {activeTab === 'typography' && (
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-secondary-900 dark:text-white mb-3 sm:mb-4">
                        Tipografía
                      </h3>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3 sm:mb-4">
                        Selecciona la fuente que mejor se adapte a tu marca
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {fontOptions.map((font) => (
                        <button
                          key={font.id}
                          onClick={() => setTypographyConfig({ fontFamily: font.id })}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            typographyConfig.fontFamily === font.id
                              ? 'border-primary-600 bg-primary-50 dark:bg-primary-950'
                              : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-400'
                          }`}
                          style={{ fontFamily: `'${font.id}', sans-serif` }}
                        >
                          <p className="font-semibold text-secondary-900 dark:text-white mb-1">
                            {font.label}
                          </p>
                          <p className="text-sm text-secondary-600 dark:text-secondary-400">
                            The quick brown fox jumps
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Restrictions Tab */}
                {activeTab === 'restrictions' && (
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-secondary-900 dark:text-white mb-3 sm:mb-4">
                        Temas Restringidos
                      </h3>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3 sm:mb-4">
                        Configura temas de los que el chatbot NO debe hablar
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newRestrictedTopic}
                          onChange={(e) => setNewRestrictedTopic(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddRestrictedTopic()}
                          placeholder="Ej: Política, Religión, etc."
                          className="flex-1 px-4 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <Button
                          onClick={handleAddRestrictedTopic}
                          disabled={!newRestrictedTopic.trim()}
                          className="whitespace-nowrap"
                        >
                          Agregar
                        </Button>
                      </div>

                      {restrictionsConfig.restrictedTopics.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-secondary-900 dark:text-white">
                            Temas Restringidos ({restrictionsConfig.restrictedTopics.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {restrictionsConfig.restrictedTopics.map((topic, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg"
                              >
                                <ShieldExclamationIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                                <span className="text-sm text-red-800 dark:text-red-200">
                                  {topic}
                                </span>
                                <button
                                  onClick={() => handleRemoveRestrictedTopic(topic)}
                                  className="ml-1 text-red-600 hover:text-red-700"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Nota:</strong> El chatbot rechazará responder preguntas relacionadas con estos temas y redirigirá la conversación hacia temas permitidos.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Embed Tab */}
                {activeTab === 'embed' && (
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-secondary-900 dark:text-white mb-3 sm:mb-4">
                        Código de Inserción
                      </h3>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3 sm:mb-4">
                        Copia este código para embeber el chatbot en tu sitio web
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <pre className="bg-secondary-900 text-secondary-100 p-4 rounded-lg overflow-x-auto text-xs sm:text-sm">
                          <code>{generateEmbedCode()}</code>
                        </pre>
                        <button
                          onClick={copyEmbedCode}
                          className="absolute top-2 right-2 p-2 bg-secondary-800 hover:bg-secondary-700 rounded-lg transition-colors"
                        >
                          {embedCopied ? (
                            <CheckIcon className="h-5 w-5 text-green-400" />
                          ) : (
                            <ClipboardDocumentIcon className="h-5 w-5 text-secondary-300" />
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Link
                          href={getPreviewUrl()}
                          target="_blank"
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                        >
                          <EyeIcon className="h-5 w-5" />
                          Ver Preview
                          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                        </Link>

                        <button
                          onClick={copyEmbedCode}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary-200 dark:bg-secondary-700 hover:bg-secondary-300 dark:hover:bg-secondary-600 text-secondary-900 dark:text-white font-medium rounded-lg transition-colors"
                        >
                          <ClipboardDocumentIcon className="h-5 w-5" />
                          Copiar Código
                        </button>
                      </div>

                      <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>Importante:</strong> Los iconos personalizados son temporales y solo funcionan en esta sesión. Para uso en producción, sube el icono a tu servidor y usa la URL.
                        </p>
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
                      <div
                        className="w-full max-w-sm bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl flex flex-col h-[420px] sm:h-[470px] lg:h-[500px]"
                        style={{ fontFamily: typographyConfig.fontFamily ? `'${typographyConfig.fontFamily}', sans-serif` : 'Inter, sans-serif' }}
                      >
                        {/* Header */}
                        <div
                          className="p-3 sm:p-4 rounded-t-2xl flex items-center justify-between"
                          style={{ backgroundColor: designConfig.headerColor }}
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                              {designConfig.customIconUrl ? (
                                <img
                                  src={designConfig.customIconUrl}
                                  alt="Chat icon"
                                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover"
                                />
                              ) : (
                                <SelectedIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                              )}
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
                              {designConfig.customIconUrl ? (
                                <img
                                  src={designConfig.customIconUrl}
                                  alt="Assistant"
                                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full object-cover"
                                />
                              ) : (
                                <SelectedIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600 dark:text-primary-400" />
                              )}
                            </div>
                            <div className="bg-secondary-100 dark:bg-secondary-700 rounded-2xl rounded-tl-sm p-2.5 sm:p-3 max-w-[80%]">
                              <p className="text-xs sm:text-sm" style={{ color: designConfig.textColor }}>
                                {chatConfig.greeting}
                              </p>
                            </div>
                          </div>

                          {/* Real Messages from Chatbot */}
                          {messages.map((msg, index) => (
                            <div key={index}>
                              <div
                                className={`flex gap-1.5 sm:gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}
                              >
                                {msg.role === 'assistant' && (
                                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-100 dark:bg-primary-950 rounded-full flex items-center justify-center flex-shrink-0">
                                    {designConfig.customIconUrl ? (
                                      <img
                                        src={designConfig.customIconUrl}
                                        alt="Assistant"
                                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full object-cover"
                                      />
                                    ) : (
                                      <SelectedIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600 dark:text-primary-400" />
                                    )}
                                  </div>
                                )}
                                <div className="flex flex-col max-w-[80%]">
                                  <div
                                    className={`rounded-2xl p-2.5 sm:p-3 ${
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
                                  {msg.role === 'assistant' && msg.source && (
                                    <div className="flex items-center gap-1 mt-1 ml-2">
                                      <DocumentTextIcon className="h-3 w-3 text-secondary-400" />
                                      <span className="text-xs text-secondary-500">
                                        {msg.source}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Loading Indicator */}
                          {isLoading && (
                            <div className="flex gap-1.5 sm:gap-2">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-100 dark:bg-primary-950 rounded-full flex items-center justify-center flex-shrink-0">
                                {designConfig.customIconUrl ? (
                                  <img
                                    src={designConfig.customIconUrl}
                                    alt="Assistant"
                                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full object-cover"
                                  />
                                ) : (
                                  <SelectedIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600 dark:text-primary-400" />
                                )}
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
                        {designConfig.customIconUrl ? (
                          <img
                            src={designConfig.customIconUrl}
                            alt="Chat icon"
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
                          />
                        ) : (
                          <SelectedIcon className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                        )}
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
