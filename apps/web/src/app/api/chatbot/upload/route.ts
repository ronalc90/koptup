import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://koptupbackend-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const response = await fetch(`${BACKEND_URL}/api/chatbot/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error in chatbot upload proxy:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al subir documentos',
      },
      { status: 500 }
    );
  }
}
