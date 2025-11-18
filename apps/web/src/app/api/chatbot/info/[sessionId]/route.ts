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

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get or create session
    let session = sessions.get(sessionId);

    if (!session) {
      // Create new session
      session = {
        sessionId,
        messages: [],
        createdAt: new Date().toISOString(),
      };
      sessions.set(sessionId, session);
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        messages: session.messages,
        createdAt: session.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching session info:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
