import type { ReactNode } from 'react'
import type { Metadata } from 'next'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { InitMenuScene } from '@/components/scenery/InitMenuScene'
import { ViewportFlowers } from '@/components/ViewportFlowers'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { getServerSideURL } from '@/utilities/getURL'
import { Rubik } from 'next/font/google'
import './globals.css'

const siteName = 'Baked with Blessings'
const siteDescription = 'A bakery and cafe sharing cookies, catering, and notes from the business.'

export const metadata: Metadata = {
  description: siteDescription,
  icons: {
    icon: [
      {
        type: 'image/svg+xml',
        url: '/favicon.svg',
      },
      {
        sizes: '32x32',
        url: '/favicon.ico',
      },
    ],
    shortcut: '/favicon.ico',
  },
  metadataBase: new URL(getServerSideURL()),
  openGraph: {
    description: siteDescription,
    images: [
      {
        url: '/baked-with-blessings-logo-pasture-restored.svg',
      },
    ],
    siteName,
    title: siteName,
    type: 'website',
  },
  robots: {
    follow: true,
    index: true,
  },
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  twitter: {
    card: 'summary_large_image',
    description: siteDescription,
    images: ['/baked-with-blessings-logo-pasture-restored.svg'],
    title: siteName,
  },
}

const rubik = Rubik({
  subsets: ['latin'],
  variable: '--font-rubik',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className={rubik.variable} lang="en" suppressHydrationWarning>
      <head>
        <InitTheme />
        <InitMenuScene />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <link href="/favicon.ico" rel="alternate icon" sizes="32x32" />
      </head>
      <body>
        <Providers>
          <ViewportFlowers />
          <div className="siteFrame">
            <AdminBar />
            <LivePreviewListener />

            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
