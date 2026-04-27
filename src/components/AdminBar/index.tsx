'use client'

import type { PayloadAdminBarProps } from '@payloadcms/admin-bar'

import { isAdminUser, type CollectionAuthUser } from '@/access/utilities'
import { cn } from '@/utilities/cn'
import { useSelectedLayoutSegments } from 'next/navigation'
import { PayloadAdminBar } from '@payloadcms/admin-bar'
import React, { useState } from 'react'

const collectionLabels = {
  pages: {
    plural: 'Pages',
    singular: 'Page',
  },
  posts: {
    plural: 'Posts',
    singular: 'Post',
  },
  projects: {
    plural: 'Projects',
    singular: 'Project',
  },
}

type CollectionLabelKey = keyof typeof collectionLabels

const Title: React.FC = () => <span>Dashboard</span>

export const AdminBar: React.FC<{
  adminBarProps?: PayloadAdminBarProps
}> = (props) => {
  const { adminBarProps } = props || {}
  const segments = useSelectedLayoutSegments()
  const [show, setShow] = useState(false)
  const collection: CollectionLabelKey =
    segments?.[0] === 'blog'
      ? 'posts'
      : segments?.[1] && segments[1] in collectionLabels
        ? (segments[1] as CollectionLabelKey)
        : 'pages'

  const onAuthChange = React.useCallback((user: CollectionAuthUser) => {
    setShow(isAdminUser(user))
  }, [])

  return (
    <div
      className={cn('py-2 bg-black text-white', {
        block: show,
        hidden: !show,
      })}
    >
      <div className="container">
        <PayloadAdminBar
          {...adminBarProps}
          className="py-2 text-white"
          classNames={{
            controls: 'font-medium text-white',
            logo: 'text-white',
            user: 'text-white',
          }}
          cmsURL={process.env.NEXT_PUBLIC_SERVER_URL}
          collectionLabels={{
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore - todo fix, not sure why this is erroring
            plural: collectionLabels[collection]?.plural || 'Pages',
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore - todo fix, not sure why this is erroring
            singular: collectionLabels[collection]?.singular || 'Page',
          }}
          logo={<Title />}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - todo fix, not sure why this is erroring
          onAuthChange={onAuthChange}
          style={{
            backgroundColor: 'transparent',
            padding: 0,
            position: 'relative',
            zIndex: 'unset',
          }}
        />
      </div>
    </div>
  )
}
