import { useState, useEffect, useCallback } from 'react';

// Use relative API routes that proxy to the backend
const API_URL = '';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: string; // PDF or document source
}

export interface ChatbotConfig {
  title: string;
  greeting: string;
  placeholder: string;
  textColor: string;
  headerColor: string;
  backgroundColor: string;
  icon: string;
  fontFamily?: string;
  customIconUrl?: string;
  restrictedTopics?: string[];
}

export function useChatbot(initialConfig?: Partial<ChatbotConfig>) {
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<ChatbotConfig>({
    title: initialConfig?.title || 'Asistente Virtual',
    greeting: initialConfig?.greeting || '¡Hola! 👋 Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
    placeholder: initialConfig?.placeholder || 'Escribe tu mensaje aquí...',
    textColor: initialConfig?.textColor || '#1F2937',
    headerColor: initialConfig?.headerColor || '#4F46E5',
    backgroundColor: initialConfig?.backgroundColor || '#FFFFFF',
    icon: initialConfig?.icon || 'FaComments',
    fontFamily: initialConfig?.fontFamily || 'Inter',
    customIconUrl: initialConfig?.customIconUrl,
    restrictedTopics: initialConfig?.restrictedTopics || [],
  });

  // Generar o recuperar sessionId
  useEffect(() => {
    let id = localStorage.getItem('chatbot_session_id');
    if (!id) {
      id = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('chatbot_session_id', id);
    }
    setSessionId(id);
    loadSession(id);
  }, []);

  // Cargar sesión existente
  const loadSession = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/chatbot/info/${id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setMessages(data.data.messages || []);
          if (data.data.config) {
            setConfig(prev => ({ ...prev, ...data.data.config }));
          }
        }
      }
    } catch (err) {
      console.error('Error loading session:', err);
    }
  };

  // Subir documentos
  const uploadDocuments = async (files: File[]): Promise<boolean> => {
    if (!sessionId) {
      setError('No hay sesión activa');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_URL}/api/chatbot/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error subiendo documentos');
      }

      return true;
    } catch (err: any) {
      setError(err.message || 'Error subiendo documentos');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar mensaje
  const sendMessage = async (message: string): Promise<void> => {
    if (!sessionId || !message.trim()) return;

    setIsLoading(true);
    setError(null);

    // Agregar mensaje del usuario inmediatamente
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch(`${API_URL}/api/chatbot/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error enviando mensaje');
      }

      // Agregar respuesta del asistente
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.data.message,
        timestamp: new Date(),
        source: data.data.source, // Include source from backend
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || 'Error enviando mensaje');

      // Agregar mensaje de error
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Actualizar configuración
  const updateConfig = useCallback(async (newConfig: Partial<ChatbotConfig>): Promise<void> => {
    if (!sessionId) return;

    setConfig(prevConfig => {
      const updatedConfig = { ...prevConfig, ...newConfig };

      // Enviar al backend de forma asíncrona sin bloquear
      fetch(`${API_URL}/api/chatbot/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          config: updatedConfig,
        }),
      }).catch(err => {
        console.error('Error updating config:', err);
      });

      return updatedConfig;
    });
  }, [sessionId]);

  // Limpiar mensajes
  const clearMessages = async (): Promise<void> => {
    if (!sessionId) return;

    try {
      await fetch(`${API_URL}/api/chatbot/messages/${sessionId}`, {
        method: 'DELETE',
      });
      setMessages([]);
    } catch (err) {
      console.error('Error clearing messages:', err);
    }
  };

  return {
    sessionId,
    messages,
    config,
    isLoading,
    error,
    uploadDocuments,
    sendMessage,
    updateConfig,
    clearMessages,
  };
}
