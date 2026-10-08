import { ImageResponse } from 'next/og';
import { HOME_TITLE } from '@/lib/site';

/**
 * Imagen og/twitter de la home (archivo de metadata de Next para "/"). El
 * layout raíz no declara openGraph/twitter images para que se use esta.
 */
export const runtime = 'edge';
export const alt = HOME_TITLE;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 60%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 80px',
          position: 'relative',
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            // Satori (next/og) exige la dirección explícita en cada gradiente;
            // sin ella la ruta /opengraph-image fallaba al renderizar.
            backgroundImage:
              'linear-gradient(180deg, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 'bold',
              color: 'white',
              boxShadow: '0 0 30px rgba(59,130,246,0.5)',
            }}
          >
            K
          </div>
          <span
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: 'white',
              letterSpacing: '-1px',
            }}
          >
            KopTup
          </span>
        </div>

        {/* Main title */}
        <div
          style={{
            fontSize: '52px',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: '20px',
            maxWidth: '900px',
          }}
        >
          IA que responde con los documentos de tu empresa
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '28px',
            color: '#93c5fd',
            textAlign: 'center',
            marginBottom: '40px',
            maxWidth: '1000px',
          }}
        >
          Sistemas RAG · Respuestas con fuente citada · Piloto en 2 semanas
        </div>

        {/* CTA pill */}
        <div
          style={{
            background: 'rgba(59,130,246,0.2)',
            border: '1px solid rgba(147,197,253,0.3)',
            borderRadius: '100px',
            padding: '12px 32px',
            fontSize: '22px',
            color: '#bfdbfe',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          Prueba la demo gratis
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            right: '48px',
            fontSize: '20px',
            color: '#60a5fa',
          }}
        >
          www.koptup.com
        </div>
      </div>
    ),
    { ...size }
  );
}
