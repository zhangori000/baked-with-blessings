'use client'

import { BakeryAction, BakeryCard, BakeryPageShell, BakeryPressable } from '@/design-system/bakery'
import { usePersistentMenuSceneTone } from '@/components/scenery/usePersistentMenuSceneTone'
import type {
  BlessingsNetworkPageData,
  PublicNetworkOwner,
  PublicNetworkOwnerPost,
  PublicNetworkQuestion,
} from '@/features/blessings-network/types'
import {
  BadgeCheck,
  Building2,
  ChevronDown,
  ChevronUp,
  CircleQuestionMark,
  Copy,
  ExternalLink,
  FileText,
  Handshake,
  Linkedin,
  MapPin,
  MessageSquarePlus,
  PenLine,
  Search,
  Send,
  Store,
  Users,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { FormEvent, ReactNode } from 'react'
import { startTransition, useEffect, useMemo, useState, useTransition } from 'react'

import {
  MenuHero,
  menuSceneryTones,
  preloadSceneryAssets,
} from '../menu/_components/catering-menu-scenery'
import type { MenuSceneryTone } from '../menu/_components/catering-menu-types'

type Props = {
  initialData: BlessingsNetworkPageData
  initialSceneryTone?: MenuSceneryTone
}

type NetworkTab = 'questions' | 'insights' | 'owners'

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

const createSubmissionKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const getGoogleMapsSearchUrl = (location: string) => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
}

