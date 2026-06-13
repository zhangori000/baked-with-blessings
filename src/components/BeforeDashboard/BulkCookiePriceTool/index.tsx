'use client'

import React, { type FormEvent, useCallback, useState } from 'react'
import { toast } from '@payloadcms/ui'

import { BakeryPressable } from '@/design-system/bakery'
import { defaultMiniPriceInUSD, MINI_PRICE_RATIO } from '@/features/products/sizeVariants'

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

export const BulkCookiePriceTool: React.FC<BulkCookiePriceToolProps> = ({
  messageClassName,
}) => {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [price, setPrice] = useState('7.00')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [updateMiniPrices, setUpdateMiniPrices] = useState(true)

  const parsedPrice = Number(price)
  const isValidPrice = Number.isFinite(parsedPrice) && parsedPrice > 0
  const miniPreviewLabel = isValidPrice
    ? formatUSDFromCents(defaultMiniPriceInUSD(Math.round(parsedPrice * 100)))
    : null

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
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
          typeof body === 'string'
            ? 'Cookie prices updated.'
            : formatSuccessMessage(body)

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
    },
    [isSubmitting, isValidPrice, parsedPrice, updateMiniPrices],
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
    </form>
  )
}
