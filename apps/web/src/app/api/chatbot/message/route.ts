import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo purposes
// In production, this should use a database or external API
const sessions = new Map<string, {
  sessionId: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  }>;
  createdAt: string;
}>();

// Simple AI response generator for demo
function generateAIResponse(userMessage: string): string {
  const responses = [
    'Gracias por tu mensaje. Este es un chatbot de demostración.',
    'Entiendo tu consulta. ¿En qué más puedo ayudarte?',
    'Estoy aquí para ayudarte. Por favor, cuéntame más sobre lo que necesitas.',
    'He procesado tu mensaje. ¿Hay algo más en lo que pueda asistirte?',
    'Comprendo. Estoy diseñado para responder preguntas y brindarte asistencia.',
  ];

  // Simple keyword-based responses
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('hola') || lowerMessage.includes('buenos') || lowerMessage.includes('hi')) {
    return '¡Hola! 👋 Bienvenido. ¿En qué puedo ayudarte hoy?';
  }

  if (lowerMessage.includes('ayuda') || lowerMessage.includes('help')) {
    return 'Por supuesto, estoy aquí para ayudarte. Puedes preguntarme sobre nuestros servicios, hacer consultas o simplemente conversar. ¿Qué necesitas?';
  }

  if (lowerMessage.includes('gracias') || lowerMessage.includes('thank')) {
    return '¡De nada! 😊 Estoy aquí si necesitas algo más.';
  }

  if (lowerMessage.includes('adios') || lowerMessage.includes('bye') || lowerMessage.includes('chao')) {
    return '¡Hasta luego! 👋 Que tengas un excelente día.';
  }

  if (lowerMessage.includes('precio') || lowerMessage.includes('costo') || lowerMessage.includes('cuánto')) {
    return 'Para información sobre precios, te recomiendo visitar nuestra página de precios o contactar con nuestro equipo de ventas para una cotización personalizada.';
  }

  if (lowerMessage.includes('servicio') || lowerMessage.includes('producto')) {
    return 'Ofrecemos una amplia gama de servicios tecnológicos, incluyendo desarrollo web, aplicaciones móviles, consultoría IT y soluciones personalizadas. ¿Hay algo específico que te interese?';
  }

  // Random response for other messages
  return responses[Math.floor(Math.random() * responses.length)];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, message, documentIds } = body;

    if (!sessionId || !message) {
      return NextResponse.json(
        { success: false, error: 'Session ID and message are required' },
        { status: 400 }
      );
    }

    // Get or create session
    let session = sessions.get(sessionId);

    if (!session) {
      session = {
        sessionId,
        messages: [],
        createdAt: new Date().toISOString(),
      };
      sessions.set(sessionId, session);
    }

    // Add user message
    const userMessageId = `msg-${Date.now()}-user`;
    const userMessage = {
      id: userMessageId,
      role: 'user' as const,
      content: message,
      created_at: new Date().toISOString(),
    };
    session.messages.push(userMessage);

    // Generate AI response
    const aiResponse = generateAIResponse(message);

    // Add AI message
    const aiMessageId = `msg-${Date.now()}-assistant`;
    const aiMessage = {
      id: aiMessageId,
      role: 'assistant' as const,
      content: aiResponse,
      created_at: new Date().toISOString(),
    };
    session.messages.push(aiMessage);

    return NextResponse.json({
      success: true,
      data: {
        messageId: aiMessageId,
        response: aiResponse,
      },
    });
  } catch (error) {
    console.error('Error processing message:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
