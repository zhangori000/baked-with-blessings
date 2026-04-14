import React, { Suspense } from 'react'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <div className="container my-10 flex flex-col gap-8 pb-8 md:my-14 md:gap-10">
        <div className="min-w-0 w-full">{children}</div>
      </div>
    </Suspense>
  )
}
