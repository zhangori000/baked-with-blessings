import type { Metadata } from 'next'

import './admin-not-allowed.css'
import { AdminNotAllowedClient } from './AdminNotAllowedClient'

export const metadata: Metadata = {
  description:
    'Admin access requires an admin account. Sign out of your customer session and sign back in as an admin.',
  title: 'Admin access required',
}

export default function AdminNotAllowedPage() {
  return <AdminNotAllowedClient />
}
