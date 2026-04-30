'use client'

import {
  menuHeroMobileMeadowByScene,
  menuHeroMobileSkyByScene,
} from '@/components/scenery/menuHeroScenery'
import { usePersistentMenuSceneTone } from '@/components/scenery/usePersistentMenuSceneTone'
import { BakeryAction, BakeryPressable, useBakeryAnnouncer } from '@/design-system/bakery'
import { cn } from '@/utilities/cn'
import { ExternalLink, Instagram, Linkedin, Mail, MailCheck, Send, Trash2, X } from 'lucide-react'
import React, { useRef, useState } from 'react'

import {
  DecorativeSceneImage,
  meadowByScenery,
  mobileSkyByScenery,
  skyByScenery,
} from '../menu/_components/catering-menu-scenery'
import type { MenuSceneryTone } from '../menu/_components/catering-menu-types'

type ContactMode = 'cards' | 'form' | 'sent'

type ContactEnvelopeFormProps = {
  initialSceneryTone?: MenuSceneryTone
}

type ContactFormValues = {
  company: string
  email: string
  message: string
  name: string
  phone: string
  subject: string
}

const emptyFormValues: ContactFormValues = {
  company: '',
  email: '',
  message: '',
  name: '',
  phone: '',
  subject: '',
}

const instagramHref = 'https://www.instagram.com/_bakedwithblessings/'

function TikTokIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M14.75 3c.45 2.34 1.8 4 4.25 4.33v2.74c-1.7.05-3.17-.44-4.49-1.35v5.89c0 3.55-2.08 6.39-6.21 6.39A5.8 5.8 0 0 1 2.5 15.2c0-3.12 2.3-5.83 5.95-5.83.57 0 1.02.05 1.48.2v2.96a3.42 3.42 0 0 0-1.4-.28c-1.67 0-2.92 1.18-2.92 2.82 0 1.77 1.1 3.02 2.77 3.02 2.03 0 2.88-1.35 2.88-3.29V3h3.49Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function ContactEnvelopeForm({ initialSceneryTone = 'classic' }: ContactEnvelopeFormProps) {
  const { announce } = useBakeryAnnouncer()
  const [sceneryTone] = usePersistentMenuSceneTone(initialSceneryTone)
  const firstFieldRef = useRef<HTMLInputElement | null>(null)
  const [mode, setMode] = useState<ContactMode>('cards')
  const [formValues, setFormValues] = useState<ContactFormValues>(emptyFormValues)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<null | string>(null)

  const skySrc = skyByScenery[sceneryTone] ?? skyByScenery.classic
  const mobileSkySrc = mobileSkyByScenery[sceneryTone] ?? menuHeroMobileSkyByScene[sceneryTone]
  const meadowSrc = meadowByScenery[sceneryTone] ?? meadowByScenery.classic
  const mobileMeadowSrc = menuHeroMobileMeadowByScene[sceneryTone]
  const hasDraft = Object.entries(formValues).some(
    ([field, value]) => field !== 'company' && value.trim().length > 0,
  )

  const openForm = () => {
    setSubmitError(null)
    setMode('form')
    window.setTimeout(() => firstFieldRef.current?.focus(), 0)
    announce(hasDraft ? 'Saved contact draft opened.' : 'Contact form opened.')
  }

  const closeForm = () => {
    if (isSubmitting) return

    setSubmitError(null)
    setMode('cards')
    announce('Contact form closed. Draft saved.')
  }

  const resetForm = () => {
    if (isSubmitting) return

    setFormValues(emptyFormValues)
    setSubmitError(null)
    announce('Contact draft reset.')
    window.setTimeout(() => firstFieldRef.current?.focus(), 0)
  }

  const writeAnother = () => {
    setFormValues(emptyFormValues)
    setSubmitError(null)
    setMode('form')
    window.setTimeout(() => firstFieldRef.current?.focus(), 0)
    announce('New contact form opened.')
  }

  const closeSuccess = () => {
    setSubmitError(null)
    setMode('cards')
    announce('Message confirmation closed.')
  }

  const handleFieldChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.currentTarget

    if (!(name in emptyFormValues)) return

    setFormValues((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) return

    const name = formValues.name.trim()
    const email = formValues.email.trim()
    const phone = formValues.phone.trim()
    const message = formValues.message.trim()

    setSubmitError(null)

    if (!name) {
      setSubmitError('Enter your name.')
      return
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSubmitError('Enter a valid email address.')
      return
    }

    if (!email && !phone) {
      setSubmitError('Enter an email address or phone number.')
      return
    }

    if (!message) {
      setSubmitError('Write a message before sending.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        body: JSON.stringify({
          company: formValues.company.trim(),
          email,
          message,
          name,
          phone,
          subject: formValues.subject.trim(),
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      const result = (await response.json().catch(() => null)) as {
        error?: string
        success?: boolean
      } | null

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Unable to send this message.')
      }

      setFormValues(emptyFormValues)
      setMode('sent')
      announce('Message sent.')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to send this message.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section aria-label="Contact options" className="contactEnvelopeShell" data-state={mode}>
      <div
        className={cn('contactEnvelopeStage', `cateringScene-${sceneryTone}`)}
        data-scene={sceneryTone}
        data-state={mode}
      >
        <DecorativeSceneImage
          className="contactStageSky"
          fit="cover"
          mobileSrc={mobileSkySrc}
          sizes="100vw"
          src={skySrc}
        />
        <DecorativeSceneImage
          className="contactStageMeadow"
          fit="cover"
          mobileSrc={mobileMeadowSrc}
          sizes="100vw"
          src={meadowSrc}
        />
        <div aria-hidden="true" className="contactStageTint" />

        {mode === 'cards' ? (
          <div className="contactSceneCardGrid" aria-label="Contact options">
            <a
              className="contactOptionCard contactOptionCard-instagram"
              href={instagramHref}
              rel="noreferrer"
              target="_blank"
            >
              <span className="contactOptionIcon" aria-hidden="true">
                <Instagram size={22} />
              </span>
              <span className="contactOptionCopy">
                <span className="contactOptionLabel">Instagram</span>
                <span className="contactOptionMeta">@_bakedwithblessings</span>
              </span>
              <span className="contactOptionAction" aria-hidden="true">
                <ExternalLink size={15} />
              </span>
            </a>

            <a
              className="contactOptionCard contactOptionCard-tiktok"
              href="https://www.tiktok.com/"
              rel="noreferrer"
              target="_blank"
            >
              <span className="contactOptionIcon" aria-hidden="true">
                <TikTokIcon className="contactOptionSvgIcon" />
              </span>
              <span className="contactOptionCopy">
                <span className="contactOptionLabel">TikTok</span>
                <span className="contactOptionMeta">Short updates</span>
              </span>
              <span className="contactOptionAction" aria-hidden="true">
                <ExternalLink size={15} />
              </span>
            </a>

            <a
              className="contactOptionCard contactOptionCard-linkedin"
              href="https://www.linkedin.com/"
              rel="noreferrer"
              target="_blank"
            >
              <span className="contactOptionIcon" aria-hidden="true">
                <Linkedin size={22} />
              </span>
              <span className="contactOptionCopy">
                <span className="contactOptionLabel">LinkedIn</span>
                <span className="contactOptionMeta">Business updates</span>
              </span>
              <span className="contactOptionAction" aria-hidden="true">
                <ExternalLink size={15} />
              </span>
            </a>

            <BakeryPressable
              className="contactOptionCard contactOptionCard-mailbox"
              disabled={isSubmitting}
              onClick={openForm}
              type="button"
            >
              <span className="contactOptionIcon" aria-hidden="true">
                <Mail size={22} />
              </span>
              <span className="contactOptionCopy">
                <span className="contactOptionLabel">Mailbox</span>
                <span className="contactOptionMeta">
                  {hasDraft ? 'Continue draft' : 'Write a note'}
                </span>
              </span>
              <span className="contactOptionAction" aria-hidden="true">
                <MailCheck size={15} />
              </span>
            </BakeryPressable>
          </div>
        ) : null}

        {mode === 'form' ? (
          <form
            aria-busy={isSubmitting}
            className="contactPaper contactPaperSceneForm"
            id="contact-paper-form"
            onSubmit={handleSubmit}
          >
            <input
              aria-hidden="true"
              autoComplete="off"
              className="contactHoneypot"
              name="company"
              onChange={handleFieldChange}
              tabIndex={-1}
              type="text"
              value={formValues.company}
            />

            <header className="contactPaperHeader">
              <div>
                <span className="contactPaperEyebrow">Owner inbox</span>
                <h4>Write a message</h4>
              </div>
              <div className="contactPaperTools">
                <BakeryPressable
                  aria-label="Reset draft"
                  className="contactDraftResetButton"
                  disabled={isSubmitting || !hasDraft}
                  onClick={resetForm}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={15} />
                  <span>Reset</span>
                </BakeryPressable>
                <BakeryPressable
                  aria-label="Close contact form and save draft"
                  className="contactIconButton"
                  disabled={isSubmitting}
                  onClick={closeForm}
                  type="button"
                >
                  <X aria-hidden="true" size={19} />
                </BakeryPressable>
              </div>
            </header>

            <div className="contactFieldGrid">
              <label className="contactField">
                <span>Name</span>
                <input
                  autoComplete="name"
                  className="contactInput"
                  disabled={isSubmitting}
                  name="name"
                  onChange={handleFieldChange}
                  placeholder="Your name"
                  ref={firstFieldRef}
                  type="text"
                  value={formValues.name}
                />
              </label>

              <label className="contactField">
                <span>
                  Email <em>or phone</em>
                </span>
                <input
                  autoComplete="email"
                  className="contactInput"
                  disabled={isSubmitting}
                  name="email"
                  onChange={handleFieldChange}
                  placeholder="you@example.com"
                  type="email"
                  value={formValues.email}
                />
              </label>
            </div>

            <div className="contactFieldGrid">
              <label className="contactField">
                <span>
                  Phone <em>or email</em>
                </span>
                <input
                  autoComplete="tel"
                  className="contactInput"
                  disabled={isSubmitting}
                  inputMode="tel"
                  name="phone"
                  onChange={handleFieldChange}
                  placeholder="(312) 555-1212"
                  type="tel"
                  value={formValues.phone}
                />
              </label>

              <label className="contactField">
                <span>
                  Subject <em>optional</em>
                </span>
                <input
                  className="contactInput"
                  disabled={isSubmitting}
                  name="subject"
                  onChange={handleFieldChange}
                  placeholder="Custom order, pickup, event..."
                  type="text"
                  value={formValues.subject}
                />
              </label>
            </div>

            <label className="contactField contactMessageField">
              <span>Message</span>
              <textarea
                className="contactTextarea"
                disabled={isSubmitting}
                name="message"
                onChange={handleFieldChange}
                placeholder="Write the note here."
                rows={7}
                value={formValues.message}
              />
            </label>

            <footer className="contactPaperFooter">
              <p className={cn('contactFormStatus', submitError && 'is-error')} role="status">
                {submitError || 'Add either an email or phone number so the bakery can reply.'}
              </p>
              <BakeryAction
                className="contactSendButton"
                disabled={isSubmitting}
                loading={isSubmitting}
                start={<Send aria-hidden="true" size={16} />}
                type="submit"
                variant="primary"
              >
                {isSubmitting ? 'Sending' : 'Send message'}
              </BakeryAction>
            </footer>
          </form>
        ) : null}

        {mode === 'sent' ? (
          <div className="contactSuccess contactSuccessScene" role="status">
            <span className="contactSuccessIcon" aria-hidden="true">
              <MailCheck size={25} />
            </span>
            <div>
              <h4>Message sent.</h4>
              <p>Delivered to the owner inbox.</p>
            </div>
            <div className="contactSuccessActions">
              <BakeryAction
                className="contactResetButton"
                onClick={writeAnother}
                start={<Mail aria-hidden="true" size={15} />}
                type="button"
                variant="secondary"
              >
                Write another
              </BakeryAction>
              <BakeryPressable
                aria-label="Close sent confirmation"
                className="contactSuccessClose"
                onClick={closeSuccess}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </BakeryPressable>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
