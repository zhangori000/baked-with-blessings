import type { Media } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

import { createHeadingAndParagraphsRichText } from './richText'

export const homePageData: ({
  contentImage,
  metaImage,
}: {
  contentImage: Media
  metaImage: Media
}) => RequiredDataFromCollectionSlug<'pages'> = ({ metaImage }) => {
  return {
    slug: 'home',
    _status: 'published',
    hero: {
      type: 'lowImpact',
      links: [
        {
          link: {
            type: 'custom',
            appearance: 'default',
            label: 'Browse the menu',
            url: '/shop',
          },
        },
        {
          link: {
            type: 'custom',
            appearance: 'outline',
            label: 'Create account',
            url: '/create-account',
          },
        },
      ],
      richText: createHeadingAndParagraphsRichText({
        heading: 'Baked with Blessings',
        headingTag: 'h1',
        paragraphs: [
          'Coffee, cookies, breads, pasta, cakes, and snack jars for people who want the site to feel more like a bakery case than a merch shelf.',
        ],
      }),
    },
    layout: [
      {
        blockType: 'content',
        columns: [
          {
            size: 'half',
            richText: createHeadingAndParagraphsRichText({
              heading: 'What is seeded now',
              paragraphs: [
                'The starter catalog now covers drinks, snacks, cookies, breads, entrees, and cakes so the next design pass can work against a real bakery-shaped menu instead of template apparel.',
              ],
            }),
          },
          {
            size: 'half',
            richText: createHeadingAndParagraphsRichText({
              heading: 'What to do next',
              paragraphs: [
                'Replace the placeholder product images, refine prices and descriptions, then keep pushing the storefront toward horizontal category rails, stronger hover moments, and better quick-view behavior.',
              ],
            }),
          },
        ],
      },
      {
        blockType: 'cta',
        richText: createHeadingAndParagraphsRichText({
          heading: 'Start with the menu',
          headingTag: 'h3',
          paragraphs: [
            'This first seed pass is meant to support better storefront design work immediately, not to be the final brand expression.',
          ],
        }),
        links: [
          {
            link: {
              type: 'custom',
              appearance: 'default',
              label: 'Open the menu',
              url: '/shop',
            },
          },
          {
            link: {
              type: 'custom',
              appearance: 'outline',
              label: 'Go to admin',
              url: '/admin',
            },
          },
        ],
      },
    ],
    meta: {
      description:
        'A bakery and cafe storefront built with Payload and Next.js, seeded with drinks, cookies, breads, entrees, and cakes.',
      image: metaImage,
      title: 'Baked with Blessings',
    },
    title: 'Home',
  }
}
