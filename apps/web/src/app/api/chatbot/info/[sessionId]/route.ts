import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    const response = await fetch(`${BACKEND_URL}/api/chatbot/info/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error in chatbot info proxy:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al obtener información',
      },
      { status: 500 }
    );
  }
}
