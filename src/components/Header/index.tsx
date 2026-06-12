import configPromise from '@payload-config'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getSitePages } from '@/utilities/getSitePages'
import { getPayload } from 'payload'

import './index.css'
import { HeaderClient, type HeaderAnnouncementsData } from './index.client'

type HeaderBrand = {
  brandName: string
  darkLogoUrl: string | null
  logoAlt: string
  logoUrl: string | null
}

type BrandGlobalDocument = {
  brandName?: string | null
  logoAlt?: string | null
  logoSource?: 'mediaUpload' | 'publicPath' | null
  logoPath?: string | null
  logo?:
    | {
        url?: string | null
      }
    | number
    | null
}

const defaultHeaderBrand: HeaderBrand = {
  brandName: 'Baked with Blessings',
  darkLogoUrl: '/logo-dark-theme.svg',
  logoAlt: 'Baked with Blessings logo',
  logoUrl: '/logo.svg',
}

const normalizeBrandLogoUrl = (value: BrandGlobalDocument['logo']) => {
  if (!value || typeof value === 'number') return null

  return typeof value.url === 'string' && value.url.length > 0 ? value.url : null
}

const buildHeaderBrand = (brand: BrandGlobalDocument | null): HeaderBrand => {
  const brandName = brand?.brandName?.trim() || defaultHeaderBrand.brandName
  const logoAlt = brand?.logoAlt?.trim() || defaultHeaderBrand.logoAlt
  const uploadedLogoUrl = normalizeBrandLogoUrl(brand?.logo)

  if (brand?.logoSource === 'mediaUpload') {
    return {
      brandName,
      darkLogoUrl: defaultHeaderBrand.darkLogoUrl,
      logoAlt,
      logoUrl: uploadedLogoUrl || defaultHeaderBrand.logoUrl,
    }
  }

  return {
    brandName,
    darkLogoUrl: defaultHeaderBrand.darkLogoUrl,
    logoAlt,
    logoUrl:
      brand?.logoPath?.trim() === '/baked-with-blessings-logo.svg' ||
      brand?.logoPath?.trim() === '/baked-with-blessings-logo-pasture.svg' ||
      brand?.logoPath?.trim() === '/baked-with-blessings-logo-pasture-restored.svg'
        ? defaultHeaderBrand.logoUrl
        : brand?.logoPath?.trim() || defaultHeaderBrand.logoUrl,
  }
}

type AnnouncementsGlobalDocument = {
  items?:
    | Array<{
        id?: null | string
        linkHref?: null | string
        linkLabel?: null | string
        message?: null | string
        title?: null | string
      }>
    | null
  updatedAt?: null | string
}

const buildHeaderAnnouncements = (
  document: AnnouncementsGlobalDocument | null,
): HeaderAnnouncementsData => ({
  items: (document?.items ?? []).flatMap((item) =>
    item?.title && item?.message
      ? [
          {
            id: item.id ?? null,
            linkHref: item.linkHref ?? null,
            linkLabel: item.linkLabel ?? null,
            message: item.message,
            title: item.title,
          },
        ]
      : [],
  ),
  updatedAt: document?.updatedAt ?? null,
})

export async function Header() {
  const payload = await getPayload({ config: configPromise })
  const [header, brandDocument, sitePages, announcementsDocument] = await Promise.all([
    getCachedGlobal('header', 1)(),
    payload
      .findGlobal({
        depth: 1,
        slug: 'brand',
      })
      .catch(() => null),
    getSitePages(),
    payload
      .findGlobal({
        depth: 0,
        slug: 'announcements',
      })
      .catch(() => null),
  ])

  return (
    <HeaderClient
      announcements={buildHeaderAnnouncements(
        announcementsDocument as AnnouncementsGlobalDocument | null,
      )}
      brand={buildHeaderBrand(brandDocument as BrandGlobalDocument | null)}
      header={header}
      sitePages={sitePages}
    />
  )
}
