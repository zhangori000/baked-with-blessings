'use client'
import { RefreshRouteOnSave as PayloadLivePreview } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import React, { useSyncExternalStore } from 'react'

const subscribe = () => () => {}
const getServerSnapshot = () => ''
const getClientSnapshot = () => window.location.origin

export const LivePreviewListener: React.FC = () => {
  const router = useRouter()
  const serverURL = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)

  if (!serverURL) return null

  return <PayloadLivePreview refresh={router.refresh} serverURL={serverURL} />
}
