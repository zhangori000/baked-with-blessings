'use client'

import { useBakeryAnnouncer, bakerySceneThemes } from '@/design-system/bakery'
import {
  MenuHero,
  menuSceneryTones,
  preloadSceneryAssets,
} from '@/app/(app)/menu/_components/catering-menu-scenery'
import type { MenuSceneryTone } from '@/app/(app)/menu/_components/catering-menu-types'
import { usePersistentMenuSceneTone } from '@/components/scenery/usePersistentMenuSceneTone'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

export function AccountSceneryBanner() {
  const pathname = usePathname()
  const [sceneTone, setSceneTone] = usePersistentMenuSceneTone('classic')
  const [isSceneryPickerOpen, setIsSceneryPickerOpen] = useState(false)
  const [isSceneChanging, setIsSceneChanging] = useState(false)
  const { announce } = useBakeryAnnouncer()

  useEffect(() => {
    for (const tone of menuSceneryTones) {
      preloadSceneryAssets(tone)
    }
  }, [])

  const routeTitle = useMemo(() => {
    if (pathname === '/orders') return 'Orders'
    if (pathname.startsWith('/orders/')) return `Order ${pathname.split('/').filter(Boolean).at(-1)}`
    if (pathname === '/account/addresses') return 'Addresses'
    if (pathname === '/account') return 'Account settings'

    return 'Account'
  }, [pathname])

  const routeSummary = useMemo(() => {
    if (pathname === '/orders') return 'Review paid orders, pickup status, and bakery receipts.'
    if (pathname.startsWith('/orders/')) return 'Payment went through and the bakery can prepare it.'
    if (pathname === '/account/addresses') return 'Manage optional delivery details for future orders.'
    if (pathname === '/account') return 'Update your storefront profile, email, phone, and password.'

    return 'Manage your Baked with Blessings customer account.'
  }, [pathname])

  const toggleSceneryPicker = () => {
    if (!isSceneChanging) {
      setIsSceneryPickerOpen((current) => !current)
    }
  }

  const handleSelectScenery = (nextSceneryTone: MenuSceneryTone) => {
    if (isSceneChanging || nextSceneryTone === sceneTone) {
      return
    }

    setIsSceneChanging(true)
    preloadSceneryAssets(nextSceneryTone)
    announce(`Scenery changed to ${bakerySceneThemes[nextSceneryTone]?.label ?? nextSceneryTone}.`)
    setSceneTone(nextSceneryTone)
    setIsSceneryPickerOpen(false)
    window.setTimeout(() => {
      setIsSceneChanging(false)
    }, 420)
  }

  return (
    <div
      className="accountSceneryBannerHost"
      data-scene-changing={isSceneChanging ? 'true' : undefined}
    >
      <MenuHero
        eyebrow="Baked with Blessings"
        isSceneryPickerOpen={isSceneryPickerOpen}
        isSceneChanging={isSceneChanging}
        key={sceneTone}
        onSelectScenery={handleSelectScenery}
        onToggleSceneryPicker={toggleSceneryPicker}
        sceneryTone={sceneTone}
        summary={routeSummary}
        title={routeTitle}
      />
      {isSceneChanging ? (
        <div className="accountSceneryLoadingPill" role="status">
          <span aria-hidden="true" className="accountSceneryLoadingSpinner" />
          Changing scenery
        </div>
      ) : null}
    </div>
  )
}
