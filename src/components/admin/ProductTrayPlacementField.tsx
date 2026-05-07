'use client'

import { BakeryPressable } from '@/design-system/bakery'
import { Button, toast, useConfig, useDocumentInfo } from '@payloadcms/ui'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import './ProductTrayPlacementField.css'

type ProductID = number | string

type RelationshipValue =
  | ProductID
  | {
      id?: ProductID | null
    }
  | null
  | undefined

type TrayProductDoc = {
  id: ProductID
  selectableProducts?: RelationshipValue[] | null
  slug?: string | null
  title?: string | null
  _status?: string | null
}

type ProductsResponse = {
  docs?: TrayProductDoc[]
}

const baseClass = 'product-tray-placement-field'

const getRelationshipID = (value: RelationshipValue): ProductID | null => {
  if (!value) {
    return null
  }

  if (typeof value === 'object') {
    return value.id ?? null
  }

  return value
}

const normalizeRelationshipIDs = (value: unknown): ProductID[] => {
  if (!Array.isArray(value)) {
    return []
  }

  const seen = new Set<string>()
  const ids: ProductID[] = []

  value.forEach((item) => {
    const id = getRelationshipID(item as RelationshipValue)

    if (id == null) {
      return
    }

    const key = String(id)

    if (!seen.has(key)) {
      seen.add(key)
      ids.push(id)
    }
  })

  return ids
}

const hasID = (ids: ProductID[], id: ProductID) =>
  ids.some((currentID) => String(currentID) === String(id))

const removeID = (ids: ProductID[], id: ProductID) =>
  ids.filter((currentID) => String(currentID) !== String(id))

const normalizeIDForAPI = (id: ProductID): ProductID => {
  const idAsString = String(id)

  return /^\d+$/.test(idAsString) ? Number(idAsString) : id
}

const getErrorMessage = async (response: Response): Promise<string> => {
  const fallback = 'Could not update tray availability.'

  try {
    const result = (await response.json()) as {
      errors?: { message?: string }[]
      message?: string
    }

    return result.errors?.[0]?.message ?? result.message ?? fallback
  } catch {
    return fallback
  }
}

const getDocumentID = (id: unknown): ProductID | null => {
  if (typeof id !== 'number' && typeof id !== 'string') {
    return null
  }

  if (String(id) === 'create') {
    return null
  }

  return id
}

