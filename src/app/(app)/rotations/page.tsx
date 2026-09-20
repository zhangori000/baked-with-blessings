import { RotationsShowcase } from '@/app/(app)/RotationsShowcase'
import { buildStaticMetadata } from '@/utilities/buildStaticMetadata'

export const metadata = buildStaticMetadata({
  description: 'Browse this week’s specials in the animated Baked with Blessings showcase.',
  path: '/rotations',
  title: 'Specials of the Week',
})

export default function RotationsPage() {
  return <RotationsShowcase />
}