export function BlessingsNetworkClient({ initialData, initialSceneryTone = 'classic' }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<NetworkTab>('questions')
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null)
  const [replyQuestionId, setReplyQuestionId] = useState<string | null>(null)
  const [answerSubmissionKey, setAnswerSubmissionKey] = useState(createSubmissionKey)
  const [ownerPostSubmissionKey, setOwnerPostSubmissionKey] = useState(createSubmissionKey)
  const [notice, setNotice] = useState<string | null>(null)
  const [collapsedReplyQuestionIds, setCollapsedReplyQuestionIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [isTabHelpOpen, setIsTabHelpOpen] = useState(false)
  const [ownerSearch, setOwnerSearch] = useState('')
  const [ownerTypeFilter, setOwnerTypeFilter] = useState('all')
  const [ownerPostSearch, setOwnerPostSearch] = useState('')
  const [isOwnerPostComposerOpen, setIsOwnerPostComposerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPageRefreshing, startPageRefresh] = useTransition()
  const [heroSceneryTone, setHeroSceneryTone] = usePersistentMenuSceneTone(initialSceneryTone)
  const [isSceneryPickerOpen, setIsSceneryPickerOpen] = useState(false)

  useEffect(() => {
    for (const sceneryTone of menuSceneryTones) {
      preloadSceneryAssets(sceneryTone)
    }
  }, [])

  const ownerById = useMemo(
    () => new Map(initialData.owners.map((owner) => [owner.id, owner])),
    [initialData.owners],
  )
  const questionById = useMemo(
    () => new Map(initialData.questions.map((question) => [question.id, question])),
    [initialData.questions],
  )
  const selectedOwner = selectedOwnerId ? ownerById.get(selectedOwnerId) : null
  const replyQuestion = replyQuestionId ? questionById.get(replyQuestionId) : null
  const ownerTypeOptions = useMemo<string[]>(() => {
    return Array.from(
      new Set(
        initialData.owners
          .map((owner) => owner.businessType)
          .filter((businessType): businessType is string => Boolean(businessType)),
      ),
    ).sort((left, right) => left.localeCompare(right))
  }, [initialData.owners])
  const filteredOwners = useMemo(() => {
    const normalizedSearch = ownerSearch.trim().toLowerCase()

    return initialData.owners.filter((owner) => {
      const matchesType = ownerTypeFilter === 'all' || owner.businessType === ownerTypeFilter
      const searchText = [
        owner.businessName,
        owner.businessType,
        owner.description,
        owner.location,
        owner.ownerName,
        owner.title,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return matchesType && (!normalizedSearch || searchText.includes(normalizedSearch))
    })
  }, [initialData.owners, ownerSearch, ownerTypeFilter])
  const filteredOwnerPosts = useMemo(() => {
    const normalizedSearch = ownerPostSearch.trim().toLowerCase()

    if (!normalizedSearch) return initialData.ownerPosts

    return initialData.ownerPosts.filter((ownerPost) => {
      const searchText = [
        ownerPost.body,
        ownerPost.owner.businessName,
        ownerPost.owner.location,
        ownerPost.owner.ownerName,
        ownerPost.owner.title,
        ownerPost.practicalTakeaway,
        ownerPost.title,
        ownerPost.topic,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchText.includes(normalizedSearch)
    })
  }, [initialData.ownerPosts, ownerPostSearch])

  const handleSelectHeroScenery = (nextSceneryTone: MenuSceneryTone) => {
    if (nextSceneryTone === heroSceneryTone) return

    preloadSceneryAssets(nextSceneryTone)
    startTransition(() => {
      setHeroSceneryTone(nextSceneryTone)
    })
    setIsSceneryPickerOpen(false)
  }

  const openAnswerForm = (questionId: string) => {
    setReplyQuestionId(questionId)
    setIsOwnerPostComposerOpen(false)
    setAnswerSubmissionKey(createSubmissionKey())
    setNotice(null)
  }

  const closeAnswerForm = () => {
    setReplyQuestionId(null)
    setIsSubmitting(false)
  }

  const selectTab = (tab: NetworkTab) => {
    setActiveTab(tab)
    setNotice(null)
  }

  const openOwnerPostComposer = () => {
    setReplyQuestionId(null)
    setIsOwnerPostComposerOpen(true)
    setOwnerPostSubmissionKey(createSubmissionKey())
    setNotice(null)
  }

  const closeOwnerPostComposer = () => {
    setIsOwnerPostComposerOpen(false)
    setIsSubmitting(false)
  }

  const copyLocation = async (location: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      setNotice(`Location: ${location}`)
      return
    }

    try {
      await navigator.clipboard.writeText(location)
      setNotice(`Copied location: ${location}`)
    } catch {
      setNotice(`Location: ${location}`)
    }
  }

  const toggleQuestionReplies = (questionId: string) => {
    setCollapsedReplyQuestionIds((current) => {
      const next = new Set(current)

      if (next.has(questionId)) {
        next.delete(questionId)
      } else {
        next.add(questionId)
      }

      return next
    })
  }

  const submitAnswer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!replyQuestion || isSubmitting) return

    const form = event.currentTarget
    const formData = new FormData(form)
    const input = Object.fromEntries(formData.entries())

    setIsSubmitting(true)
    setNotice(null)

    try {
      const response = await fetch('/api/blessings-network/answers', {
        body: JSON.stringify({
          ...input,
          idempotencyKey: answerSubmissionKey,
          questionId: replyQuestion.id,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': answerSubmissionKey,
        },
        method: 'POST',
      })
      const json = (await response.json()) as { error?: string; success?: boolean }

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Unable to submit reply.')
      }

      form.reset()
      setReplyQuestionId(null)
      setAnswerSubmissionKey(createSubmissionKey())
      setNotice('Reply submitted. It will appear after I read and approve it.')
      startPageRefresh(() => {
        router.refresh()
      })
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to submit reply.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitOwnerPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    const form = event.currentTarget
    const formData = new FormData(form)
    const input = Object.fromEntries(formData.entries())

    setIsSubmitting(true)
    setNotice(null)

    try {
      const response = await fetch('/api/blessings-network/owner-posts', {
        body: JSON.stringify({
          ...input,
          idempotencyKey: ownerPostSubmissionKey,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': ownerPostSubmissionKey,
        },
        method: 'POST',
      })
      const json = (await response.json()) as { error?: string; success?: boolean }

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Unable to submit owner insight.')
      }

      form.reset()
      setIsOwnerPostComposerOpen(false)
      setOwnerPostSubmissionKey(createSubmissionKey())
      setActiveTab('insights')
      setNotice('Owner insight submitted. It will appear after I read and approve it.')
      startPageRefresh(() => {
        router.refresh()
      })
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to submit owner insight.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main
      aria-busy={isSubmitting || isPageRefreshing}
      className="blessingsNetworkPage"
      style={{ fontFamily: 'var(--font-rounded-body)' }}
    >
      <div className="cateringMenuExperience blessingsHeroExperience">
        <MenuHero
          eyebrow="Owner-powered advice"
          isSceneryPickerOpen={isSceneryPickerOpen}
          isSceneChanging={false}
          key={heroSceneryTone}
          onSelectScenery={handleSelectHeroScenery}
          onToggleSceneryPicker={() => setIsSceneryPickerOpen((current) => !current)}
          sceneryTone={heroSceneryTone}
          summary="This page is experimental. Experienced food, cafe, and bakery owners can share practical advice while visitors discover the businesses behind it."
          title="Community Advice"
        />
      </div>

      <BakeryPageShell
        as="section"
        className="blessingsNetworkShell"
        spacing="none"
        tone="transparent"
        width="container"
      >
        <section className="blessingsNetworkStats" aria-label="Community Advice summary">
          <NetworkStat
            icon={<Store aria-hidden="true" className="h-5 w-5" />}
            label="Owner profiles"
            value={initialData.stats.publishedOwnerCount}
          />
          <NetworkStat
            icon={<MessageSquarePlus aria-hidden="true" className="h-5 w-5" />}
            label="Published replies"
            value={initialData.stats.publishedAnswerCount}
          />
          <NetworkStat
            icon={<FileText aria-hidden="true" className="h-5 w-5" />}
            label="Owner insights"
            value={initialData.stats.publishedOwnerPostCount}
          />
          <NetworkStat
            icon={<Handshake aria-hidden="true" className="h-5 w-5" />}
            label="Open questions"
            value={initialData.stats.publishedQuestionCount}
          />
        </section>

        <section
          aria-labelledby="community-advice-workspace-title"
          className="blessingsNetworkWorkspace"
        >
          <div className="blessingsWorkspaceTop">
            <SectionHeader
              eyebrow="Browse advice"
              id="community-advice-workspace-title"
              title="Questions, owner posts, and owner directory"
            >
              Tabs keep long lists contained so readers can jump between advice, standalone owner
              insights, and business profiles.
            </SectionHeader>

            <div className="blessingsTabsBlock">
              <div className="blessingsTabsTitleRow">
                <span>Sections</span>
                <BakeryPressable
                  aria-label="What do these tabs do?"
                  className="blessingsTabHelpButton"
                  onClick={() => setIsTabHelpOpen(true)}
                  type="button"
                >
                  <CircleQuestionMark aria-hidden="true" className="h-5 w-5" />
                </BakeryPressable>
              </div>

              <nav className="blessingsNetworkTabs" aria-label="Community Advice sections">
                <NetworkTabButton
                  activeTab={activeTab}
                  count={initialData.questions.length}
                  icon={<MessageSquarePlus aria-hidden="true" className="h-4 w-4" />}
                  label="Seeking Advice"
                  onSelect={selectTab}
                  tab="questions"
                />
                <NetworkTabButton
                  activeTab={activeTab}
                  count={initialData.ownerPosts.length}
                  icon={<FileText aria-hidden="true" className="h-4 w-4" />}
                  label="Owner Insights"
                  onSelect={selectTab}
                  tab="insights"
                />
                <NetworkTabButton
                  activeTab={activeTab}
                  count={initialData.owners.length}
                  icon={<Users aria-hidden="true" className="h-4 w-4" />}
                  label="Owners"
                  onSelect={selectTab}
                  tab="owners"
                />
              </nav>
            </div>
          </div>

          {activeTab === 'questions' ? (
            <section
              aria-labelledby="network-questions-title"
              className="blessingsQuestionsSection"
            >
              <SectionHeader
                eyebrow="Community advice"
                id="network-questions-title"
                title="Seeking Advice!"
              >
                I want to learn from the community. Here are my questions for owners, operators, and
                people with practical food business experience.
              </SectionHeader>

              <div className="blessingsQuestionList">
                {initialData.questions.map((question) => (
                  <QuestionThread
                    isRepliesCollapsed={collapsedReplyQuestionIds.has(question.id)}
                    key={question.id}
                    onOpenAnswerForm={openAnswerForm}
                    onOpenOwner={setSelectedOwnerId}
                    onToggleReplies={toggleQuestionReplies}
                    question={question}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === 'insights' ? (
            <OwnerInsightsPanel
              onOpenOwner={setSelectedOwnerId}
              ownerPosts={filteredOwnerPosts}
              searchValue={ownerPostSearch}
              setSearchValue={setOwnerPostSearch}
            />
          ) : null}

          {activeTab === 'owners' ? (
            <OwnerDirectoryPanel
              filteredOwners={filteredOwners}
              onCopyLocation={copyLocation}
              onLearnMore={setSelectedOwnerId}
              onOwnerTypeFilterChange={setOwnerTypeFilter}
              onSearchChange={setOwnerSearch}
              ownerSearch={ownerSearch}
              ownerTypeFilter={ownerTypeFilter}
              ownerTypeOptions={ownerTypeOptions}
            />
          ) : null}
        </section>
      </BakeryPageShell>

      {notice ? <p className="blessingsNetworkNotice">{notice}</p> : null}
      {isPageRefreshing ? (
        <p aria-live="polite" className="blessingsNetworkPending">
          Refreshing advice
        </p>
      ) : null}

      <BakeryAction
        className="blessingsComposeButton"
        onClick={openOwnerPostComposer}
        size="lg"
        type="button"
        variant="primary"
      >
        <PenLine aria-hidden="true" className="h-5 w-5" />
        Compose
      </BakeryAction>

      {selectedOwner ? (
        <OwnerModal
          onClose={() => setSelectedOwnerId(null)}
          onCopyLocation={copyLocation}
          owner={selectedOwner}
        />
      ) : null}

      {replyQuestion ? (
        <AnswerModal
          isSubmitting={isSubmitting}
          notice={notice}
          onClose={closeAnswerForm}
          onSubmit={submitAnswer}
          question={replyQuestion}
        />
      ) : null}

      {isOwnerPostComposerOpen ? (
        <OwnerPostModal
          isSubmitting={isSubmitting}
          notice={notice}
          onClose={closeOwnerPostComposer}
          onSubmit={submitOwnerPost}
        />
      ) : null}

      {isTabHelpOpen ? <TabHelpModal onClose={() => setIsTabHelpOpen(false)} /> : null}
    </main>
  )
}

function NetworkStat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <BakeryCard as="article" className="blessingsNetworkStat" radius="sm" spacing="none">
      <span className="blessingsNetworkStatIcon">{icon}</span>
      <span>
        <strong>{value}</strong>
        <span>{label}</span>
      </span>
    </BakeryCard>
  )
}

function SectionHeader({
  children,
  eyebrow,
  id,
  title,
}: {
  children: ReactNode
  eyebrow: string
  id: string
  title: string
}) {
  return (
    <header className="blessingsSectionHeader">
      <p className="blessingsEyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      <p>{children}</p>
    </header>
  )
}

function NetworkTabButton({
  activeTab,
  count,
  icon,
  label,
  onSelect,
  tab,
}: {
  activeTab: NetworkTab
  count: number
  icon: ReactNode
  label: string
  onSelect: (tab: NetworkTab) => void
  tab: NetworkTab
}) {
  const isActive = activeTab === tab

  return (
    <BakeryPressable
      aria-pressed={isActive}
      className="blessingsNetworkTab"
      data-active={isActive}
      onClick={() => onSelect(tab)}
      type="button"
    >
      <span className="blessingsNetworkTabLabel">
        {icon}
        {label}
      </span>
      <span className="blessingsNetworkTabCount">{count}</span>
    </BakeryPressable>
  )
}

function TabHelpModal({ onClose }: { onClose: () => void }) {
  const tabGuides: Array<{ body: string; icon: ReactNode; title: string }> = [
    {
      body: 'My open questions for the community. Owners can reply with practical advice, and replies stay flat so the page is easy to scan.',
      icon: <MessageSquarePlus aria-hidden="true" className="h-4 w-4" />,
      title: 'Seeking Advice',
    },
    {
      body: 'Standalone posts from business owners. These are useful lessons they want to share even when they are not answering one specific question.',
      icon: <FileText aria-hidden="true" className="h-4 w-4" />,
      title: 'Owner Insights',
    },
    {
      body: 'A searchable directory of people who have helped. You can copy their location, open Maps, visit their website, or view their LinkedIn.',
      icon: <Users aria-hidden="true" className="h-4 w-4" />,
      title: 'Owners',
    },
  ]

  return (
    <div
      className="blessingsModalOverlay blessingsTabHelpOverlay"
      onMouseDown={onClose}
      role="presentation"
    >
      <BakeryCard
        aria-labelledby="tab-help-title"
        aria-modal="true"
        className="blessingsTabHelpModal"
        onMouseDown={(event) => event.stopPropagation()}
        radius="md"
        role="dialog"
        spacing="none"
        tone="transparent"
      >
        <BakeryPressable
          aria-label="Close tab guide"
          className="blessingsModalClose"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </BakeryPressable>

        <div className="blessingsTabHelpHeader">
          <span className="blessingsTabHelpIcon" aria-hidden="true">
            <CircleQuestionMark className="h-5 w-5" />
          </span>
          <div>
            <p className="blessingsEyebrow">Quick guide</p>
            <h2 id="tab-help-title">What each tab does</h2>
            <p>Use the tabs to move through the page without scrolling past every section.</p>
          </div>
        </div>

        <div className="blessingsTabHelpList">
          {tabGuides.map((tabGuide) => (
            <article className="blessingsTabHelpItem" key={tabGuide.title}>
              <span className="blessingsTabHelpItemIcon">{tabGuide.icon}</span>
              <div>
                <h3>{tabGuide.title}</h3>
                <p>{tabGuide.body}</p>
              </div>
            </article>
          ))}
        </div>
      </BakeryCard>
    </div>
  )
}

function OwnerInsightsPanel({
  onOpenOwner,
  ownerPosts,
  searchValue,
  setSearchValue,
}: {
  onOpenOwner: (ownerId: string) => void
  ownerPosts: PublicNetworkOwnerPost[]
  searchValue: string
  setSearchValue: (value: string) => void
}) {
  return (
    <section aria-labelledby="owner-insights-title" className="blessingsOwnerPostsSection">
      <div className="blessingsExplorerHeader">
        <SectionHeader
          eyebrow="Owner insights"
          id="owner-insights-title"
          title="Posts written by business owners"
        >
          Standalone posts let owners share useful lessons even when they are not replying to one
          specific question.
        </SectionHeader>

        <div className="blessingsExplorerControls">
          <label className="blessingsSearchControl">
            <span>Search insights</span>
            <span className="blessingsSearchInputWrap">
              <Search aria-hidden="true" className="h-4 w-4" />
              <input
                onChange={(event) => setSearchValue(event.currentTarget.value)}
                placeholder="Topic, owner, location..."
                type="search"
                value={searchValue}
              />
            </span>
          </label>
        </div>
      </div>

      {ownerPosts.length ? (
        <div className="blessingsOwnerPostList">
          {ownerPosts.map((ownerPost) => (
            <OwnerInsightCard key={ownerPost.id} onOpenOwner={onOpenOwner} ownerPost={ownerPost} />
          ))}
        </div>
      ) : (
        <p className="blessingsEmptyState">No owner insights match this search.</p>
      )}
    </section>
  )
}

function OwnerInsightCard({
  onOpenOwner,
  ownerPost,
}: {
  onOpenOwner: (ownerId: string) => void
  ownerPost: PublicNetworkOwnerPost
}) {
  return (
    <BakeryCard as="article" className="blessingsOwnerPostCard" radius="sm" spacing="none">
      <div className="blessingsQuestionMeta">
        {ownerPost.topic ? <span>{ownerPost.topic}</span> : null}
        <span>{formatDate(ownerPost.createdAt)}</span>
      </div>

      <div className="blessingsOwnerPostMain">
        <h3>{ownerPost.title}</h3>
        <p>{ownerPost.body}</p>
      </div>

      {ownerPost.practicalTakeaway ? (
        <p className="blessingsAnswerTakeaway">
          <BadgeCheck aria-hidden="true" className="h-4 w-4" />
          {ownerPost.practicalTakeaway}
        </p>
      ) : null}

      <div className="blessingsOwnerPostByline">
        <BakeryPressable onClick={() => onOpenOwner(ownerPost.owner.id)} type="button">
          <span className="blessingsAnswerAvatar" aria-hidden="true">
            {ownerPost.owner.initials}
          </span>
          <span>
            <strong>{ownerPost.owner.ownerName}</strong>
            <span>
              {ownerPost.owner.title}, {ownerPost.owner.businessName}
            </span>
          </span>
        </BakeryPressable>
      </div>
    </BakeryCard>
  )
}

function OwnerDirectoryPanel({
  filteredOwners,
  onCopyLocation,
  onLearnMore,
  onOwnerTypeFilterChange,
  onSearchChange,
  ownerSearch,
  ownerTypeFilter,
  ownerTypeOptions,
}: {
  filteredOwners: PublicNetworkOwner[]
  onCopyLocation: (location: string) => void
  onLearnMore: (ownerId: string) => void
  onOwnerTypeFilterChange: (value: string) => void
  onSearchChange: (value: string) => void
  ownerSearch: string
  ownerTypeFilter: string
  ownerTypeOptions: string[]
}) {
  return (
    <section aria-labelledby="owner-directory-title" className="blessingsOwnerDirectorySection">
      <div className="blessingsExplorerHeader">
        <SectionHeader
          eyebrow="Owner directory"
          id="owner-directory-title"
          title="Browse business owners without losing the page"
        >
          Search and filter here instead of scrolling through every profile before reaching the
          advice.
        </SectionHeader>

        <div className="blessingsExplorerControls blessingsOwnerDirectoryControls">
          <label className="blessingsSearchControl">
            <span>Search owners</span>
            <span className="blessingsSearchInputWrap">
              <Search aria-hidden="true" className="h-4 w-4" />
              <input
                onChange={(event) => onSearchChange(event.currentTarget.value)}
                placeholder="Name, business, city..."
                type="search"
                value={ownerSearch}
              />
            </span>
          </label>

          <label className="blessingsSelectControl">
            <span>Business type</span>
            <select
              onChange={(event) => onOwnerTypeFilterChange(event.currentTarget.value)}
              value={ownerTypeFilter}
            >
              <option value="all">All types</option>
              {ownerTypeOptions.map((ownerType) => (
                <option key={ownerType} value={ownerType}>
                  {ownerType}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {filteredOwners.length ? (
        <div className="blessingsOwnerDirectory">
          {filteredOwners.map((owner) => (
            <OwnerDirectoryRow
              key={owner.id}
              onCopyLocation={onCopyLocation}
              onLearnMore={onLearnMore}
              owner={owner}
            />
          ))}
        </div>
      ) : (
        <p className="blessingsEmptyState">No owners match these filters.</p>
      )}
    </section>
  )
}

function OwnerDirectoryRow({
  onCopyLocation,
  onLearnMore,
  owner,
}: {
  onCopyLocation: (location: string) => void
  onLearnMore: (ownerId: string) => void
  owner: PublicNetworkOwner
}) {
  return (
    <article className="blessingsOwnerRow">
      <div className="blessingsOwnerRowIdentity">
        <span className="blessingsOwnerAvatar" aria-hidden="true">
          {owner.initials}
        </span>
        <div>
          <p className="blessingsOwnerName">{owner.ownerName}</p>
          <p className="blessingsOwnerTitle">
            {owner.title}, {owner.businessName}
          </p>
        </div>
      </div>

      <div className="blessingsOwnerRowDetails">
        {owner.businessType ? (
          <span className="blessingsOwnerTypePill">{owner.businessType}</span>
        ) : null}
        <OwnerLocationControls location={owner.location} onCopyLocation={onCopyLocation} />
      </div>

      <div className="blessingsOwnerRowActions">
        {owner.websiteUrl ? (
          <a href={owner.websiteUrl} rel="noreferrer" target="_blank">
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
            Website
          </a>
        ) : null}
        {owner.linkedinUrl ? (
          <a href={owner.linkedinUrl} rel="noreferrer" target="_blank">
            <Linkedin aria-hidden="true" className="h-4 w-4" />
            LinkedIn
          </a>
        ) : null}
        <BakeryAction
          onClick={() => onLearnMore(owner.id)}
          size="sm"
          type="button"
          variant="secondary"
        >
          Learn more
        </BakeryAction>
      </div>
    </article>
  )
}

function OwnerLocationControls({
  location,
  onCopyLocation,
}: {
  location: string
  onCopyLocation: (location: string) => void
}) {
  return (
    <div className="blessingsOwnerLocationTools">
      <span className="blessingsOwnerLocationText">
        <MapPin aria-hidden="true" className="h-4 w-4" />
        {location}
      </span>
      <BakeryPressable
        aria-label={`Copy location: ${location}`}
        className="blessingsLocationToolButton"
        onClick={() => onCopyLocation(location)}
        type="button"
      >
        <Copy aria-hidden="true" className="h-4 w-4" />
        Copy
      </BakeryPressable>
      <a
        className="blessingsLocationToolLink"
        href={getGoogleMapsSearchUrl(location)}
        rel="noreferrer"
        target="_blank"
      >
        <ExternalLink aria-hidden="true" className="h-4 w-4" />
        Maps
      </a>
    </div>
  )
}

function QuestionThread({
  isRepliesCollapsed,
  onOpenAnswerForm,
  onOpenOwner,
  onToggleReplies,
  question,
}: {
  isRepliesCollapsed: boolean
  onOpenAnswerForm: (questionId: string) => void
  onOpenOwner: (ownerId: string) => void
  onToggleReplies: (questionId: string) => void
  question: PublicNetworkQuestion
}) {
  const statusLabel = question.questionStatus === 'answered' ? 'answered' : 'seeking advice'
  const answersId = `answers-${question.id}`
  const replyCountLabel = `${question.answers.length} ${
    question.answers.length === 1 ? 'reply' : 'replies'
  }`

  return (
    <article className="blessingsQuestionThread">
      <BakeryCard as="section" className="blessingsQuestionCard" radius="sm" spacing="none">
        <div className="blessingsQuestionMeta">
          {question.category ? <span>{question.category}</span> : null}
          <span>{statusLabel}</span>
          <span>{formatDate(question.createdAt)}</span>
        </div>

        <div className="blessingsQuestionMain">
          <div>
            <h3>{question.title}</h3>
            <p>{question.body}</p>
          </div>
          <div className="blessingsQuestionActions">
            <BakeryAction
              className="blessingsQuestionReplyButton"
              onClick={() => onOpenAnswerForm(question.id)}
              size="sm"
              type="button"
              variant="primary"
            >
              <MessageSquarePlus aria-hidden="true" className="h-4 w-4" />
              Respond
            </BakeryAction>

            {question.answers.length ? (
              <BakeryAction
                aria-controls={answersId}
                aria-expanded={!isRepliesCollapsed}
                className="blessingsQuestionRepliesToggle"
                onClick={() => onToggleReplies(question.id)}
                size="sm"
                type="button"
                variant="secondary"
              >
                {isRepliesCollapsed ? (
                  <ChevronDown aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <ChevronUp aria-hidden="true" className="h-4 w-4" />
                )}
                {isRepliesCollapsed ? `Show ${replyCountLabel}` : `Hide ${replyCountLabel}`}
              </BakeryAction>
            ) : null}
          </div>
        </div>
      </BakeryCard>

      {question.answers.length && !isRepliesCollapsed ? (
        <div
          aria-label={`Replies to ${question.title}`}
          className="blessingsAnswerList"
          id={answersId}
        >
          {question.answers.map((answer) => (
            <article className="blessingsAnswerCard" key={answer.id}>
              <div className="blessingsAnswerOwner">
                <BakeryPressable onClick={() => onOpenOwner(answer.owner.id)} type="button">
                  <span className="blessingsAnswerAvatar" aria-hidden="true">
                    {answer.owner.initials}
                  </span>
                  <span>
                    <strong>{answer.owner.ownerName}</strong>
                    <span>
                      {answer.owner.title}, {answer.owner.businessName}
                    </span>
                  </span>
                </BakeryPressable>
                <span className="blessingsAnswerDate">{formatDate(answer.createdAt)}</span>
              </div>

              <p className="blessingsAnswerBody">{answer.answer}</p>

              {answer.practicalTakeaway ? (
                <p className="blessingsAnswerTakeaway">
                  <BadgeCheck aria-hidden="true" className="h-4 w-4" />
                  {answer.practicalTakeaway}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : question.answers.length ? (
        <p className="blessingsAnswersCollapsed" id={answersId}>
          {replyCountLabel} hidden for easier scanning.
        </p>
      ) : (
        <p className="blessingsNoAnswers">No published replies yet.</p>
      )}
    </article>
  )
}

function OwnerModal({
  onClose,
  onCopyLocation,
  owner,
}: {
  onClose: () => void
  onCopyLocation: (location: string) => void
  owner: PublicNetworkOwner
}) {
  return (
    <div className="blessingsModalOverlay" onMouseDown={onClose} role="presentation">
      <BakeryCard
        aria-labelledby="owner-modal-title"
        aria-modal="true"
        className="blessingsOwnerModal"
        onMouseDown={(event) => event.stopPropagation()}
        radius="md"
        role="dialog"
        spacing="none"
        tone="transparent"
      >
        <BakeryPressable
          aria-label="Close owner profile"
          className="blessingsModalClose"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </BakeryPressable>

        <div className="blessingsOwnerModalHeader">
          <span className="blessingsOwnerModalAvatar" aria-hidden="true">
            {owner.initials}
          </span>
          <div>
            <p className="blessingsEyebrow">Business owner</p>
            <h2 id="owner-modal-title">{owner.businessName}</h2>
            <p>
              {owner.ownerName}, {owner.title}
            </p>
          </div>
        </div>

        <div className="blessingsOwnerModalFacts">
          <OwnerLocationControls location={owner.location} onCopyLocation={onCopyLocation} />
          {owner.businessType ? (
            <span className="blessingsOwnerTypePill">
              <Building2 aria-hidden="true" className="h-4 w-4" />
              {owner.businessType}
            </span>
          ) : null}
        </div>

        <p className="blessingsOwnerModalDescription">{owner.description}</p>
        {owner.bio ? <p className="blessingsOwnerModalBio">{owner.bio}</p> : null}

        <div className="blessingsOwnerModalLinks">
          {owner.websiteUrl ? (
            <BakeryAction
              as="a"
              href={owner.websiteUrl}
              rel="noreferrer"
              size="sm"
              target="_blank"
              variant="primary"
            >
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              Website
            </BakeryAction>
          ) : null}
          {owner.linkedinUrl ? (
            <BakeryAction
              as="a"
              href={owner.linkedinUrl}
              rel="noreferrer"
              size="sm"
              target="_blank"
              variant="secondary"
            >
              <Linkedin aria-hidden="true" className="h-4 w-4" />
              LinkedIn
            </BakeryAction>
          ) : null}
        </div>
      </BakeryCard>
    </div>
  )
}

function AnswerModal({
  isSubmitting,
  notice,
  onClose,
  onSubmit,
  question,
}: {
  isSubmitting: boolean
  notice: string | null
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  question: PublicNetworkQuestion
}) {
  return (
    <div className="blessingsModalOverlay" onMouseDown={onClose} role="presentation">
      <BakeryCard
        aria-labelledby="answer-modal-title"
        aria-modal="true"
        className="blessingsAnswerModal"
        onMouseDown={(event) => event.stopPropagation()}
        radius="md"
        role="dialog"
        spacing="none"
        tone="transparent"
      >
        <BakeryPressable
          aria-label="Close answer form"
          className="blessingsModalClose"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </BakeryPressable>

        <form className="blessingsAnswerForm" data-submitting={isSubmitting} onSubmit={onSubmit}>
          <div className="blessingsAnswerFormHeader">
            <p className="blessingsEyebrow">Share advice</p>
            <h2 id="answer-modal-title">{question.title}</h2>
            <p>Your reply and profile stay private until I read and approve them.</p>
          </div>

          <div className="blessingsFormGrid">
            <label>
              Your name <span>required</span>
              <input name="ownerName" required />
            </label>
            <label>
              Title <span>required</span>
              <input name="title" placeholder="Owner, founder, operator" required />
            </label>
          </div>

          <label>
            Business name <span>required</span>
            <input name="businessName" required />
          </label>

          <div className="blessingsFormGrid">
            <label>
              Business type <span>optional</span>
              <input name="businessType" placeholder="Cafe, bakery, catering..." />
            </label>
            <label>
              Location <span>required</span>
              <input
                name="location"
                placeholder="Copy-pasteable city, state, or address"
                required
              />
            </label>
          </div>

          <div className="blessingsFormGrid">
            <label>
              Website <span>website or LinkedIn</span>
              <input name="websiteUrl" placeholder="https://..." type="url" />
            </label>
            <label>
              LinkedIn <span>website or LinkedIn</span>
              <input name="linkedinUrl" placeholder="https://linkedin.com/..." type="url" />
            </label>
          </div>

          <label>
            What do you sell or serve? <span>required</span>
            <textarea name="description" required rows={3} />
          </label>

          <label>
            Short bio <span>optional</span>
            <textarea name="bio" rows={4} />
          </label>

          <label>
            Your reply <span>required</span>
            <textarea name="answer" required rows={7} />
          </label>

          <label>
            Practical takeaway <span>optional</span>
            <textarea name="practicalTakeaway" rows={3} />
          </label>

          <label>
            Verification email <span>private, optional</span>
            <input name="contactEmail" type="email" />
          </label>

          {notice ? <p className="blessingsFormNotice">{notice}</p> : null}

          <div className="blessingsAnswerFormActions">
            <BakeryAction onClick={onClose} size="sm" type="button" variant="secondary">
              Cancel
            </BakeryAction>
            <BakeryAction disabled={isSubmitting} size="sm" type="submit" variant="primary">
              <Send aria-hidden="true" className="h-4 w-4" />
              {isSubmitting ? 'Submitting' : 'Submit reply'}
            </BakeryAction>
          </div>
        </form>
      </BakeryCard>
    </div>
  )
}

function OwnerPostModal({
  isSubmitting,
  notice,
  onClose,
  onSubmit,
}: {
  isSubmitting: boolean
  notice: string | null
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="blessingsModalOverlay" onMouseDown={onClose} role="presentation">
      <BakeryCard
        aria-labelledby="owner-post-modal-title"
        aria-modal="true"
        className="blessingsAnswerModal blessingsOwnerPostModal"
        onMouseDown={(event) => event.stopPropagation()}
        radius="md"
        role="dialog"
        spacing="none"
        tone="transparent"
      >
        <BakeryPressable
          aria-label="Close owner insight form"
          className="blessingsModalClose"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </BakeryPressable>

        <form
          className="blessingsAnswerForm blessingsOwnerPostForm"
          data-submitting={isSubmitting}
          onSubmit={onSubmit}
        >
          <div className="blessingsAnswerFormHeader">
            <p className="blessingsEyebrow">Owner insight</p>
            <h2 id="owner-post-modal-title">Write a standalone post.</h2>
            <p>Your post and profile stay private until I read and approve them.</p>
          </div>

          <div className="blessingsFormGrid">
            <label>
              Your name <span>required</span>
              <input name="ownerName" required />
            </label>
            <label>
              Title <span>required</span>
              <input name="title" placeholder="Owner, founder, operator" required />
            </label>
          </div>

          <label>
            Business name <span>required</span>
            <input name="businessName" required />
          </label>

          <div className="blessingsFormGrid">
            <label>
              Business type <span>optional</span>
              <input name="businessType" placeholder="Cafe, bakery, catering..." />
            </label>
            <label>
              Location <span>required</span>
              <input
                name="location"
                placeholder="Copy-pasteable city, state, or address"
                required
              />
            </label>
          </div>

          <div className="blessingsFormGrid">
            <label>
              Website <span>website or LinkedIn</span>
              <input name="websiteUrl" placeholder="https://..." type="url" />
            </label>
            <label>
              LinkedIn <span>website or LinkedIn</span>
              <input name="linkedinUrl" placeholder="https://linkedin.com/..." type="url" />
            </label>
          </div>

          <label>
            What do you sell or serve? <span>required</span>
            <textarea name="description" required rows={3} />
          </label>

          <label>
            Short bio <span>optional</span>
            <textarea name="bio" rows={4} />
          </label>

          <div className="blessingsFormGrid">
            <label>
              Post title <span>required</span>
              <input name="postTitle" placeholder="One useful lesson" required />
            </label>
            <label>
              Topic <span>optional</span>
              <input name="topic" placeholder="Leases, equipment, hiring..." />
            </label>
          </div>

          <label>
            Post <span>required</span>
            <textarea name="body" required rows={7} />
          </label>

          <label>
            Practical takeaway <span>optional</span>
            <textarea name="practicalTakeaway" rows={3} />
          </label>

          <label>
            Verification email <span>private, optional</span>
            <input name="contactEmail" type="email" />
          </label>

          {notice ? <p className="blessingsFormNotice">{notice}</p> : null}

          <div className="blessingsAnswerFormActions">
            <BakeryAction onClick={onClose} size="sm" type="button" variant="secondary">
              Cancel
            </BakeryAction>
            <BakeryAction disabled={isSubmitting} size="sm" type="submit" variant="primary">
              <Send aria-hidden="true" className="h-4 w-4" />
              {isSubmitting ? 'Submitting' : 'Submit post'}
            </BakeryAction>
          </div>
        </form>
      </BakeryCard>
    </div>
  )
}
