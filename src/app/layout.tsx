import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: 'CondoHub — Administración de condominios en RD',
    template: '%s | CondoHub',
  },
  description: 'Administra tu condominio desde WhatsApp. Para síndicos y administradores profesionales en República Dominicana.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://condohub.com'),
  robots: { index: true, follow: true },
  openGraph: {
    siteName: 'CondoHub',
    locale: 'es_DO',
    type: 'website',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CondoHub',
  },
  formatDetection: { telephone: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {})
            })
          }`}
        </Script>
      </body>
    </html>
  )
}
