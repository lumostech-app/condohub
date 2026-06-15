import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

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
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
