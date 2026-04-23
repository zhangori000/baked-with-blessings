import { FooterClient } from '@/components/Footer/FooterClient'
import { getCachedGlobal } from '@/utilities/getGlobals'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

const { COMPANY_NAME, SITE_NAME } = process.env

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

const defaultFooterBrand = {
  brandName: 'Baked with Blessings',
  logoAlt: 'Baked with Blessings logo',
  logoUrl: '/baked-with-blessings-logo-pasture-restored.svg',
}

const normalizeBrandLogoUrl = (value: BrandGlobalDocument['logo']) => {
  if (!value || typeof value === 'number') return null
  return typeof value.url === 'string' && value.url.length > 0 ? value.url : null
}

const buildFooterBrand = (brand: BrandGlobalDocument | null) => {
  const brandName = brand?.brandName?.trim() || defaultFooterBrand.brandName
  const logoAlt = brand?.logoAlt?.trim() || defaultFooterBrand.logoAlt
  const uploadedLogoUrl = normalizeBrandLogoUrl(brand?.logo)

  if (brand?.logoSource === 'mediaUpload') {
    return {
      brandName,
      logoAlt,
      logoUrl: uploadedLogoUrl || defaultFooterBrand.logoUrl,
    }
  }

  return {
    brandName,
    logoAlt,
    logoUrl:
      brand?.logoPath?.trim() === '/baked-with-blessings-logo.svg' ||
      brand?.logoPath?.trim() === '/baked-with-blessings-logo-pasture.svg'
        ? defaultFooterBrand.logoUrl
        : brand?.logoPath?.trim() || defaultFooterBrand.logoUrl,
  }
}

export async function Footer() {
  const payload = await getPayload({ config: configPromise })
  const [footer, brandDocument] = await Promise.all([
    getCachedGlobal('footer', 1)(),
    payload
      .findGlobal({
        depth: 1,
        slug: 'brand' as any,
      })
      .catch(() => null),
  ])

  const brand = buildFooterBrand(brandDocument as BrandGlobalDocument | null)
  const currentYear = new Date().getFullYear()
  const copyrightName = COMPANY_NAME || SITE_NAME || brand.brandName

  return (
    <FooterClient
      brand={brand}
      copyrightName={copyrightName}
      currentYear={currentYear}
      navItems={footer.navItems || []}
    />
  )
}
