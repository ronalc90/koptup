import { useState, useEffect, useCallback, useRef } from 'react';

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

// Detectar si estamos en modo demo
const isDemoMode = () => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/demo/chatbot');
};

export function useChatbot(initialConfig?: Partial<ChatbotConfig>) {
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
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

  // Actualizar configuración (declared before use in useEffect)
  const updateConfig = useCallback(async (newConfig: Partial<ChatbotConfig>): Promise<void> => {
    if (!sessionId) return;

    setConfig(prevConfig => {
      const updatedConfig = { ...prevConfig, ...newConfig };

      // En modo demo, solo guardar en sessionStorage
      if (isDemoMode()) {
        const demoData = {
          config: updatedConfig,
          messages,
          uploadedDocuments,
        };
        sessionStorage.setItem('chatbot_demo_data', JSON.stringify(demoData));
      } else {
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
      }

      return updatedConfig;
    });
  }, [sessionId, messages, uploadedDocuments]);

  // Generar o recuperar sessionId
  useEffect(() => {
    if (isDemoMode()) {
      // En modo demo, SIEMPRE limpiar y empezar de cero
      sessionStorage.removeItem('chatbot_demo_data');
      const id = `demo-session-${Date.now()}`;
      setSessionId(id);

      // NO cargar datos antiguos - siempre empezar limpio
      setMessages([]);
      setUploadedDocuments([]);
    } else {
      // Modo normal: usar localStorage y backend
      let id = localStorage.getItem('chatbot_session_id');
      if (!id) {
        id = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        localStorage.setItem('chatbot_session_id', id);
      }
      setSessionId(id);
      loadSession(id);
    }
  }, []);

  // Ref para rastrear si ya se inicializó el config
  const configInitialized = useRef(false);
  const lastConfigString = useRef('');

  // Update config when initialConfig changes (including restrictedTopics)
  // Solo actualizar si realmente cambió el contenido de initialConfig
  useEffect(() => {
    if (!sessionId || !initialConfig) return;

    const newConfig = {
      title: initialConfig.title || 'Asistente Virtual',
      greeting: initialConfig.greeting || '¡Hola! 👋 Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
      placeholder: initialConfig.placeholder || 'Escribe tu mensaje aquí...',
      textColor: initialConfig.textColor || '#1F2937',
      headerColor: initialConfig.headerColor || '#4F46E5',
      backgroundColor: initialConfig.backgroundColor || '#FFFFFF',
      icon: initialConfig.icon || 'FaComments',
      fontFamily: initialConfig.fontFamily || 'Inter',
      customIconUrl: initialConfig.customIconUrl,
      restrictedTopics: initialConfig.restrictedTopics || [],
    };

    const newConfigString = JSON.stringify(newConfig);

    // Solo actualizar si el config realmente cambió
    if (lastConfigString.current === newConfigString) {
      return; // No hacer nada si no cambió
    }

    lastConfigString.current = newConfigString;

    setConfig(newConfig);

    // Solo enviar al backend después de la inicialización (excepto en modo demo)
    if (configInitialized.current && !isDemoMode()) {
      fetch(`${API_URL}/api/chatbot/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          config: newConfig,
        }),
      }).catch(err => {
        console.error('Error updating config:', err);
      });
    } else {
      configInitialized.current = true;
    }
  }, [sessionId, initialConfig]);

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
          // Extract documents if available
          if (data.data.documents) {
            setUploadedDocuments(data.data.documents);
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
      if (isDemoMode()) {
        // Modo demo: solo simular subida
        const fileNames = files.map(f => f.name);
        setUploadedDocuments(prev => {
          const updated = [...prev, ...fileNames];
          // Guardar en sessionStorage
          const demoData = {
            config,
            messages,
            uploadedDocuments: updated,
          };
          sessionStorage.setItem('chatbot_demo_data', JSON.stringify(demoData));
          return updated;
        });

        setIsLoading(false);
        return true;
      }

      // Modo normal: subir al backend
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

      // Add uploaded file names to the list
      const fileNames = files.map(f => f.name);
      setUploadedDocuments(prev => [...prev, ...fileNames]);

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
      if (isDemoMode()) {
        // Modo demo: usar backend REAL pero guardar en sessionStorage
        // La única diferencia es que los datos son temporales (se borran al recargar)
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
          source: data.data.source,
        };

        setMessages(prev => {
          const updated = [...prev, assistantMessage];
          // Guardar en sessionStorage para modo demo
          const demoData = {
            config,
            messages: updated,
            uploadedDocuments,
          };
          sessionStorage.setItem('chatbot_demo_data', JSON.stringify(demoData));
          return updated;
        });

        setIsLoading(false);
        return;
      }

      // Modo normal: enviar al backend
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

  // Limpiar mensajes
  const clearMessages = async (): Promise<void> => {
    if (!sessionId) return;

    try {
      if (isDemoMode()) {
        // Modo demo: solo limpiar del sessionStorage
        setMessages([]);
        const demoData = {
          config,
          messages: [],
          uploadedDocuments,
        };
        sessionStorage.setItem('chatbot_demo_data', JSON.stringify(demoData));
      } else {
        // Modo normal: limpiar del backend
        await fetch(`${API_URL}/api/chatbot/messages/${sessionId}`, {
          method: 'DELETE',
        });
        setMessages([]);
      }
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
    uploadedDocuments,
    uploadDocuments,
    sendMessage,
    updateConfig,
    clearMessages,
  };
}
