import React from 'react'

type AdminStandaloneDocumentProps = {
  children: React.ReactNode
}

/**
 * Full document used when we must not enter Payload's RootLayout.
 * Next 16 + Payload 3.84 leaves an empty Suspense slot over dark CSS
 * (`<!--$--><!--/$-->`) for unauthenticated /admin. This document is
 * real HTML the owner can see even if that RSC path stays blank.
 * Title / robots come from the admin page `generateMetadata`.
 */
export const AdminStandaloneDocument = ({ children }: AdminStandaloneDocumentProps) => (
  <html lang="en">
    <body>
      <style>{`
        :root { color-scheme: light; }
        html, body {
          background: #fffaf0 !important;
          color: #2f2414 !important;
          font-family: Georgia, "Times New Roman", serif;
          margin: 0;
          min-height: 100%;
        }
        a { color: inherit; }
      `}</style>
      {children}
    </body>
  </html>
)
