'use client'

import React, { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { ConfirmationModal, toast, useModal } from '@payloadcms/ui'

import { BakeryPressable } from '@/design-system/bakery'
import { defaultMiniPriceInUSD, MINI_PRICE_RATIO } from '@/features/products/sizeVariants'

import {
  getBundlePricingWarnings,
  parseBundlePricingResponse,
  type BundlePricing,
} from './bundlePricing'
import styles from './index.module.css'

type BulkCookiePriceToolProps = {
  messageClassName?: string
}

type BulkCookiePriceResponse = {
  error?: string
  matchedCount?: number
  miniPriceInUSD?: null | number
  priceInUSD?: number
  skippedCount?: number
  success?: boolean
  updatedCount?: number
}

const formatUSDFromCents = (value: number) =>
  new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
  }).format(value / 100)

const formatSuccessMessage = ({
  matchedCount = 0,
  miniPriceInUSD = null,
  priceInUSD = 0,
  skippedCount = 0,
  updatedCount = 0,
}: BulkCookiePriceResponse): string => {
  const priceLabel =
    typeof miniPriceInUSD === 'number'
      ? `${formatUSDFromCents(priceInUSD)} (mini ${formatUSDFromCents(miniPriceInUSD)})`
      : formatUSDFromCents(priceInUSD)

  if (matchedCount === 0) {
    return 'No cookie products were found.'
  }

  if (updatedCount === 0) {
    return `All ${matchedCount} cookie products were already set to ${priceLabel}.`
  }

  if (skippedCount > 0) {
    return `Updated ${updatedCount} cookies to ${priceLabel}; ${skippedCount} were already set.`
  }

  return `Updated ${updatedCount} cookies to ${priceLabel}.`
}

const MINI_PERCENT_LABEL = `${Math.round(MINI_PRICE_RATIO * 100)}%`
const CONFIRM_PRICE_UPDATE_MODAL = 'confirm-bulk-cookie-price-update'

