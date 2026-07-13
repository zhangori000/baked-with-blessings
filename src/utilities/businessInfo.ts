/**
 * Single source of truth for the bakery's location, service area, and the
 * legally-required Minnesota cottage food disclosure.
 *
 * Baked with Blessings operates under the Minnesota Cottage Food exemption
 * (Minn. Stat. 28A.152). Two facts here are legal requirements, not copy:
 *
 *  1. The disclosure sentence below must appear, verbatim, on the website that
 *     offers the food for purchase (subd. 2(d)) — keep it byte-identical
 *     everywhere it renders (footer, checkout, About page).
 *  2. Human cottage foods may not be shipped — pickup / in-person hand-off only.
 *
 * Re-verify wording, sales caps, and shipping rules against MDA guidance before
 * Aug 1, 2027, when the 2025 statute amendments take effect.
 */

/** Required cottage food disclosure — exact statutory wording. Do not edit. */
export const cottageFoodDisclosure =
  'These products are homemade and not subject to state inspection.'

export const businessCity = 'Plymouth'
export const businessState = 'MN'
export const businessStateFull = 'Minnesota'
export const businessTimeZone = 'America/Chicago'

/** Plain-language service area shown to customers. */
export const serviceAreaShort = 'Plymouth and much of the Twin Cities metro'

/** Warm one-liner for the footer and other ambient spots. */
export const locationTagline =
  'A small home kitchen in Plymouth, MN. Order ahead for local pickup or a friendly meetup hand-off across the Twin Cities metro.'

/**
 * Towns we can realistically reach for a pickup or meetup hand-off (roughly a
 * 45-minute drive from Plymouth — west, central, and into the cities; we skip
 * the far-south exurbs). Used for the About page chips and the LocalBusiness
 * `areaServed` structured data. A broad-but-honest list so customers can see
 * we can probably meet them.
 */
export const serviceAreaCities = [
  'Plymouth',
  'Maple Grove',
  'Wayzata',
  'Minnetonka',
  'Medina',
  'Orono',
  'Long Lake',
  'Corcoran',
  'Maple Plain',
  'Mound',
  'Excelsior',
  'Shorewood',
  'Deephaven',
  'Victoria',
  'Chanhassen',
  'Chaska',
  'Eden Prairie',
  'Hopkins',
  'St. Louis Park',
  'Golden Valley',
  'Edina',
  'Crystal',
  'New Hope',
  'Robbinsdale',
  'Brooklyn Park',
  'Brooklyn Center',
  'Champlin',
  'Osseo',
  'Rogers',
  'Minneapolis',
  'Richfield',
  'Bloomington',
  'St. Paul',
  'Roseville',
  'Coon Rapids',
  'Blaine',
] as const

/** Social profiles, used for the LocalBusiness `sameAs` structured data. */
export const socialProfiles = {
  instagram: 'https://www.instagram.com/_bakedwithblessings/',
  tiktok: 'https://www.tiktok.com/@bakedwithblessings',
}
