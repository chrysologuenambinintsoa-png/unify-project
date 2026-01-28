/**
 * Configuration de sécurité pour Next.js
 */

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Désactiver la révélation d'informations sur le serveur
  poweredByHeader: false,
  
  // Configuration des en-têtes de sécurité
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
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
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()'
          }
        ]
      }
    ];
  },

  // Configuration CORS
  cors: {
    credentials: 'include',
    origin: process.env.NODE_ENV === 'production'
      ? process.env.NEXTAUTH_URL
      : 'http://localhost:3000'
  },

  // Environnement
  env: {
    // Toutes les variables NEXT_PUBLIC_* seront exposées au client
    // N'y mettez JAMAIS de secrets!
  }
};

export default nextConfig;
