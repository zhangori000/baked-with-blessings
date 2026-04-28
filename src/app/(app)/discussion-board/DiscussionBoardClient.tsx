'use client'

import {
  discussionSorts,
  edgeLabels,
  type ContentBlock,
  type DiscussionBoardEdge,
  type DiscussionBoardNode,
  type DiscussionEdgeType,
  type DiscussionNodeType,
  type DiscussionSortKey,
  type DiscussionTreeData,
} from '@/features/discussion-graph/types'
import { cn } from '@/utilities/cn'
import { usePersistentMenuSceneTone } from '@/components/scenery/usePersistentMenuSceneTone'
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  CircleHelp,
  CornerDownRight,
  MessageSquarePlus,
  MoveUpRight,
  ShieldQuestion,
  Sparkles,
  ThumbsUp,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { FormEvent, MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import { Fragment, startTransition } from 'react'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'

import {
  MenuHero,
  menuSceneryTones,
  preloadSceneryAssets,
} from '../menu/_components/catering-menu-scenery'
import type { MenuSceneryTone } from '../menu/_components/catering-menu-types'

type Props = {
  initialData: DiscussionTreeData
  initialFocusedNodeId?: string
  initialSceneryTone?: MenuSceneryTone
  initialTopicId?: string
}

const edgeIcons: Record<DiscussionEdgeType, ReactNode> = {
  asks_about: <CircleHelp aria-hidden="true" className="h-3.5 w-3.5" />,
  challenges: <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />,
  related_to: <MoveUpRight aria-hidden="true" className="h-3.5 w-3.5" />,
  responds_to: <CornerDownRight aria-hidden="true" className="h-3.5 w-3.5" />,
  supports: <ThumbsUp aria-hidden="true" className="h-3.5 w-3.5" />,
}

const sortNodes = (nodes: DiscussionBoardNode[], sort: DiscussionSortKey) => {
  return [...nodes].sort((a, b) => {
    if (sort === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }

    if (sort === 'newly_active') {
      return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
    }

    if (sort === 'most_discussed') {
      return b.childCount - a.childCount
    }

    return 0
  })
}

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
}

const getStatLabel = (count: number, label: string) => {
  const plural =
    label === 'reply'
      ? 'replies'
      : label === 'follow-up question'
        ? 'follow-up questions'
        : `${label}s`

  return `${count} ${count === 1 ? label : plural}`
}

const createSubmissionKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const urlPattern = /(https?:\/\/[^\s)]+)/

const getPreviewText = (value: string, maxLength = 132) => {
  const compact = value.replace(/\s+/g, ' ').trim()
  if (compact.length <= maxLength) return compact
  return `${compact.slice(0, maxLength).trim()}...`
}

const renderInlineText = (value: string): ReactNode[] => {
  const parts = value.split(
    /(\[\[(?:conclusion|premise|ref):[\s\S]*?\]\]|\[[^\]]+\]\(https?:\/\/[^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|https?:\/\/[^\s)]+)/g,
  )

  return parts.filter(Boolean).map((part, index) => {
    const markerMatch = part.match(/^\[\[(conclusion|premise|ref):([\s\S]*?)\]\]$/)
    if (markerMatch) {
      const [, type, rawText] = markerMatch
      const text = rawText.trim()

      if (type === 'ref' && urlPattern.test(text)) {
        return (
          <a href={text} key={`${part}-${index}`} rel="noreferrer" target="_blank">
            {text}
          </a>
        )
      }

      return (
        <mark
          className={`discussionInlineMark discussionInlineMark-${type}`}
          key={`${part}-${index}`}
        >
          {text}
        </mark>
      )
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
    }

    const markdownLinkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/)
    if (markdownLinkMatch) {
      return (
        <a href={markdownLinkMatch[2]} key={`${part}-${index}`} rel="noreferrer" target="_blank">
          {markdownLinkMatch[1]}
        </a>
      )
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>
    }

    if (urlPattern.test(part)) {
      return (
        <a href={part} key={`${part}-${index}`} rel="noreferrer" target="_blank">
          {part}
        </a>
      )
    }

    return <Fragment key={`${part}-${index}`}>{part}</Fragment>
  })
}

