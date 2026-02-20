import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Unify - Plateforme de Réseau Social',
    short_name: 'Unify',
    description: 'Une plateforme de réseau social moderne pour connecter avec vos amis',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    theme_color: '#6366f1',
    background_color: '#ffffff',
    categories: ['social', 'productivity'],
    icons: [
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/logo.svg',
        sizes: '540x720',
        form_factor: 'narrow',
        type: 'image/svg+xml',
      },
      {
        src: '/logo.svg',
        sizes: '1280x720',
        form_factor: 'wide',
        type: 'image/svg+xml',
      },
    ],
    shortcuts: [
      {
        name: 'Explorer',
        short_name: 'Explorer',
        description: 'Explorez le contenu recommandé',
        url: '/explore',
        icons: [{ src: '/logo.svg', sizes: '192x192', type: 'image/svg+xml' }],
      },
      {
        name: 'Messages',
        short_name: 'Messages',
        description: 'Consultez vos messages',
        url: '/messages',
        icons: [{ src: '/logo.svg', sizes: '192x192', type: 'image/svg+xml' }],
      },
    ],
    share_target: {
      action: '/share',
      method: 'POST',
      enctype: 'multipart/form-data',
      params: {
        title: 'title',
        text: 'text',
        url: 'url',
        files: [
          {
            name: 'media',
            accept: ['image/png', 'image/jpeg', 'image/gif', 'video/mp4'],
          },
        ],
      },
    },
  }
}
