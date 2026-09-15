import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { ToastProvider } from '@/components/ui/Toast'
import MotionProvider from '@/components/common/MotionProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Gestión de Viajes',
  description: 'Aplicación completa para la gestión de viajes, gastos y planificación',
  keywords: 'viajes, gastos, planificación, presupuesto, itinerario',
  authors: [{ name: 'Travel Management App' }],
  robots: 'index, follow',
}

// En Next.js App Router, `viewport` debe exportarse por separado y como objeto
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ErrorBoundary>
          <MotionProvider>
            <ToastProvider>
              <ThemeProvider>
                <AuthProvider>
                  {children}
                </AuthProvider>
              </ThemeProvider>
            </ToastProvider>
          </MotionProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
