import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatSession {
  sessionId: string;
  sessionToken: string;
  expiresAt: string;
  messages: ChatMessage[];
}

export function useChatbot() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate a session ID based on timestamp
  const generateSessionId = useCallback(() => {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        // Check if session exists in localStorage
        const storedSessionId = localStorage.getItem('chatbot_session_id');
        if (storedSessionId) {
          setSessionId(storedSessionId);
          await loadSession(storedSessionId);
        } else {
          // Create new session
          const newSessionId = generateSessionId();
          setSessionId(newSessionId);
          localStorage.setItem('chatbot_session_id', newSessionId);
        }
      } catch (err) {
        console.error('Failed to initialize session:', err);
        // If session initialization fails, create a new one
        const newSessionId = generateSessionId();
        setSessionId(newSessionId);
        localStorage.setItem('chatbot_session_id', newSessionId);
      }
    };

    initSession();
  }, [generateSessionId]);

  // Load session messages
  const loadSession = async (sid: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/chatbot/info/${sid}`);

      if (!response.ok) {
        throw new Error(`Failed to load session: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setMessages(data.data.messages || []);
      }
    } catch (err) {
      console.error('Error loading session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load session');
      // Don't throw, just log - we'll start with empty messages
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Send message
  const sendMessage = async (content: string, documentIds?: string[]) => {
    if (!sessionId || !content.trim()) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Add user message to UI immediately
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);

      const response = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: content,
          documentIds,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Add assistant response to messages
        const assistantMessage: ChatMessage = {
          id: data.data.messageId,
          role: 'assistant',
          content: data.data.response,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');

      // Remove the optimistic user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  // Clear session
  const clearSession = useCallback(() => {
    localStorage.removeItem('chatbot_session_id');
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    setMessages([]);
    localStorage.setItem('chatbot_session_id', newSessionId);
  }, [generateSessionId]);

  return {
    sessionId,
    messages,
    isLoading,
    error,
    sendMessage,
    clearSession,
  };
}
