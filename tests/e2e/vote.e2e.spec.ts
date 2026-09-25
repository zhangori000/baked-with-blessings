import { expect, test, type Page } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import { CATERING_FLAVOR_CATEGORY_SLUG } from '../../src/features/products/cateringPackages.js'
import config from '../../src/payload.config.js'
import { expectLayoutStable } from '../helpers/layoutStability'

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

const viewports = [
  { height: 900, name: 'wide-desktop', width: 1440 },
  { height: 900, name: 'desktop', width: 1280 },
  { height: 900, name: 'laptop', width: 1060 },
  { height: 1024, name: 'tablet', width: 820 },
  { height: 844, name: 'mobile', width: 390 },
  { height: 740, name: 'small-mobile', width: 340 },
] as const

let payload: Payload
let pollID: number | string | undefined

const openVotePage = async (page: Page) => {
  await page.goto(`${baseURL}/vote`, { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    document.querySelector<HTMLElement>('.announcementsPortalBackdrop')?.click()
  })
  await expect(page.locator('.voteCard').first()).toBeVisible()
}

test.describe('Flavor vote layout stability', () => {
  test.beforeAll(async () => {
    payload = await getPayload({ config })

    const category = await payload.find({
      collection: 'categories',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { slug: { equals: CATERING_FLAVOR_CATEGORY_SLUG } },
    })
    const categoryID = category.docs[0]?.id

    test.skip(categoryID == null, 'Needs the cookie category')

    const products = await payload.find({
      collection: 'products',
      depth: 0,
      limit: 3,
      overrideAccess: true,
      where: {
        and: [
          { _status: { equals: 'published' } },
          { categories: { contains: categoryID } },
          { menuBehavior: { not_equals: 'batchBuilder' } },
        ],
      },
    })

    test.skip(products.docs.length < 2, 'Needs at least two published products')

    const poll = await payload.create({
      collection: 'flavor-polls',
      data: {
        closesAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
        options: products.docs.map((product) => product.id),
        status: 'live',
        title: 'Layout stability check',
        votesPerPerson: 3,
      },
      overrideAccess: true,
    })

    pollID = poll.id
  })

  test.afterAll(async () => {
    if (pollID != null) {
      await payload.delete({ collection: 'flavor-polls', id: pollID, overrideAccess: true })
    }
  })

  for (const viewport of viewports) {
    test(`adding and removing tokens does not move the card (${viewport.name})`, async ({
      page,
    }) => {
      await page.setViewportSize({ height: viewport.height, width: viewport.width })
      await openVotePage(page)

      const card = page.locator('.voteCard').first()
      const plus = card.getByRole('button', { name: /Put a token on/ })
      const minus = card.getByRole('button', { name: /Take a token off/ })

      await card.scrollIntoViewIfNeeded()

      const watch = {
        body: card.locator('.voteCardBody'),
        cards: page.locator('.voteCard'),
        photo: card.locator('.voteCardPhotoFrame'),
        stepperButtons: card.locator('.voteStepperButton'),
        summary: card.locator('.voteCardSummary'),
        title: card.locator('.voteCardTitle'),
      }

      for (let step = 1; step <= 3; step += 1) {
        await expectLayoutStable({
          action: () => plus.click(),
          label: `adding token ${step} (${viewport.name})`,
          watch,
        })
      }

      await expect(plus).toBeDisabled()

      for (let step = 3; step >= 1; step -= 1) {
        await expectLayoutStable({
          action: () => minus.click(),
          label: `removing token ${step} (${viewport.name})`,
          watch,
        })
      }
    })
  }
})
