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
import { FlavorRotations } from '@/collections/FlavorRotations'
import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { Posts } from '@/collections/Posts'
import { Admins } from '@/collections/Admins'
import { Customers } from '@/collections/Customers'
import { EmailVerificationStarts } from '@/collections/EmailVerificationStarts'
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
import { DiscussionBoardContent } from '@/globals/DiscussionBoardContent'
import { Footer } from '@/globals/Footer'
import { Header } from '@/globals/Header'
import { resolveDatabaseURL } from '@/utilities/resolveDatabaseURL'
import { plugins } from './plugins'

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
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeDashboard` statement on line 15.
      beforeDashboard: ['@/components/BeforeDashboard#BeforeDashboard'],
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
    Categories,
    Media,
  ],
  db: postgresAdapter({
    migrationDir: path.resolve(dirname, 'migrations'),
    pool: {
      connectionString: databaseURL,
    },
    push: process.env.NODE_ENV !== 'production' && !process.env.VERCEL,
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
  globals: [Brand, Header, Footer, BlogPageContent, DiscussionBoardContent],
  plugins: [
    vercelBlobStorage({
      collections: {
        media: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
    ...plugins,
  ],
  secret: process.env.PAYLOAD_SECRET || '',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
