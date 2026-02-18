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

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,

  env: {
    _next_intl_trailing_slash: 'false'
  },
  trailingSlash: false,

  // Image optimization
  images: {
    domains: ['localhost', 'koptup-uploads.s3.amazonaws.com', 'images.unsplash.com'],
    formats: ['image/avif', 'image/webp'],
  },

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // Security & SEO headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
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
          },
          {
            key: 'Content-Security-Policy',
            value:
              `default-src 'self' https://www.google.com; img-src 'self' data: https://koptup-uploads.s3.amazonaws.com https://images.unsplash.com https://media.licdn.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' ${API_ORIGIN} http://localhost:3001 https://*.railway.app https://koptup-uploads.s3.amazonaws.com; frame-src 'self' https://www.google.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'`
          }
        ]
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
