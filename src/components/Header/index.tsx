import configPromise from '@payload-config'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getSitePages } from '@/utilities/getSitePages'
import { getPayload } from 'payload'

import './index.css'
import { HeaderClient } from './index.client'

type HeaderBrand = {
  brandName: string
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
  logoAlt: 'Baked with Blessings logo',
  logoUrl: '/baked-with-blessings-logo-pasture-restored.svg',
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
      logoAlt,
      logoUrl: uploadedLogoUrl || defaultHeaderBrand.logoUrl,
    }
  }

  return {
    brandName,
    logoAlt,
    logoUrl:
      brand?.logoPath?.trim() === '/baked-with-blessings-logo.svg' ||
      brand?.logoPath?.trim() === '/baked-with-blessings-logo-pasture.svg'
        ? defaultHeaderBrand.logoUrl
        : brand?.logoPath?.trim() || defaultHeaderBrand.logoUrl,
  }
}

export async function Header() {
  const payload = await getPayload({ config: configPromise })
  const [header, brandDocument, sitePages] = await Promise.all([
    getCachedGlobal('header', 1)(),
    payload
      .findGlobal({
        depth: 1,
        slug: 'brand' as any,
      })
      .catch(() => null),
    getSitePages(),
  ])

  return (
    <HeaderClient
      brand={buildHeaderBrand(brandDocument as BrandGlobalDocument | null)}
      header={header}
      sitePages={sitePages}
    />
  )
}
