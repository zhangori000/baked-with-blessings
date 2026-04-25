'use client'

import type { FormState } from 'payload'

import { Button, toast, useConfig, useForm, useFormFields } from '@payloadcms/ui'
import React, { useEffect, useMemo, useState } from 'react'

import './ProductGalleryBulkPicker.css'

type MediaDoc = {
  id: number | string
  alt?: string | null
  filename?: string | null
  thumbnailURL?: string | null
  url?: string | null
  sizes?: {
    thumbnail?: {
      url?: string | null
    } | null
  } | null
}

type MediaResponse = {
  docs?: MediaDoc[]
}

type GalleryItem = {
  image?: MediaDoc | number | string | null
}

const baseClass = 'product-gallery-bulk-picker'

const getMediaID = (value: GalleryItem['image']): MediaDoc['id'] | null => {
  if (!value) {
    return null
  }

  if (typeof value === 'object') {
    return value.id ?? null
  }

  return value
}

const getImageURL = (doc: MediaDoc): string | null =>
  doc.sizes?.thumbnail?.url ?? doc.thumbnailURL ?? doc.url ?? null

const createGalleryRowState = (mediaID: MediaDoc['id']): FormState => ({
  image: {
    initialValue: mediaID,
    passesCondition: true,
    valid: true,
    value: mediaID,
  },
})

export const ProductGalleryBulkPicker: React.FC = () => {
  const {
    config: {
      routes: { api },
    },
  } = useConfig()
  const { dispatchFields, getDataByPath, setModified } = useForm()
  const galleryRowCount = useFormFields<number>(
    ([fields]) => fields.gallery?.rows?.length ?? Number(fields.gallery?.value ?? 0),
  )

  const [mediaDocs, setMediaDocs] = useState<MediaDoc[]>([])
  const [selectedIDs, setSelectedIDs] = useState<Set<MediaDoc['id']>>(() => new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const loadMedia = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`${api}/media?limit=100&sort=-createdAt&depth=0`, {
          credentials: 'include',
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Could not load media.')
        }

        const result = (await response.json()) as MediaResponse
        setMediaDocs(result.docs ?? [])
      } catch (caughtError) {
        if (controller.signal.aborted) {
          return
        }

        setError(caughtError instanceof Error ? caughtError.message : 'Could not load media.')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadMedia()

    return () => {
      controller.abort()
    }
  }, [api])

  const existingGalleryIDs = useMemo(() => {
    const gallery = getDataByPath<GalleryItem[]>('gallery')

    return new Set(
      Array.isArray(gallery)
        ? gallery
            .map((item) => getMediaID(item?.image))
            .filter((id): id is MediaDoc['id'] => id !== null)
        : [],
    )
    // Recompute when the gallery row count changes after this component adds rows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryRowCount, getDataByPath])

  const selectedNewIDs = useMemo(
    () => [...selectedIDs].filter((id) => !existingGalleryIDs.has(id)),
    [existingGalleryIDs, selectedIDs],
  )

  const toggleSelected = (id: MediaDoc['id']) => {
    setSelectedIDs((current) => {
      const next = new Set(current)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
  }

  const addSelectedToGallery = () => {
    if (selectedNewIDs.length === 0) {
      toast.info('No new photos selected.')
      return
    }

    selectedNewIDs.forEach((id, index) => {
      dispatchFields({
        path: 'gallery',
        rowIndex: galleryRowCount + index,
        subFieldState: createGalleryRowState(id),
        type: 'ADD_ROW',
      })
    })

    setModified(true)
    setSelectedIDs(new Set())
    toast.success(
      `Added ${selectedNewIDs.length} photo${selectedNewIDs.length === 1 ? '' : 's'} to gallery.`,
    )
  }

  return (
    <section className={baseClass}>
      <div className={`${baseClass}__header`}>
        <div>
          <h3 className={`${baseClass}__title`}>Bulk add existing gallery photos</h3>
          <p className={`${baseClass}__description`}>
            Select photos here first. Nothing changes until you click Add selected to gallery.
          </p>
        </div>
        <Button
          buttonStyle="primary"
          disabled={selectedNewIDs.length === 0}
          onClick={addSelectedToGallery}
          size="small"
        >
          Add selected to gallery
        </Button>
      </div>

      {isLoading ? <p className={`${baseClass}__status`}>Loading media...</p> : null}
      {error ? <p className={`${baseClass}__status ${baseClass}__status--error`}>{error}</p> : null}

      {!isLoading && !error ? (
        <div className={`${baseClass}__grid`}>
          {mediaDocs.map((doc) => {
            const imageURL = getImageURL(doc)
            const isSelected = selectedIDs.has(doc.id)
            const isAlreadyInGallery = existingGalleryIDs.has(doc.id)

            return (
              <button
                className={[
                  `${baseClass}__tile`,
                  isSelected && `${baseClass}__tile--selected`,
                  isAlreadyInGallery && `${baseClass}__tile--existing`,
                ]
                  .filter(Boolean)
                  .join(' ')}
                disabled={isAlreadyInGallery}
                key={doc.id}
                onClick={() => toggleSelected(doc.id)}
                type="button"
              >
                <span className={`${baseClass}__thumb`}>
                  {imageURL ? (
                    // Admin thumbnails are already generated by Payload; Next Image is not needed here.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={doc.alt ?? doc.filename ?? ''} src={imageURL} />
                  ) : null}
                </span>
                <span className={`${baseClass}__meta`}>
                  <span className={`${baseClass}__filename`}>{doc.filename ?? `Media ${doc.id}`}</span>
                  <span className={`${baseClass}__state`}>
                    {isAlreadyInGallery ? 'Already in gallery' : isSelected ? 'Selected' : 'Click to select'}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
