import type { ReactNode } from 'react'
import type { Metadata } from 'next'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { InitMenuScene } from '@/components/scenery/InitMenuScene'
import { ViewportFlowers } from '@/components/ViewportFlowers'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { getServerSideURL } from '@/utilities/getURL'
import { defaultSocialImage, siteDescription, siteName } from '@/utilities/siteMetadata'
import { Patrick_Hand, Rubik } from 'next/font/google'
import './globals.css'

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
    images: [defaultSocialImage],
    siteName,
    title: siteName,
    type: 'website',
    url: '/',
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
    images: [defaultSocialImage.url],
    title: siteName,
  },
}

const rubik = Rubik({
  subsets: ['latin'],
  variable: '--font-rubik',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

const patrickHand = Patrick_Hand({
  subsets: ['latin'],
  variable: '--font-handwriting',
  weight: ['400'],
  display: 'swap',
})

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      className={`${rubik.variable} ${patrickHand.variable}`}
      lang="en"
      suppressHydrationWarning
    >
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
