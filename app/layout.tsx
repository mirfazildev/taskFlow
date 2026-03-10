// app/layout.tsx — root layout

import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'TaskFlow — Shaxsiy Rivojlanish Menejeri',
  description: "Har kunlik vazifalaringizni rejalashtiring va o'sishingizni kuzating",
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#4F7FFF',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uz">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