export const ProductTrayPlacementField: React.FC = () => {
  const {
    config: {
      routes: { api },
    },
  } = useConfig()
  const { id } = useDocumentInfo()
  const productID = useMemo(() => getDocumentID(id), [id])

  const [trays, setTrays] = useState<TrayProductDoc[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingTrayIDs, setPendingTrayIDs] = useState<Set<string>>(() => new Set())
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false)

  useEffect(() => {
    if (productID == null) {
      setIsLoading(false)
      return
    }

    const controller = new AbortController()

    const loadTrays = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const url = new URL(`${api}/products`, window.location.origin)
        url.searchParams.set('depth', '1')
        url.searchParams.set('limit', '100')
        url.searchParams.set('sort', 'title')
        url.searchParams.set('where[menuBehavior][equals]', 'batchBuilder')

        const response = await fetch(url.toString(), {
          credentials: 'include',
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Could not load tray products.')
        }

        const result = (await response.json()) as ProductsResponse
        const loadedTrays = (result.docs ?? []).filter(
          (tray) => String(tray.id) !== String(productID),
        )

        setTrays(loadedTrays)
      } catch (caughtError) {
        if (controller.signal.aborted) {
          return
        }

        setError(
          caughtError instanceof Error ? caughtError.message : 'Could not load tray products.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadTrays()

    return () => {
      controller.abort()
    }
  }, [api, productID])

  const selectedTrayIDs = useMemo(() => {
    if (productID == null) {
      return new Set<string>()
    }

    return new Set(
      trays
        .filter((tray) => hasID(normalizeRelationshipIDs(tray.selectableProducts), productID))
        .map((tray) => String(tray.id)),
    )
  }, [productID, trays])

  const allTraysSelected = trays.length > 0 && selectedTrayIDs.size === trays.length
  const hasPendingUpdates = pendingTrayIDs.size > 0 || isBulkSubmitting

  const saveTrayAvailability = useCallback(
    async (tray: TrayProductDoc, shouldIncludeProduct: boolean) => {
      if (productID == null) {
        throw new Error('Save this product before adding it to trays.')
      }

      const currentIDs = normalizeRelationshipIDs(tray.selectableProducts)
      const productAlreadyIncluded = hasID(currentIDs, productID)
      const productIDForAPI = normalizeIDForAPI(productID)
      const nextIDs = shouldIncludeProduct
        ? productAlreadyIncluded
          ? currentIDs
          : [...currentIDs, productIDForAPI]
        : removeID(currentIDs, productID)

      const response = await fetch(`${api}/products/${encodeURIComponent(String(tray.id))}`, {
        body: JSON.stringify({
          selectableProducts: nextIDs,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      const updatedTray = (await response.json()) as TrayProductDoc

      setTrays((currentTrays) =>
        currentTrays.map((currentTray) =>
          String(currentTray.id) === String(tray.id)
            ? {
                ...currentTray,
                ...updatedTray,
                selectableProducts: updatedTray.selectableProducts ?? nextIDs,
              }
            : currentTray,
        ),
      )
    },
    [api, productID],
  )

  const toggleTray = async (tray: TrayProductDoc) => {
    if (productID == null) {
      toast.info('Save this product before adding it to trays.')
      return
    }

    const trayID = String(tray.id)
    const shouldIncludeProduct = !selectedTrayIDs.has(trayID)

    setPendingTrayIDs((current) => new Set(current).add(trayID))

    try {
      await saveTrayAvailability(tray, shouldIncludeProduct)
      toast.success(
        shouldIncludeProduct
          ? `Added to ${tray.title ?? 'tray'}.`
          : `Removed from ${tray.title ?? 'tray'}.`,
      )
    } catch (caughtError) {
      toast.error(
        caughtError instanceof Error ? caughtError.message : 'Could not update tray availability.',
      )
    } finally {
      setPendingTrayIDs((current) => {
        const next = new Set(current)
        next.delete(trayID)
        return next
      })
    }
  }

  const updateAllTrays = async (shouldIncludeProduct: boolean) => {
    if (productID == null) {
      toast.info('Save this product before adding it to trays.')
      return
    }

    const targetTrays = trays.filter((tray) => {
      const traySelected = selectedTrayIDs.has(String(tray.id))
      return shouldIncludeProduct ? !traySelected : traySelected
    })

    if (targetTrays.length === 0) {
      toast.info(shouldIncludeProduct ? 'This product is already in every tray.' : 'No trays use this product.')
      return
    }

    setIsBulkSubmitting(true)
    setPendingTrayIDs(new Set(targetTrays.map((tray) => String(tray.id))))

    try {
      await Promise.all(targetTrays.map((tray) => saveTrayAvailability(tray, shouldIncludeProduct)))
      toast.success(
        shouldIncludeProduct
          ? `Added to ${targetTrays.length} tray${targetTrays.length === 1 ? '' : 's'}.`
          : `Removed from ${targetTrays.length} tray${targetTrays.length === 1 ? '' : 's'}.`,
      )
    } catch (caughtError) {
      toast.error(
        caughtError instanceof Error ? caughtError.message : 'Could not update tray availability.',
      )
    } finally {
      setPendingTrayIDs(new Set())
      setIsBulkSubmitting(false)
    }
  }

  return (
    <section className={baseClass}>
      <div className={`${baseClass}__header`}>
        <div>
          <h3 className={`${baseClass}__title`}>Tray availability</h3>
          <p className={`${baseClass}__description`}>
            Choose which trays should offer this product as a flavor choice. This updates the tray
            products for you, so you do not need to open each tray.
          </p>
        </div>
        <div className={`${baseClass}__actions`}>
          <Button
            buttonStyle="secondary"
            disabled={productID == null || isLoading || hasPendingUpdates || allTraysSelected}
            onClick={() => {
              void updateAllTrays(true)
            }}
            size="small"
            type="button"
          >
            Add to all trays
          </Button>
          <Button
            buttonStyle="secondary"
            disabled={productID == null || isLoading || hasPendingUpdates || selectedTrayIDs.size === 0}
            onClick={() => {
              void updateAllTrays(false)
            }}
            size="small"
            type="button"
          >
            Remove from all
          </Button>
        </div>
      </div>

      {productID == null ? (
        <p className={`${baseClass}__status`}>Save this product before adding it to trays.</p>
      ) : null}

      {productID != null ? (
        <>
          <p className={`${baseClass}__count`}>
            {selectedTrayIDs.size} of {trays.length} trays include this product.
          </p>

          {isLoading ? <p className={`${baseClass}__status`}>Loading trays...</p> : null}
          {error ? (
            <p className={`${baseClass}__status ${baseClass}__status--error`}>{error}</p>
          ) : null}

          {!isLoading && !error && trays.length === 0 ? (
            <p className={`${baseClass}__status`}>
              No tray products are set up yet. Create a product with flavor choices first.
            </p>
          ) : null}

          {!isLoading && !error && trays.length > 0 ? (
            <div className={`${baseClass}__list`} role="group">
              {trays.map((tray) => {
                const trayID = String(tray.id)
                const isSelected = selectedTrayIDs.has(trayID)
                const isPending = pendingTrayIDs.has(trayID)

                return (
                  <BakeryPressable
                    aria-pressed={isSelected}
                    className={[
                      `${baseClass}__option`,
                      isSelected && `${baseClass}__option--selected`,
                      isPending && `${baseClass}__option--pending`,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    disabled={hasPendingUpdates}
                    key={tray.id}
                    onClick={() => {
                      void toggleTray(tray)
                    }}
                    type="button"
                  >
                    <span aria-hidden="true" className={`${baseClass}__check`} />
                    <span className={`${baseClass}__optionText`}>
                      <span className={`${baseClass}__optionTitle`}>
                        {tray.title ?? `Tray ${tray.id}`}
                      </span>
                      <span className={`${baseClass}__optionMeta`}>
                        {tray.slug ? `/${tray.slug}` : `ID ${tray.id}`}
                        {tray._status ? ` - ${tray._status}` : ''}
                      </span>
                    </span>
                  </BakeryPressable>
                )
              })}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
