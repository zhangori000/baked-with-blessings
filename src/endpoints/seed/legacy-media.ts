import type { Payload, PayloadRequest } from 'payload'

const legacyMediaFilenames = [
  'hat-logo.png',
  'tshirt-black.png',
  'tshirt-white.png',
  'tshirt-white-1.png',
  'cookie-singular-brookie.svg',
  'cookie-singular-oreo-cheesecake.svg',
  'cookie-singular-apple-snickerdoodle.svg',
  'cookie-singular-smores.svg',
  'cookie-singular-banana-chocolate-chip-walnut.svg',
  'cookie-singular-cinnamon-roll.svg',
  'cookie-singular-biscoff.svg',
  'cookie-singular-banana-crumble.svg',
  'cookie-singular-chocolate-peanut-butter.svg',
  'cookie-singular-dubai-chocolate.svg',
  'cookie-singular-salted-caramel-nest.svg',
  'cookie-singular-strawberry-cheesecake.svg',
  'cookie-singular-strawberry-matcha.svg',
  'cookie-singular-strawberry-matcha-marble.svg',
  '10.svg',
  '11.svg',
  '12.svg',
  '13.svg',
  '14.svg',
  '15.svg',
  '16.svg',
]

export const clearLegacyMedia = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}) => {
  const result = await payload.delete({
    collection: 'media',
    req,
    where: {
      filename: {
        in: legacyMediaFilenames,
      },
    },
  })

  return result.docs.length
}
