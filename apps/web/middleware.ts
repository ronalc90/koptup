import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const locale = request.cookies.get('locale')?.value || 'es';
  console.log('[middleware] path:', request.nextUrl.pathname, 'cookie locale:', locale);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', locale);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = { matcher: ['/((?!api|_next|.*\\..*).*)'] };
