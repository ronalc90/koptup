import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const response = await fetch(`${BACKEND_URL}/api/chatbot/messages/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error in chatbot clear messages proxy:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al eliminar mensajes',
      },
      { status: 500 }
    );
  }
}
