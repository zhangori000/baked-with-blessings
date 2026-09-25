'use client'

import { ConfirmationModal, Link, toast, useModal } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import React, { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { BakeryPressable } from '@/design-system/bakery'
import {
  BAKERY_UPDATE_MARKET_LIMITS,
  BAKERY_UPDATE_MESSAGE_MAX,
  BAKERY_UPDATE_SUBJECT_MAX,
  type BakeryUpdateDraft,
  type BakeryUpdateMarket,
  type BakeryUpdateTemplate,
  bakeryUpdateSmsDetails,
  buildBakeryUpdateSms,
  emptyBakeryUpdateMarket,
  isBakeryUpdateTemplate,
  measureSms,
  validateBakeryUpdateDraft,
} from '@/features/bakery-updates/content'
import {
  type BakeryUpdateEmailFeature,
  buildBakeryUpdateEmail,
} from '@/features/bakery-updates/email'
import type {
  BakeryUpdateProduct,
  BakeryUpdateProgress,
  BakeryUpdatesOverview,
} from '@/features/bakery-updates/service'

import { EmailPreviewFrame } from './EmailPreviewFrame'
import styles from './index.module.css'

const CONFIRM_SEND_MODAL = 'confirm-bakery-update-send'
const DRAFT_STORAGE_KEY = 'bwb-bakery-update-draft'
const ENDPOINT = '/next/admin-bakery-updates'

type StoredDraft = BakeryUpdateDraft & {
  market: BakeryUpdateMarket
  productID: null | number
  requestKey: string
  template: BakeryUpdateTemplate
}

const templateOptions: Array<{
  hint: string
  messagePlaceholder: string
  subjectPlaceholder: string
  title: string
  value: BakeryUpdateTemplate
}> = [
  {
    hint: 'Your words with the bakery logo.',
    messagePlaceholder:
      'New flavor this week, and we will be at the farmers market Saturday 9 to 1.',
    subjectPlaceholder: 'Lemon cookies are back this Saturday',
    title: 'Just a note',
    value: 'note',
  },
  {
    hint: 'A cookie photo and name above your words.',
    messagePlaceholder:
      'Brown butter, toasted pecans, and a little sea salt. Baked fresh this weekend only.',
    subjectPlaceholder: 'Meet our newest cookie',
    title: 'New flavor',
    value: 'flavor',
  },
  {
    hint: 'A date card with where and when, plus directions.',
    messagePlaceholder: 'Come say hi! We will bring lemon, chocolate chip, and a surprise flavor.',
    subjectPlaceholder: 'Find us at the market this Saturday',
    title: 'Market date',
    value: 'market',
  },
]

const readStoredMarket = (value: unknown): BakeryUpdateMarket => {
  const market = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const read = (key: keyof BakeryUpdateMarket) =>
    typeof market[key] === 'string' ? (market[key] as string) : ''

  return {
    address: read('address'),
    date: read('date'),
    hours: read('hours'),
    place: read('place'),
  }
}

const toEmailFeature = (
  draft: Pick<StoredDraft, 'market' | 'productID' | 'template'>,
  products: BakeryUpdateProduct[],
): BakeryUpdateEmailFeature | null => {
  if (draft.template === 'market') {
    return { ...draft.market, kind: 'market' }
  }

  const product =
    draft.template === 'flavor' ? products.find(({ id }) => id === draft.productID) : undefined

  return product ? { ...product, kind: 'flavor' } : null
}

type Phase = 'compose' | 'done' | 'paused' | 'sending'

class RequestError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const newRequestKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const people = (count: number) => (count === 1 ? '1 person' : `${count} people`)

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(value))

