import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KopTup - Auditoría Médica con IA',
    short_name: 'KopTup',
    description:
      'Plataforma de auditoría médica automatizada con IA. Gestión de glosas, facturación hospitalaria y liquidación de cuentas médicas para IPS en Colombia.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['medical', 'health', 'business', 'productivity'],
    lang: 'es-CO',
    dir: 'ltr',
    orientation: 'portrait-primary',
  };
}
