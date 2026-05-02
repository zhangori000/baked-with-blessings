'use client'

import './NewOrderNotePrompt.css'
import { communityHref } from '@/utilities/routes'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { StickyNote, X } from 'lucide-react'

type Props = {
  orderId: number | string
  alreadyPosted: boolean
}

export function NewOrderNotePrompt({ orderId, alreadyPosted }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const justOrdered = searchParams.get('justOrdered') === '1'

  const [isOpen, setIsOpen] = useState<boolean>(justOrdered && !alreadyPosted)

  useEffect(() => {
    setIsOpen(justOrdered && !alreadyPosted)
  }, [justOrdered, alreadyPosted])

  const dismiss = useCallback(() => {
    setIsOpen(false)
    const next = new URLSearchParams(searchParams.toString())
    next.delete('justOrdered')
    const query = next.toString()
    router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false })
  }, [pathname, router, searchParams])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dismiss, isOpen])

  if (!isOpen) return null

  return (
    <div
      aria-labelledby="new-order-note-prompt-title"
      aria-modal="true"
      className="newOrderNotePromptOverlay"
      onClick={dismiss}
      role="dialog"
    >
      <div
        className="newOrderNotePromptCard"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          aria-label="Close"
          className="newOrderNotePromptClose"
          onClick={dismiss}
          type="button"
        >
          <X aria-hidden="true" />
        </button>

        <span aria-hidden="true" className="newOrderNotePromptIcon">
          <StickyNote />
        </span>

        <h2 className="newOrderNotePromptTitle" id="new-order-note-prompt-title">
          Want to leave a note for the world?
        </h2>
        <p className="newOrderNotePromptBody">
          Pin a tiny letter to the Community Post-it Wall — what you got, what you were
          thinking, anything at all. You can stay anonymous, and it&apos;s one note per order.
        </p>

        <div className="newOrderNotePromptActions">
          <button
            className="newOrderNotePromptSecondary"
            onClick={dismiss}
            type="button"
          >
            Maybe later
          </button>
          <Link
            className="newOrderNotePromptPrimary"
            href={`${communityHref}?fromOrder=${orderId}`}
          >
            Yes, write one
          </Link>
        </div>
      </div>
    </div>
  )
}
