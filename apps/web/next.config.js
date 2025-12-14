/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
process.env._next_intl_trailing_slash = process.env._next_intl_trailing_slash ?? 'false';

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

  // Security headers
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
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; img-src 'self' data: https://koptup-uploads.s3.amazonaws.com https://images.unsplash.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://koptup-uploads.s3.amazonaws.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'"
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
