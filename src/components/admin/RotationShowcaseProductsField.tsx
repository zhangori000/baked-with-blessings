'use client'

import { BakeryPressable } from '@/design-system/bakery'
import { Button, toast, useConfig, useField } from '@payloadcms/ui'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import './RotationShowcaseProductsField.css'

type ProductID = number | string

type ProductDoc = {
  id: ProductID
  slug?: string | null
  title?: string | null
}

type CategoryDoc = {
  id: ProductID
  slug?: string | null
}

type CategoriesResponse = {
  docs?: CategoryDoc[]
}

type ProductsResponse = {
  docs?: ProductDoc[]
}

type RelationshipValue = ProductDoc | ProductID | null | undefined

const baseClass = 'rotation-showcase-products-field'

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

const removeIDsNotInAllowedSet = (ids: ProductID[], allowedIDs: ProductID[]) => {
  const allowed = new Set(allowedIDs.map((id) => String(id)))

  return ids.filter((id) => allowed.has(String(id)))
}

export const RotationShowcaseProductsField: React.FC = () => {
  const {
    config: {
      routes: { api },
    },
  } = useConfig()
  const {
    disabled,
    errorMessage,
    setValue: setShowcaseProductsValue,
    showError,
    value: showcaseProductsValue,
  } = useField<ProductID[]>({
    path: 'showcaseProducts',
  })
  const { setValue: setIndividualFlavorsValue, value: individualFlavorsValue } =
    useField<ProductID[]>({
      path: 'individualFlavors',
    })

  const [products, setProducts] = useState<ProductDoc[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const loadProducts = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const productsURL = new URL(`${api}/products`, window.location.origin)
        productsURL.searchParams.set('depth', '0')
        productsURL.searchParams.set('limit', '200')
        productsURL.searchParams.set('sort', 'title')
        productsURL.searchParams.set('where[_status][equals]', 'published')
        productsURL.searchParams.set('where[menuBehavior][not_equals]', 'batchBuilder')

        const categoriesURL = new URL(`${api}/categories`, window.location.origin)
        categoriesURL.searchParams.set('depth', '0')
        categoriesURL.searchParams.set('limit', '1')
        categoriesURL.searchParams.set('where[slug][equals]', 'catering')

        const categoriesResponse = await fetch(categoriesURL.toString(), {
          credentials: 'include',
          signal: controller.signal,
        })

        if (!categoriesResponse.ok) {
          throw new Error('Could not load product categories.')
        }

        const categoriesResult = (await categoriesResponse.json()) as CategoriesResponse
        const cateringCategoryID = categoriesResult.docs?.[0]?.id

        if (cateringCategoryID != null) {
          productsURL.searchParams.set('where[categories][not_in]', String(cateringCategoryID))
        }

        const response = await fetch(productsURL.toString(), {
          credentials: 'include',
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Could not load products.')
        }

        const result = (await response.json()) as ProductsResponse
        setProducts(result.docs ?? [])
      } catch (caughtError) {
        if (controller.signal.aborted) {
          return
        }

        setError(caughtError instanceof Error ? caughtError.message : 'Could not load products.')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadProducts()

    return () => {
      controller.abort()
    }
  }, [api])

  const selectedIDs = useMemo(
    () => normalizeRelationshipIDs(showcaseProductsValue),
    [showcaseProductsValue],
  )
  const selectedCount = selectedIDs.length
  const allProductIDs = useMemo(() => products.map((product) => product.id), [products])
  const allLoadedProductsSelected =
    allProductIDs.length > 0 && allProductIDs.every((id) => hasID(selectedIDs, id))

  const updateShowcaseProducts = useCallback((nextIDs: ProductID[]) => {
    const nextIndividualIDs = removeIDsNotInAllowedSet(
      normalizeRelationshipIDs(individualFlavorsValue),
      nextIDs,
    )

    setShowcaseProductsValue(nextIDs)
    setIndividualFlavorsValue(nextIndividualIDs)
  }, [individualFlavorsValue, setIndividualFlavorsValue, setShowcaseProductsValue])

  useEffect(() => {
    if (isLoading || error || selectedIDs.length === 0) {
      return
    }

    const eligibleSelectedIDs = removeIDsNotInAllowedSet(selectedIDs, allProductIDs)

    if (eligibleSelectedIDs.length !== selectedIDs.length) {
      updateShowcaseProducts(eligibleSelectedIDs)
      toast.info('Removed tray or catering-pack products from this rotation list.')
    }
  }, [allProductIDs, error, isLoading, selectedIDs, updateShowcaseProducts])

  const addAllProducts = () => {
    if (allProductIDs.length === 0) {
      toast.info('No published products are available to add.')
      return
    }

    updateShowcaseProducts(allProductIDs)
    toast.success(`Added ${allProductIDs.length} product${allProductIDs.length === 1 ? '' : 's'}.`)
  }

  const clearAllProducts = () => {
    updateShowcaseProducts([])
    toast.success('Cleared all products from this rotation.')
  }

  const toggleProduct = (id: ProductID) => {
    const nextIDs = hasID(selectedIDs, id)
      ? selectedIDs.filter((selectedID) => String(selectedID) !== String(id))
      : [...selectedIDs, id]

    updateShowcaseProducts(nextIDs)
  }

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <div>
          <span className={`${baseClass}__label`} id="rotation-showcase-products-label">
            All flavors shown on /rotations <span aria-hidden="true">*</span>
          </span>
          <p className={`${baseClass}__description`} id="rotation-showcase-products-description">
            Select every normal product customers should see on /rotations. Tray, catering-pack,
            and batch-builder products are hidden from this list.
          </p>
        </div>
        <div className={`${baseClass}__actions`}>
          <Button
            buttonStyle="secondary"
            disabled={disabled || isLoading || allLoadedProductsSelected}
            onClick={addAllProducts}
            size="small"
          >
            Add all
          </Button>
          <Button
            buttonStyle="secondary"
            disabled={disabled || selectedCount === 0}
            onClick={clearAllProducts}
            size="small"
          >
            Clear all
          </Button>
        </div>
      </div>

      <p className={`${baseClass}__count`}>
        {selectedCount} selected
        {products.length > 0 ? ` from ${products.length} eligible published products` : ''}
      </p>

      {isLoading ? <p className={`${baseClass}__status`}>Loading products...</p> : null}
      {error ? <p className={`${baseClass}__status ${baseClass}__status--error`}>{error}</p> : null}
      {showError && errorMessage ? (
        <p className={`${baseClass}__status ${baseClass}__status--error`}>{errorMessage}</p>
      ) : null}

      {!isLoading && !error ? (
        <div
          aria-describedby="rotation-showcase-products-description"
          aria-labelledby="rotation-showcase-products-label"
          className={`${baseClass}__list`}
          id="rotation-showcase-products"
          role="group"
        >
          {products.map((product) => {
            const isSelected = hasID(selectedIDs, product.id)

            return (
              <BakeryPressable
                aria-pressed={isSelected}
                className={[
                  `${baseClass}__option`,
                  isSelected && `${baseClass}__option--selected`,
                ]
                  .filter(Boolean)
                  .join(' ')}
                disabled={disabled}
                key={product.id}
                onClick={() => toggleProduct(product.id)}
                type="button"
              >
                <span aria-hidden="true" className={`${baseClass}__check`} />
                <span className={`${baseClass}__optionText`}>
                  <span className={`${baseClass}__title`}>
                    {product.title ?? `Product ${product.id}`}
                  </span>
                  {product.slug ? (
                    <span className={`${baseClass}__slug`}>/{product.slug}</span>
                  ) : null}
                </span>
              </BakeryPressable>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
