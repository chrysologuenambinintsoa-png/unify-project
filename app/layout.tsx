import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { DiagnosticsClient } from '@/components/DiagnosticsClient';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Unify',
  description: 'Plateforme de réseau sociale moderne et élégante',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Unify" />
        <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0F172A" media="(prefers-color-scheme: dark)" />
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