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
  // CORS should be handled via middleware or specific route handlers.
  // Next.js `NextConfig` does not accept a `cors` top-level property.
  // If you need global CORS, implement a middleware in `middleware.ts` or configure CORS per API route.

  // Environnement
  env: {
    // Toutes les variables NEXT_PUBLIC_* seront exposées au client
    // N'y mettez JAMAIS de secrets!
  }
};

export default nextConfig;
