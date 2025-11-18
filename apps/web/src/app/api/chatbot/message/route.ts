import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log(`[Chatbot Message] Sending message for session: ${body.sessionId}`);
    console.log(`[Chatbot Message] Backend URL: ${BACKEND_URL}`);

    const response = await fetch(`${BACKEND_URL}/api/chatbot/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log(`[Chatbot Message] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Chatbot Message] Backend error: ${errorText}`);
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
    console.error('[Chatbot Message] Error in proxy:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al procesar mensaje',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
