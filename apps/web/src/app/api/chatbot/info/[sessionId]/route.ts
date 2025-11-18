import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://koptupbackend-production.up.railway.app';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    console.log(`[Chatbot Info] Fetching info for session: ${sessionId}`);
    console.log(`[Chatbot Info] Backend URL: ${BACKEND_URL}`);

    const response = await fetch(`${BACKEND_URL}/api/chatbot/info/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`[Chatbot Info] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Chatbot Info] Backend error: ${errorText}`);
      return NextResponse.json(
        {
          success: false,
          error: `Backend error: ${response.status} - ${errorText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[Chatbot Info] Error in proxy:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al obtener información',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
