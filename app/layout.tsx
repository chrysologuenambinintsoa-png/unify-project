import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { DiagnosticsClient } from '@/components/DiagnosticsClient';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Unify - Plateforme de Réseau Social',
  description: 'Unify est une plateforme de réseau social moderne et élégante. Connectez-vous avec vos amis, partagez des moments, découvrez de nouvelles personnes et créez une communauté.',
  keywords: 'réseau social, communauté, amis, partage, messages, connexion',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Unify',
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://unify.vercel.app'),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: process.env.NEXTAUTH_URL || 'https://unify.vercel.app',
    siteName: 'Unify',
    title: 'Unify - Plateforme de Réseau Social',
    description: 'Connectez-vous avec vos amis et découvrez une nouvelle façon de communiquer',
    images: [
      {
        url: '/logo.svg',
        width: 1200,
        height: 630,
        alt: 'Unify - Plateforme de Réseau Social',
        type: 'image/svg+xml',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unify - Plateforme de Réseau Social',
    description: 'Connectez-vous avec vos amis et découvrez une nouvelle façon de communiquer',
    creator: '@UnifyPlatform',
  },
  appLinks: {
    ios: {
      url: 'unify://',
      app_store_id: '',
    },
  },
  category: 'Social Network',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="application-name" content="Unify" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Unify" />
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <link rel="alternate" hrefLang="fr" href={process.env.NEXTAUTH_URL || 'https://unify.vercel.app'} />
        <link rel="canonical" href={process.env.NEXTAUTH_URL || 'https://unify.vercel.app'} />
        <link rel="manifest" href="/manifest.webmanifest" />
        <style dangerouslySetInnerHTML={{
          __html: `
            html, body, #__next {
              width: 100% !important;
              height: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background-color: #ffffff !important;
              color: #000000 !important;
            }
            html.dark, html.dark body, html.dark #__next {
              background-color: #0f172a !important;
              color: #ffffff !important;
            }
          `,
        }} />
        <script 
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('unify-theme') || 'auto';
                  const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  const htmlEl = document.documentElement;
                  
                  // Apply dark class immediately
                  if (isDark) {
                    htmlEl.classList.add('dark');
                    htmlEl.style.backgroundColor = '#0f172a';
                    htmlEl.style.color = '#ffffff';
                  } else {
                    htmlEl.classList.remove('dark');
                    htmlEl.style.backgroundColor = '#ffffff';
                    htmlEl.style.color = '#000000';
                  }
                  
                  // Set color scheme
                  htmlEl.style.colorScheme = isDark ? 'dark' : 'light';
                  
                  // Also force on body if it exists
                  if (document.body) {
                    if (isDark) {
                      document.body.style.backgroundColor = '#0f172a';
                      document.body.style.color = '#ffffff';
                    } else {
                      document.body.style.backgroundColor = '#ffffff';
                      document.body.style.color = '#000000';
                    }
                  }
                } catch (e) {
                  // Fallback to system preference
                  const htmlEl = document.documentElement;
                  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    htmlEl.classList.add('dark');
                    htmlEl.style.backgroundColor = '#0f172a';
                    htmlEl.style.colorScheme = 'dark';
                  } else {
                    htmlEl.style.backgroundColor = '#ffffff';
                    htmlEl.style.colorScheme = 'light';
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <DiagnosticsClient />
          {children}
        </Providers>
      </body>
    </html>
  );
}