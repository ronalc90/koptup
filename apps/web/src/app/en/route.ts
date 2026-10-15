import { NextResponse } from 'next/server';

/**
 * /en — fija el idioma inglés con la cookie `locale` (la misma que usa el
 * selector del menú) y lleva a la portada. El sitio no tiene rutas /en/…: el
 * idioma es la cookie, así que /en es un atajo, no otra copia de las páginas.
 */
export function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/', request.url), 307);
  response.cookies.set('locale', 'en', { path: '/', maxAge: 31536000, sameSite: 'lax' });
  return response;
}
