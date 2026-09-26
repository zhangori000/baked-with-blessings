import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'

import {
  BoldFeature,
  EXPERIMENTAL_TableFeature,
  IndentFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  UnderlineFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Categories } from '@/collections/Categories'
import { CommunityNotes } from '@/collections/CommunityNotes'
import { FeatureRequestComments } from '@/collections/FeatureRequestComments'
import { FeatureRequests } from '@/collections/FeatureRequests'
import { FlavorPolls } from '@/collections/FlavorPolls'
import { FlavorNudges } from '@/collections/FlavorNudges'
import { BRING_BACK_ADMIN_VIEW_PATH } from '@/features/flavor-nudges/constants'
import { FlavorPollVotes } from '@/collections/FlavorPollVotes'
import { FlavorRotations } from '@/collections/FlavorRotations'
import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { Posts } from '@/collections/Posts'
import { Admins } from '@/collections/Admins'
import { BakeryUpdateDeliveries } from '@/collections/BakeryUpdateDeliveries'
import { BakeryUpdates } from '@/collections/BakeryUpdates'
import { Customers } from '@/collections/Customers'
import { EmailVerificationStarts } from '@/collections/EmailVerificationStarts'
import { MessageConsentEvents } from '@/collections/MessageConsentEvents'
import { PhoneVerificationStarts } from '@/collections/PhoneVerificationStarts'
import {
  BlessingsNetworkAnswers,
  BlessingsNetworkOwners,
  BlessingsNetworkOwnerPosts,
  BlessingsNetworkQuestions,
} from '@/features/blessings-network/collections'
import {
  AwarenessMarks,
  DiscussionEdges,
  DiscussionNodes,
} from '@/features/discussion-graph/collections'
import { Reviews } from '@/features/reviews/collections/index'
import { BlogPageContent } from '@/globals/BlogPageContent'
import { Brand } from '@/globals/Brand'
import { CommunityPageContent } from '@/globals/CommunityPageContent'
import { DiscussionBoardContent } from '@/globals/DiscussionBoardContent'
import { FeatureRequestsContent } from '@/globals/FeatureRequestsContent'
import { Footer } from '@/globals/Footer'
import { Header } from '@/globals/Header'
import { Announcements } from '@/globals/Announcements'
import { SitePages } from '@/globals/SitePages'
import { StoreSettings } from '@/globals/StoreSettings'
import {
  preferIPv4DuringProductionBuild,
  productionBuildPoolOptions,
} from '@/utilities/preferIPv4DuringProductionBuild'
import { resolveDatabaseURL } from '@/utilities/resolveDatabaseURL'
import { plugins } from './plugins'

preferIPv4DuringProductionBuild()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const resendFromAddress = process.env.RESEND_FROM_EMAIL?.trim()
const resendApiKey = process.env.RESEND_API_KEY?.trim()
const resendFromName =
  process.env.RESEND_FROM_NAME?.trim() ||
  process.env.COMPANY_NAME?.trim() ||
  process.env.SITE_NAME?.trim() ||
  'Baked with Blessings'

const emailAdapter =
  resendApiKey && resendFromAddress
    ? resendAdapter({
        apiKey: resendApiKey,
        defaultFromAddress: resendFromAddress,
        defaultFromName: resendFromName,
      })
    : undefined
const databaseURL = resolveDatabaseURL()

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeLogin` statement on line 15.
      beforeLogin: ['@/components/BeforeLogin#BeforeLogin'],
      beforeNavLinks: ['@/components/AdminDashboard/AdminQuickNav#AdminQuickNav'],
      views: {
        bakeryUpdate: {
          Component: '@/components/admin/BakeryUpdates#BakeryUpdateDetailView',
          exact: true,
          path: '/bakery-updates/:id',
        },
        bakeryUpdates: {
          Component: '@/components/admin/BakeryUpdates#BakeryUpdatesView',
          exact: true,
          path: '/bakery-updates',
        },
        bringBack: {
          Component: '@/components/admin/BringBackRequests#BringBackRequestsView',
          exact: true,
          path: BRING_BACK_ADMIN_VIEW_PATH,
        },
        dashboard: {
          Component: '@/components/AdminDashboard#AdminDashboard',
        },
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Admins.slug,
  },
  collections: [
    Admins,
    Customers,
    EmailVerificationStarts,
    MessageConsentEvents,
    BakeryUpdates,
    BakeryUpdateDeliveries,
    PhoneVerificationStarts,
    DiscussionNodes,
    DiscussionEdges,
    AwarenessMarks,
    Reviews,
    BlessingsNetworkOwners,
    BlessingsNetworkQuestions,
    BlessingsNetworkAnswers,
    BlessingsNetworkOwnerPosts,
    Pages,
    Posts,
    FlavorRotations,
    FlavorPolls,
    FlavorPollVotes,
    FlavorNudges,
    Categories,
    CommunityNotes,
    FeatureRequests,
    FeatureRequestComments,
    Media,
  ],
  db: postgresAdapter({
    migrationDir: path.resolve(dirname, 'migrations'),
    pool: {
      connectionString: databaseURL,
      ...productionBuildPoolOptions(),
    },
    push: false,
  }),
  editor: lexicalEditor({
    features: () => {
      return [
        UnderlineFeature(),
        BoldFeature(),
        ItalicFeature(),
        OrderedListFeature(),
        UnorderedListFeature(),
        LinkFeature({
          enabledCollections: ['pages', 'posts'],
          fields: ({ defaultFields }) => {
            const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
              if ('name' in field && field.name === 'url') return false
              return true
            })

            return [
              ...defaultFieldsWithoutUrl,
              {
                name: 'url',
                type: 'text',
                admin: {
                  condition: ({ linkType }) => linkType !== 'internal',
                },
                label: ({ t }) => t('fields:enterURL'),
                required: true,
              },
            ]
          },
        }),
        IndentFeature(),
        EXPERIMENTAL_TableFeature(),
      ]
    },
  }),
  email: emailAdapter,
  endpoints: [],
  globals: [
    StoreSettings,
    Announcements,
    Brand,
    Header,
    Footer,
    BlogPageContent,
    DiscussionBoardContent,
    CommunityPageContent,
    FeatureRequestsContent,
    SitePages,
  ],
  plugins: [
    // Vercel Blob in hosted envs; when no token is set (local dev) fall back to
    // Payload's built-in local disk storage so media uploads work without a blob token.
    ...(process.env.BLOB_READ_WRITE_TOKEN
      ? [
          vercelBlobStorage({
            // dev/preview/prod share ONE Blob store, so re-syncing the same media
            // to a second env would otherwise fail with "blob already exists" (the
            // adapter has no allowOverwrite). A random suffix keeps every upload
            // unique. Filenames are internal — media is referenced by id/URL — so
            // the suffix is invisible to the storefront and the owner.
            addRandomSuffix: true,
            collections: {
              media: true,
            },
            token: process.env.BLOB_READ_WRITE_TOKEN,
          }),
        ]
      : []),
    ...plugins,
  ],
  secret: process.env.PAYLOAD_SECRET || '',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
