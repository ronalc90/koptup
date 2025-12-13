import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://koptupbackend-production.up.railway.app';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/chatbot/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error in chatbot config proxy:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al actualizar configuración',
      },
      { status: 500 }
    );
  }
}