export const BulkCookiePriceTool: React.FC<BulkCookiePriceToolProps> = ({ messageClassName }) => {
  const { openModal } = useModal()
  const [bundleCheckState, setBundleCheckState] = useState<'loading' | 'ready' | 'unavailable'>(
    'loading',
  )
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [price, setPrice] = useState('7.00')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [updateMiniPrices, setUpdateMiniPrices] = useState(true)

  const [bundles, setBundles] = useState<BundlePricing[]>([])

  const parsedPrice = Number(price)
  const isValidPrice = Number.isFinite(parsedPrice) && parsedPrice > 0
  const miniPreviewLabel = isValidPrice
    ? formatUSDFromCents(defaultMiniPriceInUSD(Math.round(parsedPrice * 100)))
    : null

  useEffect(() => {
    let active = true
    const query = new URLSearchParams({
      depth: '0',
      draft: 'false',
      limit: '100',
      'where[menuBehavior][equals]': 'batchBuilder',
    })

    fetch(`/api/products?${query.toString()}`, { credentials: 'include' })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Bundle pricing could not be checked.')
        }

        return response.json()
      })
      .then((data: unknown) => {
        if (!active) {
          return
        }

        const result = parseBundlePricingResponse(data)
        setBundles(result.bundles)
        setBundleCheckState(result.complete ? 'ready' : 'unavailable')
      })
      .catch(() => {
        if (active) {
          setBundleCheckState('unavailable')
        }
      })

    return () => {
      active = false
    }
  }, [])

  // Bundles that would stop being a deal at the entered price (no per-cookie
  // savings versus buying that many singles).
  const bundleWarnings = useMemo(() => {
    if (!isValidPrice || bundles.length === 0) {
      return []
    }
    return getBundlePricingWarnings({
      bundles,
      largePriceInCents: Math.round(parsedPrice * 100),
      updateMiniPrices,
    })
  }, [bundles, isValidPrice, parsedPrice, updateMiniPrices])

  const updateCookiePrices = useCallback(async () => {
    setError(null)
    setIsSubmitting(true)
    setSuccessMessage(null)

    try {
      const response = await fetch('/next/admin-cookie-prices', {
        body: JSON.stringify({ priceInUSD: parsedPrice, updateMiniPrices }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      const contentType = response.headers.get('content-type') || ''
      const body = contentType.includes('application/json')
        ? ((await response.json()) as BulkCookiePriceResponse)
        : await response.text()

      if (!response.ok) {
        const message =
          typeof body === 'string'
            ? body
            : body.error || 'An error occurred while updating cookie prices.'

        setError(message)
        toast.error(message)
        return
      }

      const message =
        typeof body === 'string' ? 'Cookie prices updated.' : formatSuccessMessage(body)

      setSuccessMessage(message)
      toast.success(message)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred while updating prices.'

      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }, [parsedPrice, updateMiniPrices])

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!isValidPrice) {
        const message = 'Enter a price greater than 0.'
        setError(message)
        setSuccessMessage(null)
        toast.error(message)
        return
      }

      if (isSubmitting) {
        toast.info('Cookie price update already in progress.')
        return
      }

      openModal(CONFIRM_PRICE_UPDATE_MODAL)
    },
    [isSubmitting, isValidPrice, openModal],
  )

  const statusMessage =
    error ||
    successMessage ||
    'Updates every product in the Cookies category. Cookie trays and catering items stay unchanged.'

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label} htmlFor="bulk-cookie-price">
        Cookie price
      </label>
      <div className={styles.controls}>
        <div className={styles.priceField}>
          <span className={styles.currency}>$</span>
          <input
            className={styles.input}
            disabled={isSubmitting}
            id="bulk-cookie-price"
            inputMode="decimal"
            min="0.01"
            onChange={(event) => setPrice(event.target.value)}
            step="0.01"
            type="number"
            value={price}
          />
        </div>
        <BakeryPressable
          className={styles.button}
          disabled={isSubmitting || !isValidPrice}
          type="submit"
        >
          {isSubmitting ? 'Updating...' : 'Set all cookies'}
        </BakeryPressable>
      </div>
      <label className={styles.checkboxRow} htmlFor="bulk-cookie-mini-prices">
        <input
          checked={updateMiniPrices}
          className={styles.checkbox}
          disabled={isSubmitting}
          id="bulk-cookie-mini-prices"
          onChange={(event) => setUpdateMiniPrices(event.target.checked)}
          type="checkbox"
        />
        <span>
          Also set every mini price to {MINI_PERCENT_LABEL} of the new price
          {updateMiniPrices && miniPreviewLabel ? ` (${miniPreviewLabel})` : ''}
        </span>
      </label>
      {bundleWarnings.length > 0 ? (
        <div className={styles.warning} role="status">
          <p className={styles.warningTitle}>⚠️ Bundle prices are set separately</p>
          {bundleWarnings.map((warning) => (
            <p className={styles.warningItem} key={warning}>
              {warning}
            </p>
          ))}
          <p className={styles.warningItem}>
            Open each bundle/tray product to lower its price if you want it to stay a deal.
          </p>
        </div>
      ) : null}
      {bundleCheckState === 'unavailable' ? (
        <div className={styles.warning} role="status">
          <p className={styles.warningTitle}>Bundle price check unavailable</p>
          <p className={styles.warningItem}>
            Review tray and bundle prices separately before applying this change.
          </p>
        </div>
      ) : null}
      <p
        className={[
          styles.message,
          error ? styles.error : null,
          successMessage ? styles.success : null,
          messageClassName,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {statusMessage}
      </p>
      <ConfirmationModal
        body={
          <div className={styles.confirmationBody}>
            <p>
              Every cookie product will be set to{' '}
              {formatUSDFromCents(Math.round(parsedPrice * 100))}.
            </p>
            <p>
              {updateMiniPrices && miniPreviewLabel
                ? `Every mini cookie will also be set to ${miniPreviewLabel}.`
                : 'Mini cookie prices will stay unchanged.'}
            </p>
            {bundleWarnings.length > 0 ? (
              <div className={styles.confirmationWarning}>
                <p>Review these bundle prices before continuing:</p>
                <ul>
                  {bundleWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {bundleCheckState !== 'ready' ? (
              <p className={styles.confirmationWarning}>
                Bundle prices have not been verified. Review them separately after this update.
              </p>
            ) : null}
          </div>
        }
        confirmLabel="Set all cookie prices"
        confirmingLabel="Updating cookie prices"
        heading="Set every cookie price?"
        modalSlug={CONFIRM_PRICE_UPDATE_MODAL}
        onConfirm={updateCookiePrices}
      />
    </form>
  )
}
