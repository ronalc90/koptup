/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
process.env._next_intl_trailing_slash = process.env._next_intl_trailing_slash ?? 'false';

const RAW_API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
const NORMALIZED_API = RAW_API.startsWith('http') ? RAW_API : `https://${RAW_API}`;
let API_ORIGIN = 'http://localhost:3001';
try {
  API_ORIGIN = new URL(NORMALIZED_API).origin;
} catch {}

// Medición para anuncios (src/components/analytics/Analytics.tsx): la CSP solo
// abre los dominios de una etiqueta si su variable existe en el build (las
// NEXT_PUBLIC_* se fijan al compilar; cambiarlas exige redesplegar). Mismos
// formatos que valida src/lib/analytics.ts.
const hasEnv = (name, pattern) => pattern.test((process.env[name] || '').trim());
const USE_GOOGLE_TAG =
  hasEnv('NEXT_PUBLIC_GA_ID', /^G-[A-Z0-9]+$/i) ||
  hasEnv('NEXT_PUBLIC_GOOGLE_ADS_ID', /^(AW-)?\d+$/i);
const USE_LINKEDIN = hasEnv('NEXT_PUBLIC_LINKEDIN_PARTNER_ID', /^\d+$/);

// Dominios de Google tag (gtag.js) para GA4 y Google Ads, según
// https://developers.google.com/tag-platform/security/guides/csp
// (GA4 con funciones publicitarias + conversiones/remarketing de Google Ads).
// `*.google.com.co`: dominio de país de Google para Colombia (la CSP no admite
// comodines de TLD).
const GOOGLE_TAG_CSP = {
  script: ['https://www.googletagmanager.com', 'https://www.googleadservices.com', 'https://www.google.com', 'https://googleads.g.doubleclick.net'],
  img: ['https://www.googletagmanager.com', 'https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.g.doubleclick.net', 'https://*.google.com', 'https://*.google.com.co', 'https://www.googleadservices.com', 'https://pagead2.googlesyndication.com'],
  connect: ['https://www.googletagmanager.com', 'https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.doubleclick.net', 'https://*.google.com', 'https://*.google.com.co', 'https://www.googleadservices.com', 'https://pagead2.googlesyndication.com'],
  frame: ['https://www.googletagmanager.com', 'https://td.doubleclick.net'],
};
// LinkedIn Insight Tag: script en snap.licdn.com; envía los eventos (fetch,
// sendBeacon o píxel) a px.ads.linkedin.com.
const LINKEDIN_CSP = {
  script: ['https://snap.licdn.com'],
  img: ['https://px.ads.linkedin.com'],
  connect: ['https://px.ads.linkedin.com'],
  frame: [],
};
const ANALYTICS_CSP = [USE_GOOGLE_TAG && GOOGLE_TAG_CSP, USE_LINKEDIN && LINKEDIN_CSP].filter(Boolean);
const analyticsSources = (directive) =>
  [...new Set(ANALYTICS_CSP.flatMap((group) => group[directive]))].map((src) => ` ${src}`).join('');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,

  env: {
    _next_intl_trailing_slash: 'false'
  },
  trailingSlash: false,

  // En producción Next no traza accesos fs.readdirSync dinámicos. Sin esto,
  // `messages/{demos,offerings}/*.json` queda fuera del bundle serverless
  // y vemos claves crudas como `offeringsCatalog.hero.title` en koptup.com.
  // Solo afecta `next build`, no influye en `next dev`.
  experimental: {
    outputFileTracingIncludes: {
      '/**/*': ['./messages/**/*.json'],
    },
  },


  // Optimización de imágenes. `images.domains` está obsoleto desde Next 14:
  // `remotePatterns` limita el optimizador a HTTPS y a lo único que pasa por
  // él: las fotos de Unsplash de /about y de la demo de ecommerce. No se
  // permiten `localhost` (evita que /_next/image pida recursos internos) ni el
  // bucket de uploads (guarda archivos que suben los usuarios; los avatares e
  // íconos se muestran con `unoptimized`).
  // Sin AVIF: la rama 14 de Next no tiene parche para GHSA-2xp9-vwfh-vxw4
  // (ejecución remota vía libheif al optimizar AVIF, solo si se autoaloja con
  // `next start`; corregido en 15.5.24). WebP basta para estas fotos.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com', pathname: '/photo-**' }],
    formats: ['image/webp'],
  },

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // Security & SEO headers
  async headers() {
    const securityHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on'
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload'
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin'
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(self)'
      }
    ];
    const contentSecurityPolicy = (frameAncestors) => ({
      key: 'Content-Security-Policy',
      value:
        `default-src 'self' https://www.google.com; img-src 'self' data: blob: https://koptup-uploads.s3.amazonaws.com https://images.unsplash.com https://media.licdn.com${analyticsSources('img')}; script-src 'self' 'unsafe-inline' 'unsafe-eval'${analyticsSources('script')}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' blob: ${API_ORIGIN} http://localhost:3001 https://*.railway.app https://koptup-uploads.s3.amazonaws.com${analyticsSources('connect')}; frame-src 'self' https://www.google.com${analyticsSources('frame')}; frame-ancestors ${frameAncestors}; base-uri 'self'; form-action 'self'; media-src 'self' blob:; worker-src 'self' blob:`
    });
    return [
      {
        // Todo el sitio menos /embed/*: solo se puede incrustar en el propio dominio.
        source: '/:path((?!embed(?:/|$)).*)',
        headers: [
          ...securityHeaders,
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          contentSecurityPolicy("'self'")
        ]
      },
      {
        // /embed/* (chat del widget, apps/web/public/widget.js): se incrusta en el
        // sitio de cada cliente, así que no lleva X-Frame-Options y permite
        // cualquier frame-ancestor.
        source: '/embed/:path*',
        headers: [...securityHeaders, contentSecurityPolicy('*')]
      },
      // Cache static assets aggressively
      {
        source: '/(.*)\\.(ico|png|jpg|jpeg|gif|svg|webp|avif|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // Cache manifest and robots
      {
        source: '/(manifest\\.json|robots\\.txt|sitemap\\.xml)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400'
          }
        ]
      }
    ];
  },

  // Webpack configuration for chat module
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = withNextIntl(nextConfig);
