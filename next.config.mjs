/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sécurité: Désactiver la révélation du header 'X-Powered-By'
  poweredByHeader: false,
  
  // Permettre l'accès depuis d'autres appareils sur le réseau local
  reactStrictMode: true,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
          hostname: 'api.dicebear.com',
        pathname: '/**',
      },
    ],
  },
  
  // En-têtes de sécurité
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          // Désactiver le prefetching DNS pour les domaines externes
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'off',
          },
          // Empêcher le click-jacking
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Empêcher MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Activer la protection XSS du navigateur
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Contrôler les referrers
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // HSTS: Forcer HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Limiter les permissions de la page (sauf camera/microphone pour /live)
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
          },
        ],
      },
      // Headers spécifiques pour les API
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
  
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;