const postJSON = async <T,>(body: Record<string, unknown>): Promise<T> => {
  let response: Response

  try {
    response = await fetch(ENDPOINT, {
      body: JSON.stringify(body),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
  } catch {
    throw new RequestError('Could not reach the website. Check your internet connection.', 0)
  }

  const data = (await response.json().catch(() => null)) as (T & { error?: string }) | null

  if (!response.ok || !data) {
    throw new RequestError(
      data?.error || 'Something went wrong. Try again in a minute.',
      response.status,
    )
  }

  return data
}

const countProgress = (progress: BakeryUpdateProgress) => {
  const channels = [
    ...(progress.sendText ? [progress.sms] : []),
    ...(progress.sendEmail ? [progress.email] : []),
  ]

  const total = channels.reduce((sum, tally) => sum + tally.total, 0)
  const waiting = channels.reduce((sum, tally) => sum + tally.queued + tally.sending, 0)

  return { finished: total - waiting, total, waiting }
}

const channelSummary = (label: 'emails' | 'texts', tally: BakeryUpdateProgress['sms']) => {
  const parts = [`${tally.sent} sent`]

  if (tally.failed) {
    parts.push(`${tally.failed} did not go through`)
  }

  if (tally.skipped) {
    parts.push(`${tally.skipped} skipped`)
  }

  if (tally.queued + tally.sending) {
    parts.push(`${tally.queued + tally.sending} waiting`)
  }

  return `${label === 'texts' ? 'Texts' : 'Emails'}: ${parts.join(', ')}`
}

const SendResult = ({ progress }: { progress: BakeryUpdateProgress }) => {
  const failed =
    (progress.sendText ? progress.sms.failed : 0) + (progress.sendEmail ? progress.email.failed : 0)
  const skipped =
    (progress.sendText ? progress.sms.skipped : 0) +
    (progress.sendEmail ? progress.email.skipped : 0)

  return (
    <ul className={styles.resultList}>
      {progress.sendText ? <li>{plural(progress.sms.sent, 'text')} sent</li> : null}
      {progress.sendEmail ? <li>{plural(progress.email.sent, 'email')} sent</li> : null}
      {failed ? (
        <li>
          {failed} did not go through. Usually the phone number or email address no longer works.
        </li>
      ) : null}
      {skipped ? (
        <li>{skipped} turned messages off after you pressed Send, so they were skipped.</li>
      ) : null}
    </ul>
  )
}

type BakeryUpdateComposerProps = {
  adminEmail: string
  companyName: string
  overview: BakeryUpdatesOverview
}

export const BakeryUpdateComposer: React.FC<BakeryUpdateComposerProps> = ({
  adminEmail,
  companyName,
  overview,
}) => {
  const { audience, emailLinks, mailingAddress, products, textsReady, updates } = overview
  const emailsReady = Boolean(mailingAddress)
  const router = useRouter()
  const { openModal } = useModal()
  const mounted = useRef(true)

  const emptyDraft = useCallback(
    (): StoredDraft => ({
      market: emptyBakeryUpdateMarket(),
      message: '',
      productID: null,
      requestKey: newRequestKey(),
      sendEmail: true,
      sendText: textsReady,
      subject: '',
      template: 'note',
    }),
    [textsReady],
  )

  const [storedDraft, setDraft] = useState<StoredDraft | null>(null)
  // A saved draft can point at a cookie that was unpublished since.
  const draft = useMemo(
    () =>
      storedDraft?.productID && !products.some(({ id }) => id === storedDraft.productID)
        ? { ...storedDraft, productID: null }
        : storedDraft,
    [products, storedDraft],
  )
  const [error, setError] = useState<null | string>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [phase, setPhase] = useState<Phase>('compose')
  const [progress, setProgress] = useState<BakeryUpdateProgress | null>(null)

  useEffect(() => {
    mounted.current = true

    return () => {
      mounted.current = false
    }
  }, [])

  // The draft lives in this browser so a refresh or a closed tab does not lose
  // it. It keeps its request key until it is sent, so pressing Send twice (or
  // retrying after a dropped connection) can never send it twice.
  useEffect(() => {
    let stored: Partial<StoredDraft> | null = null

    try {
      stored = JSON.parse(window.localStorage.getItem(DRAFT_STORAGE_KEY) || 'null')
    } catch {
      stored = null
    }

    const fresh = emptyDraft()

    setDraft(
      stored && typeof stored.requestKey === 'string'
        ? {
            market: readStoredMarket(stored.market),
            message: typeof stored.message === 'string' ? stored.message : '',
            productID: typeof stored.productID === 'number' ? stored.productID : null,
            requestKey: stored.requestKey,
            sendEmail: stored.sendEmail !== false,
            sendText: textsReady && stored.sendText !== false,
            subject: typeof stored.subject === 'string' ? stored.subject : '',
            template: isBakeryUpdateTemplate(stored.template) ? stored.template : 'note',
          }
        : fresh,
    )
  }, [emptyDraft, textsReady])

  useEffect(() => {
    if (storedDraft) {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(storedDraft))
    }
  }, [storedDraft])

  useEffect(() => {
    if (phase !== 'sending') {
      return
    }

    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }

    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [phase])

  const updateDraft = (changes: Partial<StoredDraft>) =>
    setDraft((current) => (current ? { ...current, ...changes } : current))

  const updateMarket = (changes: Partial<BakeryUpdateMarket>) =>
    setDraft((current) =>
      current ? { ...current, market: { ...current.market, ...changes } } : current,
    )

  const runUntilDone = useCallback(
    async (updateID: number) => {
      setError(null)
      setPhase('sending')

      let failures = 0

      while (mounted.current) {
        try {
          const { progress: next } = await postJSON<{ progress: BakeryUpdateProgress }>({
            action: 'continue',
            updateID,
          })

          failures = 0
          setProgress(next)

          if (next.done) {
            setPhase('done')
            router.refresh()
            return
          }

          // Nothing left to pick up, only messages another open tab is still sending.
          if (next.sms.queued + next.email.queued === 0) {
            await wait(3000)
          }
        } catch (caught) {
          const problem =
            caught instanceof RequestError ? caught : new RequestError('Sending paused.', 0)

          failures += 1

          if (failures >= 3 || (problem.status >= 400 && problem.status < 500)) {
            setError(problem.message)
            setPhase('paused')
            return
          }

          await wait(2000 * failures)
        }
      }
    },
    [router],
  )

  const startSend = useCallback(async () => {
    if (!draft) {
      return
    }

    setError(null)

    try {
      const { progress: started } = await postJSON<{ progress: BakeryUpdateProgress }>({
        action: 'start',
        market: draft.market,
        message: draft.message,
        productID: draft.productID,
        requestKey: draft.requestKey,
        sendEmail: draft.sendEmail,
        sendText: draft.sendText,
        subject: draft.subject,
        template: draft.template,
      })

      setProgress(started)
      setDraft(emptyDraft())
      void runUntilDone(started.id)
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Something went wrong.'
      setError(message)
      toast.error(message)
    }
  }, [draft, emptyDraft, runUntilDone])

  const sendTest = useCallback(async () => {
    if (!draft) {
      return
    }

    setIsTesting(true)

    try {
      const { sentTo } = await postJSON<{ sentTo: string }>({
        action: 'test',
        market: draft.market,
        message: draft.message,
        productID: draft.productID,
        subject: draft.subject,
        template: draft.template,
      })
      toast.success(`Test email sent to ${sentTo}.`)
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'The test email did not send.')
    } finally {
      setIsTesting(false)
    }
  }, [draft])

  const unfinished = updates.find((update) => !update.done && update.id !== progress?.id)

  if (!draft) {
    return <p className={styles.helper}>Loading...</p>
  }

  const recipients = {
    email: draft.sendEmail ? audience.email : 0,
    sms: draft.sendText ? audience.sms : 0,
  }
  const problem =
    validateBakeryUpdateDraft(draft, { emailsReady, textsReady }) ||
    (recipients.email + recipients.sms === 0
      ? 'Nobody has said yes to the messages you picked yet.'
      : null)
  const smsBody = buildBakeryUpdateSms({
    companyName,
    details: bakeryUpdateSmsDetails(draft),
    message: draft.message,
  })
  const smsSize = measureSms(smsBody)
  const templateOption =
    templateOptions.find(({ value }) => value === draft.template) ?? templateOptions[0]
  // Links point nowhere in the preview, so a click cannot leave the admin.
  const emailPreview = buildBakeryUpdateEmail({
    accountURL: '#',
    companyName,
    feature: toEmailFeature(draft, products),
    logoURL: emailLinks.logoURL,
    mailingAddress: mailingAddress ?? '',
    message: draft.message.trim() || 'Your message goes here.',
    siteURL: '#',
    subject: draft.subject.trim() || 'Your subject goes here',
    unsubscribeURL: '#',
  })
  const testProblem = validateBakeryUpdateDraft(
    { ...draft, sendEmail: true, sendText: false },
    { emailsReady, textsReady },
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (problem) {
      toast.error(problem)
      return
    }

    openModal(CONFIRM_SEND_MODAL)
  }

  const sendingCount = progress ? countProgress(progress) : null
  const confirmSummary = `This will ${[
    recipients.sms ? `text ${people(recipients.sms)}` : null,
    recipients.email ? `email ${people(recipients.email)}` : null,
  ]
    .filter(Boolean)
    .join(' and ')}.`

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.backLink} href="/admin" prefetch={false}>
          Back to dashboard
        </Link>
        <h1 className={styles.title}>Send a bakery update</h1>
        <p className={styles.subtitle}>
          Write one message. It goes out as a text to people who said yes to texts, and as an email
          to people who said yes to emails.
        </p>
      </header>

      {phase === 'sending' && progress && sendingCount ? (
        <section aria-live="polite" className={styles.status} role="status">
          <h2 className={styles.statusTitle}>Sending &ldquo;{progress.subject}&rdquo;</h2>
          <progress
            aria-label="Sending progress"
            className={styles.progressBar}
            max={Math.max(sendingCount.total, 1)}
            value={sendingCount.finished}
          />
          <p className={styles.helper}>
            {sendingCount.finished} of {sendingCount.total} done. Keep this page open until it
            finishes. If it closes, come back here and press Finish sending. Nobody gets it twice.
          </p>
        </section>
      ) : null}

      {phase === 'paused' && progress ? (
        <section className={`${styles.status} ${styles.statusWarning}`} role="alert">
          <h2 className={styles.statusTitle}>Sending paused</h2>
          <p className={styles.helper}>{error}</p>
          <p className={styles.helper}>Messages that already went out will not be sent again.</p>
          <div className={styles.actions}>
            <BakeryPressable
              className={styles.button}
              onClick={() => void runUntilDone(progress.id)}
            >
              Keep sending
            </BakeryPressable>
          </div>
        </section>
      ) : null}

      {phase === 'done' && progress ? (
        <section className={`${styles.status} ${styles.statusSuccess}`} role="status">
          <h2 className={styles.statusTitle}>Your update went out</h2>
          <SendResult progress={progress} />
          <div className={styles.actions}>
            <BakeryPressable
              className={styles.button}
              onClick={() => {
                setPhase('compose')
                setProgress(null)
              }}
            >
              Write another update
            </BakeryPressable>
          </div>
        </section>
      ) : null}

      {phase === 'compose' && unfinished ? (
        <section className={`${styles.status} ${styles.statusWarning}`} role="status">
          <h2 className={styles.statusTitle}>
            &ldquo;{unfinished.subject}&rdquo; did not finish sending
          </h2>
          <p className={styles.helper}>
            {countProgress(unfinished).waiting} messages are still waiting. People who already got
            it will not get it again.
          </p>
          <div className={styles.actions}>
            <BakeryPressable
              className={styles.button}
              onClick={() => {
                setProgress(unfinished)
                void runUntilDone(unfinished.id)
              }}
            >
              Finish sending
            </BakeryPressable>
          </div>
        </section>
      ) : null}

      {phase === 'compose' ? (
        <div className={styles.layout}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <fieldset className={styles.fieldset}>
              <legend className={styles.label}>What kind of update?</legend>
              <div className={styles.templateOptions}>
                {templateOptions.map((option) => (
                  <label
                    className={styles.templateOption}
                    htmlFor={`bakery-update-template-${option.value}`}
                    key={option.value}
                  >
                    <input
                      checked={draft.template === option.value}
                      className={styles.checkbox}
                      id={`bakery-update-template-${option.value}`}
                      name="bakery-update-template"
                      onChange={() => updateDraft({ template: option.value })}
                      type="radio"
                      value={option.value}
                    />
                    <span>
                      <span className={styles.optionTitle}>{option.title}</span>
                      <span className={styles.optionHint}>{option.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {draft.template === 'flavor' ? (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="bakery-update-product">
                  Which cookie?
                </label>
                <select
                  className={styles.input}
                  disabled={!products.length}
                  id="bakery-update-product"
                  onChange={(event) =>
                    updateDraft({ productID: Number(event.target.value) || null })
                  }
                  value={draft.productID ?? ''}
                >
                  <option value="">Pick a cookie</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <p className={styles.helper}>
                  {products.length ? (
                    'The email shows its first photo, its name, and its price.'
                  ) : (
                    <>
                      Publish a cookie in <Link href="/admin/collections/products">Products</Link>{' '}
                      first.
                    </>
                  )}
                </p>
              </div>
            ) : null}

            {draft.template === 'market' ? (
              <fieldset className={styles.fieldset}>
                <legend className={styles.label}>Market details</legend>
                <div className={styles.field}>
                  <label className={styles.subLabel} htmlFor="bakery-update-market-place">
                    Market name
                  </label>
                  <input
                    className={styles.input}
                    id="bakery-update-market-place"
                    maxLength={BAKERY_UPDATE_MARKET_LIMITS.place}
                    onChange={(event) => updateMarket({ place: event.target.value })}
                    placeholder="Union Square Greenmarket"
                    type="text"
                    value={draft.market.place}
                  />
                </div>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.subLabel} htmlFor="bakery-update-market-date">
                      Date
                    </label>
                    <input
                      className={styles.input}
                      id="bakery-update-market-date"
                      onChange={(event) => updateMarket({ date: event.target.value })}
                      type="date"
                      value={draft.market.date}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.subLabel} htmlFor="bakery-update-market-hours">
                      Hours (optional)
                    </label>
                    <input
                      className={styles.input}
                      id="bakery-update-market-hours"
                      maxLength={BAKERY_UPDATE_MARKET_LIMITS.hours}
                      onChange={(event) => updateMarket({ hours: event.target.value })}
                      placeholder="9 AM to 1 PM"
                      type="text"
                      value={draft.market.hours}
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.subLabel} htmlFor="bakery-update-market-address">
                    Address (optional)
                  </label>
                  <input
                    className={styles.input}
                    id="bakery-update-market-address"
                    maxLength={BAKERY_UPDATE_MARKET_LIMITS.address}
                    onChange={(event) => updateMarket({ address: event.target.value })}
                    placeholder="E 17th St and Union Square W, New York, NY"
                    type="text"
                    value={draft.market.address}
                  />
                  <p className={styles.helper}>
                    The Get directions button opens Google Maps with the name and address.
                  </p>
                </div>
              </fieldset>
            ) : null}

            <fieldset className={styles.fieldset}>
              <legend className={styles.label}>Send as</legend>
              <label className={styles.checkboxRow} htmlFor="bakery-update-send-text">
                <input
                  checked={draft.sendText}
                  className={styles.checkbox}
                  disabled={!textsReady}
                  id="bakery-update-send-text"
                  onChange={(event) => updateDraft({ sendText: event.target.checked })}
                  type="checkbox"
                />
                <span>
                  <span className={styles.optionTitle}>Text message</span>
                  <span className={styles.optionHint}>
                    {textsReady
                      ? `${people(audience.sms)} said yes to texts.`
                      : 'Texts turn on once the bakery phone number is approved for texting.'}
                  </span>
                </span>
              </label>
              <label className={styles.checkboxRow} htmlFor="bakery-update-send-email">
                <input
                  checked={draft.sendEmail}
                  className={styles.checkbox}
                  id="bakery-update-send-email"
                  onChange={(event) => updateDraft({ sendEmail: event.target.checked })}
                  type="checkbox"
                />
                <span>
                  <span className={styles.optionTitle}>Email</span>
                  <span className={styles.optionHint}>
                    {people(audience.email)} said yes to emails.
                    {emailsReady ? null : (
                      <>
                        {' '}
                        Add the bakery&apos;s mailing address in{' '}
                        <Link href="/admin/globals/store-settings">Store Settings</Link> before
                        sending.
                      </>
                    )}
                  </span>
                </span>
              </label>
            </fieldset>

            {draft.sendEmail ? (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="bakery-update-subject">
                  Email subject
                </label>
                <input
                  className={styles.input}
                  id="bakery-update-subject"
                  maxLength={BAKERY_UPDATE_SUBJECT_MAX}
                  onChange={(event) => updateDraft({ subject: event.target.value })}
                  placeholder={templateOption.subjectPlaceholder}
                  type="text"
                  value={draft.subject}
                />
              </div>
            ) : null}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="bakery-update-message">
                Message
              </label>
              <textarea
                className={styles.textarea}
                id="bakery-update-message"
                maxLength={BAKERY_UPDATE_MESSAGE_MAX}
                onChange={(event) => updateDraft({ message: event.target.value })}
                placeholder={templateOption.messagePlaceholder}
                rows={7}
                value={draft.message}
              />
              <p className={styles.helper}>
                {draft.message.trim().length} of {BAKERY_UPDATE_MESSAGE_MAX} characters.
                {draft.sendText
                  ? ` Sends as ${plural(smsSize.parts, 'text')} per person.${
                      smsSize.encoding === 'unicode'
                        ? ' Emoji and special symbols make each text hold less.'
                        : ''
                    }`
                  : ''}
              </p>
            </div>

            {error ? (
              <p className={`${styles.helper} ${styles.errorText}`} role="alert">
                {error}
              </p>
            ) : null}

            <div className={styles.actions}>
              <BakeryPressable className={styles.button} disabled={Boolean(problem)} type="submit">
                Send update
              </BakeryPressable>
              {draft.sendEmail ? (
                <BakeryPressable
                  className={`${styles.button} ${styles.buttonSecondary}`}
                  disabled={Boolean(testProblem) || isTesting || !adminEmail}
                  onClick={() => void sendTest()}
                >
                  {isTesting ? 'Sending test...' : 'Email me a test'}
                </BakeryPressable>
              ) : null}
            </div>
            <p className={styles.helper}>
              {problem ||
                (draft.sendEmail && adminEmail
                  ? `A test goes only to ${adminEmail}.`
                  : 'Ready to send.')}
            </p>
          </form>

          <aside aria-label="Preview" className={styles.previews}>
            {draft.sendText ? (
              <figure className={styles.preview}>
                <figcaption className={styles.previewLabel}>Text preview</figcaption>
                <p className={styles.smsBubble}>{smsBody}</p>
              </figure>
            ) : null}
            {draft.sendEmail ? (
              <figure className={styles.preview}>
                <figcaption className={styles.previewLabel}>Email preview</figcaption>
                <EmailPreviewFrame html={emailPreview.html} title="Email preview" />
              </figure>
            ) : null}
          </aside>
        </div>
      ) : null}

      {updates.length ? (
        <section aria-labelledby="bakery-update-history" className={styles.history}>
          <h2 className={styles.historyTitle} id="bakery-update-history">
            Past updates
          </h2>
          <ul className={styles.historyList}>
            {updates.map((update) => (
              <li className={styles.historyRow} key={update.id}>
                <div className={styles.historyMain}>
                  <span className={styles.historySubject}>{update.subject}</span>
                  <span className={styles.historyDate}>
                    {formatDate(update.createdAt)}
                    {update.done ? '' : ', still sending'}
                  </span>
                </div>
                <div className={styles.historyCounts}>
                  {update.sendText ? <span>{channelSummary('texts', update.sms)}</span> : null}
                  {update.sendEmail ? <span>{channelSummary('emails', update.email)}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ConfirmationModal
        body={
          <div className={styles.confirmBody}>
            <p>{confirmSummary}</p>
            <p>You cannot unsend it.</p>
          </div>
        }
        confirmLabel="Send now"
        confirmingLabel="Starting"
        heading="Send this update?"
        modalSlug={CONFIRM_SEND_MODAL}
        onConfirm={startSend}
      />
    </div>
  )
}
