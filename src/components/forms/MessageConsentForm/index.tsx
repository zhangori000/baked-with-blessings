'use client'

import type { CollectionAuthUser } from '@/access/utilities'

import { FormError } from '@/components/forms/FormError'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import { bakeryTextsDisclosure } from '@/utilities/messageConsent'
import { privacyHref, termsHref } from '@/utilities/routes'
import Link from 'next/link'
import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'

type StorefrontCustomer = CollectionAuthUser & {
  email?: null | string
  emailOk?: boolean | null
  id: number | string
  phone?: null | string
  smsOk?: boolean | null
}

export const MessageConsentForm: React.FC<{ showTexts: boolean }> = ({ showTexts }) => {
  const { setUser, user } = useAuth()
  const customer = user as StorefrontCustomer | null | undefined
  const [error, setError] = useState<null | string>(null)
  const [saving, setSaving] = useState(false)
  const [pending, setPending] = useState<{ channel: 'email' | 'sms'; ok: boolean } | null>(null)
  const smsOk = pending?.channel === 'sms' ? pending.ok : Boolean(customer?.smsOk)
  const emailOk = pending?.channel === 'email' ? pending.ok : Boolean(customer?.emailOk)

  const saveChannel = useCallback(
    async (channel: 'email' | 'sms', ok: boolean) => {
      if (!customer?.id) {
        return
      }

      setSaving(true)
      setError(null)
      setPending({ channel, ok })

      const response = await fetch('/api/customer-auth/message-consent', {
        body: JSON.stringify({ channel, ok }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const json = (await response.json()) as { doc?: StorefrontCustomer; error?: string }

      setSaving(false)

      if (!response.ok) {
        setPending(null)
        setError(json.error || 'There was a problem saving bakery updates.')
        return
      }

      if (json.doc) {
        setUser(json.doc)
      }

      setPending(null)

      toast.success('Bakery updates saved.')
    },
    [customer?.id, setUser],
  )

  return (
    <div className="accountSettingsForm">
      <p className="accountSettingsFormIntro">
        {showTexts
          ? 'Texts wait for a yes from you. Emails start on when you create an account. Order receipts and login codes still arrive if you turn these off.'
          : 'Emails start on when you create an account with an email. Order receipts and login codes still arrive if you turn them off.'}
      </p>

      <div className="accountSettingsFields">
        {showTexts ? (
          <>
            <div className="accountSettingsConsentRow">
              <Checkbox
                checked={smsOk}
                disabled={saving || !customer?.phone}
                id="smsOk"
                onCheckedChange={(checked) => {
                  void saveChannel('sms', checked === true)
                }}
              />
              <Label className="accountSettingsConsentLabel" htmlFor="smsOk">
                Text me when you drop a flavor or post a market date
              </Label>
            </div>
            {!customer?.phone ? (
              <p className="accountSettingsConsentHint">
                Add a verified phone to your account first.
              </p>
            ) : (
              <p className="accountSettingsConsentHint">
                Recurring marketing texts from Baked with Blessings. Consent is not a condition of
                purchase. {bakeryTextsDisclosure} See our <Link href={termsHref}>Terms</Link> and{' '}
                <Link href={privacyHref}>Privacy Policy</Link>.
              </p>
            )}
          </>
        ) : null}

        <div className="accountSettingsConsentRow">
          <Checkbox
            checked={emailOk}
            disabled={saving || !customer?.email}
            id="emailOk"
            onCheckedChange={(checked) => {
              void saveChannel('email', checked === true)
            }}
          />
          <Label className="accountSettingsConsentLabel" htmlFor="emailOk">
            Email me flavor drops, market dates, and announcements
          </Label>
        </div>
        {!customer?.email ? (
          <p className="accountSettingsConsentHint">Add an email address to your account first.</p>
        ) : null}
      </div>

      {error ? <FormError message={error} /> : null}

      <p className="accountSettingsConsentHint">
        {showTexts
          ? 'You can also reply Y, N, or STOP to bakery texts. Emails include an unsubscribe link.'
          : 'Every bakery email includes an unsubscribe link.'}
      </p>
    </div>
  )
}