const closeDetails = (event: ReactMouseEvent<HTMLButtonElement>) => {
  event.currentTarget.closest('details')?.removeAttribute('open')
}

const getVisibleEdgeGroups = (edges: DiscussionBoardEdge[]) => {
  const replyEdges = edges.filter((edge) => edge.type !== 'asks_about')
  const questionEdges = edges.filter((edge) => edge.type === 'asks_about')

  return [
    {
      edgeType: 'responds_to' as DiscussionEdgeType,
      edges: replyEdges,
      title: `Replies (${replyEdges.length})`,
    },
    {
      edgeType: 'asks_about' as DiscussionEdgeType,
      edges: questionEdges,
      title: `Follow-up questions (${questionEdges.length})`,
    },
  ].filter((group) => group.edges.length > 0)
}

export function DiscussionBoardClient({
  initialData,
  initialFocusedNodeId,
  initialSceneryTone = 'classic',
  initialTopicId,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const topicIdFromUrl = searchParams.get('topic') || initialTopicId || null
  const focusedNodeIdFromUrl = searchParams.get('node') || initialFocusedNodeId || null
  const [sort, setSort] = useState<DiscussionSortKey>('newly_active')
  const [depth, setDepth] = useState(4)
  const [selectedRootId, setSelectedRootId] = useState<string | null>(topicIdFromUrl)
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(focusedNodeIdFromUrl)
  const [transitioningRootId, setTransitioningRootId] = useState<string | null>(null)
  const [replyParentId, setReplyParentId] = useState<string | null>(null)
  const [replyEdgeType, setReplyEdgeType] = useState<DiscussionEdgeType>('responds_to')
  const [notice, setNotice] = useState<string | null>(null)
  const [replySubmissionKey, setReplySubmissionKey] = useState(createSubmissionKey)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRoutePending, startRouteRefresh] = useTransition()
  const [isGuideOpen, setIsGuideOpen] = useState(false)
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(() => new Set())
  const [heroSceneryTone, setHeroSceneryTone] = usePersistentMenuSceneTone(initialSceneryTone)
  const [isSceneryPickerOpen, setIsSceneryPickerOpen] = useState(false)
  const didPrepareInitialHistory = useRef(false)

  useEffect(() => {
    for (const sceneryTone of menuSceneryTones) {
      preloadSceneryAssets(sceneryTone)
    }
  }, [])

  const handleSelectHeroScenery = (nextSceneryTone: MenuSceneryTone) => {
    if (nextSceneryTone === heroSceneryTone) return

    preloadSceneryAssets(nextSceneryTone)
    startTransition(() => {
      setHeroSceneryTone(nextSceneryTone)
    })
    setIsSceneryPickerOpen(false)
  }

  useEffect(() => {
    setSelectedRootId(topicIdFromUrl)
    setFocusedNodeId(focusedNodeIdFromUrl)
  }, [focusedNodeIdFromUrl, topicIdFromUrl])

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search)
      setTransitioningRootId(null)
      setSelectedRootId(params.get('topic'))
      setFocusedNodeId(params.get('node'))
    }

    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [])

  useEffect(() => {
    if (didPrepareInitialHistory.current || !topicIdFromUrl) return
    didPrepareInitialHistory.current = true

    const currentState =
      window.history.state && typeof window.history.state === 'object' ? window.history.state : {}

    if (currentState.discussionBoardEntry) return

    const currentUrl = `${window.location.pathname}${window.location.search}`
    window.history.replaceState(
      { ...currentState, discussionBoardEntry: 'list' },
      '',
      '/discussion-board',
    )
    window.history.pushState({ ...currentState, discussionBoardEntry: 'topic' }, '', currentUrl)
  }, [topicIdFromUrl])

  const nodeById = useMemo(() => {
    return new Map(initialData.nodes.map((node) => [node.id, node]))
  }, [initialData.nodes])

  const childEdgesByParent = useMemo(() => {
    const grouped = new Map<string, DiscussionBoardEdge[]>()

    for (const edge of initialData.edges) {
      const current = grouped.get(edge.toNodeId) || []
      current.push(edge)
      grouped.set(edge.toNodeId, current)
    }

    return grouped
  }, [initialData.edges])

  const parentEdgeByChild = useMemo(() => {
    return new Map(initialData.edges.map((edge) => [edge.fromNodeId, edge]))
  }, [initialData.edges])

  const sortedRoots = useMemo(
    () => sortNodes(initialData.rootNodes, sort),
    [initialData.rootNodes, sort],
  )
  const selectedRoot = selectedRootId ? nodeById.get(selectedRootId) : null
  const focusedNode = focusedNodeId ? nodeById.get(focusedNodeId) : null
  const treeRoot = focusedNode || selectedRoot
  const currentParentEdge = treeRoot ? parentEdgeByChild.get(treeRoot.id) : undefined
  const currentParentNode = currentParentEdge ? nodeById.get(currentParentEdge.toNodeId) : undefined

  const trail = useMemo(() => {
    if (!treeRoot) return []

    const reversed: DiscussionBoardNode[] = []
    let cursor: DiscussionBoardNode | undefined = treeRoot

    while (cursor) {
      reversed.push(cursor)
      const parentEdge = parentEdgeByChild.get(cursor.id)
      if (!parentEdge) break
      cursor = nodeById.get(parentEdge.toNodeId)
    }

    return reversed.reverse()
  }, [nodeById, parentEdgeByChild, treeRoot])

  const pushDiscussionUrl = (url: string, entry: 'list' | 'topic' | 'node') => {
    const currentState =
      window.history.state && typeof window.history.state === 'object' ? window.history.state : {}

    window.history.pushState({ ...currentState, discussionBoardEntry: entry }, '', url)
  }

  const openTopic = (nodeId: string) => {
    sessionStorage.setItem('discussionBoardScrollY', String(window.scrollY))
    setTransitioningRootId(nodeId)
    window.setTimeout(() => {
      setSelectedRootId(nodeId)
      setFocusedNodeId(null)
      setTransitioningRootId(null)
      pushDiscussionUrl(`/discussion-board?topic=${nodeId}`, 'topic')
    }, 520)
  }

  const backToList = () => {
    setSelectedRootId(null)
    setFocusedNodeId(null)
    pushDiscussionUrl('/discussion-board', 'list')
    window.setTimeout(() => {
      const scrollY = Number(sessionStorage.getItem('discussionBoardScrollY') || '0')
      window.scrollTo({ top: scrollY })
    }, 20)
  }

  const focusNode = (nodeId: string, scrollToTop = false) => {
    if (!selectedRootId) return

    setFocusedNodeId(nodeId)
    pushDiscussionUrl(`/discussion-board?topic=${selectedRootId}&node=${nodeId}`, 'node')

    if (scrollToTop) {
      window.setTimeout(() => {
        document.querySelector('.discussionTree')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 50)
    }
  }

  const toggleNodeCollapse = (nodeId: string) => {
    setCollapsedNodeIds((current) => {
      const next = new Set(current)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  const openReply = (nodeId: string, edgeType: DiscussionEdgeType) => {
    setReplyParentId(nodeId)
    setReplyEdgeType(edgeType)
    setReplySubmissionKey(createSubmissionKey())
    setNotice(null)
  }

  const submitReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!replyParentId || isSubmitting) return

    const formData = new FormData(event.currentTarget)
    const nodeType = formData.get('nodeType') === 'question' ? 'question' : 'statement'
    const edgeType: DiscussionEdgeType = nodeType === 'question' ? 'asks_about' : 'responds_to'
    setIsSubmitting(true)
    setNotice(null)

    try {
      const response = await fetch('/api/discussions/reply', {
        body: JSON.stringify({
          backgroundText: formData.get('backgroundText'),
          bodyText: formData.get('bodyText'),
          edgeType,
          displayName: formData.get('displayName'),
          idempotencyKey: replySubmissionKey,
          nodeType,
          parentNodeId: replyParentId,
          questionText: formData.get('questionText'),
          title: formData.get('title'),
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': replySubmissionKey,
        },
        method: 'POST',
      })

      const json = (await response.json()) as { error?: string; success?: boolean }

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Unable to post reply.')
      }

      setReplyParentId(null)
      setReplySubmissionKey(createSubmissionKey())
      setNotice('Posted.')
      startRouteRefresh(() => {
        router.refresh()
      })
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to post reply.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderNode = (
    node: DiscussionBoardNode,
    level: number,
    childPath: number[] = [],
  ): ReactNode => {
    const edges = childEdgesByParent.get(node.id) || []
    const isCollapsed = collapsedNodeIds.has(node.id)
    const groupedEdges = getVisibleEdgeGroups(edges)

    return (
      <article
        className={cn('discussionTreeNode', `level-${Math.min(level, 3)}`)}
        data-child-label={childPath.length ? `Child ${childPath.join('.')}` : undefined}
        key={node.id}
      >
        <NodeCard
          childCount={edges.length}
          isCollapsed={isCollapsed}
          isFocused={treeRoot?.id === node.id}
          node={node}
          onReply={openReply}
          onToggleCollapse={() => toggleNodeCollapse(node.id)}
        />

        {replyParentId === node.id ? (
          <ReplyComposer
            edgeType={replyEdgeType}
            isSubmitting={isSubmitting}
            onCancel={() => setReplyParentId(null)}
            onSubmit={submitReply}
          />
        ) : null}

        {isCollapsed && edges.length > 0 ? (
          <button
            className="discussionCollapsedBranch"
            onClick={() => toggleNodeCollapse(node.id)}
            type="button"
          >
            <ChevronDown aria-hidden="true" className="h-4 w-4" />
            Show {getStatLabel(edges.length, 'collapsed reply')}
          </button>
        ) : null}

        {!isCollapsed && level >= depth && edges.length > 0 ? (
          <button
            className="discussionCollapsedBranch"
            onClick={() => focusNode(node.id)}
            type="button"
          >
            <ChevronDown aria-hidden="true" className="h-4 w-4" />
            {getStatLabel(edges.length, 'hidden branch')}
          </button>
        ) : null}

        {!isCollapsed && level < depth && groupedEdges.length ? (
          <div className="discussionEdgeGroups">
            {groupedEdges.map((group, groupIndex) => {
              const childNodes = sortNodes(
                group.edges
                  .map((edge) => nodeById.get(edge.fromNodeId))
                  .filter(Boolean) as DiscussionBoardNode[],
                sort,
              )
              const precedingChildCount = groupedEdges
                .slice(0, groupIndex)
                .reduce((total, currentGroup) => total + currentGroup.edges.length, 0)

              return (
                <section
                  className="discussionEdgeGroup"
                  data-edge={group.edgeType}
                  key={group.edgeType}
                >
                  <div className="discussionEdgeLabel">
                    {edgeIcons[group.edgeType]}
                    <span>{group.title}</span>
                  </div>

                  <div className="discussionChildren">
                    {childNodes.map((child, index) =>
                      renderNode(child, level + 1, [...childPath, precedingChildCount + index + 1]),
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        ) : null}
      </article>
    )
  }

  return (
    <div
      aria-busy={isSubmitting || isRoutePending}
      className={cn(
        'discussionBoardPage',
        treeRoot && 'is-graph-view',
        transitioningRootId && 'is-transitioning',
        isRoutePending && 'is-route-pending',
      )}
    >
      <div className="cateringMenuExperience discussionHeroExperience">
        <MenuHero
          eyebrow="Public reasoning"
          isSceneryPickerOpen={isSceneryPickerOpen}
          isSceneChanging={false}
          key={heroSceneryTone}
          onSelectScenery={handleSelectHeroScenery}
          onToggleSceneryPicker={() => setIsSceneryPickerOpen((current) => !current)}
          sceneryTone={heroSceneryTone}
          summary="Open a question, follow replies and follow-up questions, and keep the reasoning visible instead of buried in disconnected comments."
          title="Discussion Board"
        />
      </div>

      <section className="discussionBoardShell container">
        {isRoutePending ? (
          <p aria-live="polite" className="discussionPendingNotice">
            Updating discussion
          </p>
        ) : null}
        {!treeRoot ? (
          <>
            <header className="discussionBoardHeader discussionBoardToolbar">
              <p className="discussionBoardToolbarTitle">Sort discussion threads</p>
              <div className="discussionSortRail" aria-label="Sort topics">
                {discussionSorts.map((item) => (
                  <button
                    className={cn('discussionSortButton', sort === item.value && 'is-active')}
                    key={item.value}
                    onClick={() => setSort(item.value)}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </header>

            <DiscussionGuide
              isOpen={isGuideOpen}
              onToggle={() => setIsGuideOpen((current) => !current)}
              title="How this discussion graph works"
            >
              <p>
                Start with a root question, then open it to see a top-down reply tree. Children are
                grouped as replies or follow-up questions so the board reads more like a threaded
                discussion.
              </p>
              <p>
                Depth controls how many levels of replies are visible. Solid connector lines show
                which child belongs to which parent.
              </p>
            </DiscussionGuide>

            <div
              className="discussionTopicList"
              data-transitioning-id={transitioningRootId || undefined}
            >
              {sortedRoots.map((root) => (
                <button
                  className={cn(
                    'discussionTopicRow',
                    transitioningRootId === root.id && 'is-selected-transition',
                    transitioningRootId && transitioningRootId !== root.id && 'is-falling-away',
                  )}
                  key={root.id}
                  onClick={() => openTopic(root.id)}
                  type="button"
                >
                  <span className="discussionTopicMain">
                    <span className="discussionTopicKicker">
                      {root.type} · active {formatDate(root.lastActivityAt)}
                    </span>
                    <span className="discussionTopicTitle">{root.title}</span>
                    <span className="discussionTopicPreview">{root.shortPreview}</span>
                    <span className="discussionTagList">
                      {root.tags.slice(0, 5).map((tag) => (
                        <span className="discussionTag" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </span>
                  </span>

                  <span className="discussionTopicStats" aria-label="Topic stats">
                    <span>{getStatLabel(root.responseCount, 'reply')}</span>
                    <span>{getStatLabel(root.questionCount, 'follow-up question')}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <header className="discussionGraphHeader">
              <div className="discussionGraphNav">
                <button className="discussionBackButton" onClick={backToList} type="button">
                  <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                  Topic list
                </button>
                {currentParentNode ? (
                  <button
                    className="discussionBackButton"
                    onClick={() => focusNode(currentParentNode.id)}
                    type="button"
                  >
                    <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                    Parent
                  </button>
                ) : null}
              </div>

              <div className="discussionGraphTitle">
                <p className="discussionBoardEyebrow">Discussion path</p>
                <h1>{treeRoot.title}</h1>
                <nav aria-label="Focused discussion path" className="discussionTrail">
                  {trail.map((node) => (
                    <button key={node.id} onClick={() => focusNode(node.id)} type="button">
                      {node.title}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="discussionDepthControl" aria-label="Tree depth">
                {[1, 2, 3, 4].map((value) => (
                  <button
                    className={cn(depth === value && 'is-active')}
                    key={value}
                    onClick={() => setDepth(value)}
                    type="button"
                  >
                    Depth {value}
                  </button>
                ))}
              </div>
            </header>

            <DiscussionGuide
              isOpen={isGuideOpen}
              onToggle={() => setIsGuideOpen((current) => !current)}
              title="How to read this tree"
            >
              <p>
                The selected node is the top of this view. Replies and follow-up questions appear
                underneath with solid connector lines showing which child belongs to which parent.
              </p>
              <p>
                Use Reply to add a response. Use Ask question when the parent raises something that
                needs its own branch.
              </p>
            </DiscussionGuide>

            {notice ? <p className="discussionNotice">{notice}</p> : null}

            {currentParentNode ? (
              <section className="discussionParentBanner" aria-label="Current parent node">
                <span>
                  Under parent: <strong>{currentParentNode.title}</strong>
                </span>
                <button onClick={() => focusNode(currentParentNode.id, true)} type="button">
                  <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                  Jump to parent node
                </button>
              </section>
            ) : null}

            <div className="discussionTree">{renderNode(treeRoot, 0)}</div>
          </>
        )}
      </section>
    </div>
  )
}

function NodeCard({
  childCount,
  isCollapsed,
  isFocused,
  node,
  onReply,
  onToggleCollapse,
}: {
  childCount: number
  isCollapsed: boolean
  isFocused: boolean
  node: DiscussionBoardNode
  onReply: (nodeId: string, edgeType: DiscussionEdgeType) => void
  onToggleCollapse: () => void
}) {
  const [areActionsOpen, setAreActionsOpen] = useState(false)

  return (
    <div className={cn('discussionNodeCard', isFocused && 'is-focused')} data-node-type={node.type}>
      <div className="discussionNodeTopline">
        {isFocused ? <span className="discussionHerePill">You are here</span> : null}
        <span>{node.type}</span>
        <span>by {node.authorName}</span>
        {node.authorState === 'reconsidered' ? <span>reconsidered</span> : null}
      </div>

      <h2>{node.title}</h2>
      <NodeContent blocks={node.content.blocks} fallback={node.shortPreview} nodeType={node.type} />

      <div className="discussionNodeStats">
        <span title={getStatLabel(node.responseCount, 'reply')}>Replies {node.responseCount}</span>
        <span title={getStatLabel(node.questionCount, 'follow-up question')}>
          Questions {node.questionCount}
        </span>
      </div>

      <div className="discussionNodeUtilityRow">
        {childCount > 0 ? (
          <button className="discussionInlineAction" onClick={onToggleCollapse} type="button">
            <ChevronDown
              aria-hidden="true"
              className={cn('h-4 w-4', isCollapsed && 'discussionIconRotated')}
            />
            {isCollapsed ? 'Expand branch' : 'Collapse branch'}
          </button>
        ) : null}
      </div>

      <div className="discussionNodeActionPanel" data-open={areActionsOpen}>
        <button
          aria-expanded={areActionsOpen}
          className="discussionActionsToggle"
          onClick={() => setAreActionsOpen((current) => !current)}
          type="button"
        >
          Actions
          <ChevronDown
            aria-hidden="true"
            className={cn('h-4 w-4', areActionsOpen && 'discussionIconFlipped')}
          />
        </button>

        {areActionsOpen ? (
          <div className="discussionNodeActions">
            <button
              data-edge="responds_to"
              onClick={() => onReply(node.id, 'responds_to')}
              type="button"
            >
              <MessageSquarePlus aria-hidden="true" className="h-4 w-4" />
              Reply
            </button>
            <button
              data-edge="asks_about"
              onClick={() => onReply(node.id, 'asks_about')}
              type="button"
            >
              <CircleHelp aria-hidden="true" className="h-4 w-4" />
              Ask question
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function NodeContent({
  blocks,
  fallback,
  nodeType,
}: {
  blocks: ContentBlock[]
  fallback: string
  nodeType: DiscussionNodeType
}) {
  const visibleBlocks = blocks.filter((block) => block.text.trim())

  if (!visibleBlocks.length) {
    return <p>{fallback}</p>
  }

  return (
    <div className="discussionNodeContent">
      {visibleBlocks.map((block) => {
        const label =
          block.type === 'body'
            ? 'Reply'
            : block.type === 'question'
              ? 'Question'
              : block.type === 'background'
                ? 'Background'
                : block.type === 'claim'
                  ? nodeType === 'question'
                    ? 'Question'
                    : 'Conclusion'
                  : block.type === 'evidence'
                    ? nodeType === 'question'
                      ? 'Background'
                      : block.evidenceKind === 'source'
                        ? 'Premise and sources'
                        : block.evidenceKind === 'direct_experience'
                          ? 'Premise from experience'
                          : 'Premise from reasoning'
                    : 'What I might be missing'
        const urls = block.type === 'evidence' ? block.urls || (block.url ? [block.url] : []) : []

        const isLongBlock = block.text.trim().length > 520
        const blockBody = (showBottomReadLess = false) => (
          <>
            <p>{renderInlineText(block.text)}</p>
            {urls.length ? (
              <div className="discussionSourceList">
                {urls.map((url) => (
                  <a href={url} key={url} rel="noreferrer" target="_blank">
                    {url}
                  </a>
                ))}
              </div>
            ) : null}
            {showBottomReadLess ? (
              <button className="discussionReadLessBottom" onClick={closeDetails} type="button">
                Read less
              </button>
            ) : null}
          </>
        )

        if (block.type === 'background') {
          return (
            <details
              className="discussionContentBlock discussionBackgroundBlock"
              data-block-type={block.type}
              key={block.id}
            >
              <summary>
                <span>{label}</span>
                <span className="discussionBackgroundPreview">{getPreviewText(block.text)}</span>
                <span className="discussionReadMoreText">Read more</span>
                <span className="discussionReadLessText">Read less</span>
              </summary>
              {blockBody(true)}
            </details>
          )
        }

        if (isLongBlock) {
          return (
            <details
              className="discussionContentBlock discussionPreviewBlock"
              data-block-type={block.type}
              key={block.id}
            >
              <summary>
                <span className="discussionPreviewText">{getPreviewText(block.text, 300)}</span>
                <span className="discussionReadMoreText">Read more</span>
                <span className="discussionReadLessText">Read less</span>
              </summary>
              {blockBody(true)}
            </details>
          )
        }

        return (
          <section className="discussionContentBlock" data-block-type={block.type} key={block.id}>
            {block.type === 'body' ? null : <span>{label}</span>}
            {blockBody()}
          </section>
        )
      })}
    </div>
  )
}

function ReplyComposer({
  edgeType,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  edgeType: DiscussionEdgeType
  isSubmitting: boolean
  onCancel: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const defaultNodeType = edgeType === 'asks_about' ? 'question' : 'statement'
  const nodeType = defaultNodeType
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null)

  const wrapSelectedBodyText = (prefix: string, suffix = prefix) => {
    const textarea = bodyTextareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.slice(start, end)
    const replacement = `${prefix}${selectedText || 'selected text'}${suffix}`

    textarea.setRangeText(replacement, start, end, 'select')
    textarea.focus()
  }

  const markSelectedBodyLink = () => {
    const textarea = bodyTextareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.slice(start, end).trim()
    const url = selectedText && urlPattern.test(selectedText) ? selectedText : 'https://'
    const replacement =
      selectedText && urlPattern.test(selectedText) ? selectedText : `[link text](${url})`

    textarea.setRangeText(replacement, start, end, 'select')
    textarea.focus()
  }

  const markSelectedBodyReference = () => {
    const textarea = bodyTextareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.slice(start, end).trim()
    const url = selectedText && urlPattern.test(selectedText) ? selectedText : 'https://'

    textarea.setRangeText(`[[ref:${url}]]`, start, end, 'select')
    textarea.focus()
  }

  return (
    <form className="discussionReplyComposer" onSubmit={onSubmit}>
      <input name="nodeType" type="hidden" value={nodeType} />

      <div className="discussionReplyHeader">
        <span>
          {edgeIcons[edgeType]}
          {edgeLabels[edgeType]}
        </span>
        <button onClick={onCancel} type="button">
          Cancel
        </button>
      </div>

      <div className="discussionFieldHelp">
        Anonymous posting is enabled for testing. Add a display name if you want this node to show
        something other than Anonymous neighbor.
      </div>

      <label>
        Display name <span>optional</span>
        <input name="displayName" placeholder="Anonymous neighbor" />
      </label>

      {nodeType === 'statement' ? (
        <>
          <div className="discussionFieldHelp">
            Write normally for now. Later, we can add highlighting so users can mark which parts are
            conclusions and premises without forcing everyone into a form.
          </div>
          <label>
            Reply <span>required</span>
            <span className="discussionTextTools" aria-label="Text tools">
              <button onClick={() => wrapSelectedBodyText('**')} type="button">
                Bold
              </button>
              <button onClick={() => wrapSelectedBodyText('*')} type="button">
                Italic
              </button>
              <button onClick={() => wrapSelectedBodyText('[[conclusion:', ']]')} type="button">
                Conclusion
              </button>
              <button onClick={() => wrapSelectedBodyText('[[premise:', ']]')} type="button">
                Premise
              </button>
              <button onClick={markSelectedBodyLink} type="button">
                Highlight link
              </button>
              <button onClick={markSelectedBodyReference} type="button">
                Reference
              </button>
            </span>
            <textarea
              name="bodyText"
              placeholder="Say the thing. Paste links here too."
              ref={bodyTextareaRef}
              required
              rows={8}
            />
          </label>
        </>
      ) : (
        <>
          <label>
            Question <span>required</span>
            <textarea
              name="questionText"
              placeholder="Write the question you want answered."
              required
              rows={4}
            />
          </label>
          <label>
            Background{' '}
            <span>
              optional{' '}
              <HelpText text="Use background for context: why you are asking, what made you wonder, or what people need to know before answering." />
            </span>
            <textarea
              name="backgroundText"
              placeholder="Why are you asking this, or what background helps people answer?"
              rows={5}
            />
          </label>
        </>
      )}

      <button className="discussionSubmitButton" disabled={isSubmitting} type="submit">
        <Sparkles aria-hidden="true" className="h-4 w-4" />
        {isSubmitting ? 'Posting' : 'Post node'}
      </button>
    </form>
  )
}

function HelpText({ text }: { text: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const closeOnOutsideClick = (event: globalThis.MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [isOpen])

  return (
    <span className="discussionHelpText" ref={wrapperRef}>
      <button
        aria-expanded={isOpen}
        aria-label="Show help"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        ?
      </button>
      {isOpen ? <p>{text}</p> : null}
    </span>
  )
}

function DiscussionGuide({
  children,
  isOpen,
  onToggle,
  title,
}: {
  children: ReactNode
  isOpen: boolean
  onToggle: () => void
  title: string
}) {
  return (
    <section className="discussionGuide" data-open={isOpen}>
      <button
        aria-expanded={isOpen}
        className="discussionGuideToggle"
        onClick={onToggle}
        type="button"
      >
        <ShieldQuestion aria-hidden="true" className="h-4 w-4" />
        {title}
        <ChevronDown aria-hidden="true" className="h-4 w-4" />
      </button>
      {isOpen ? <div className="discussionGuideBody">{children}</div> : null}
    </section>
  )
}
