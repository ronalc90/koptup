import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const locale = request.cookies.get('locale')?.value || 'es';
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', locale);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = { matcher: ['/((?!api|_next|.*\\..*).*)'] };
