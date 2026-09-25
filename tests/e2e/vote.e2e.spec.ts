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
let optionIDs: number[] = []

const openVotePage = async (page: Page) => {
  await page.goto(`${baseURL}/vote`, { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    document.querySelector<HTMLElement>('.announcementsPortalBackdrop')?.click()
  })
  await expect(page.locator('.voteCard').first()).toBeVisible()
}

test.describe('Flavor vote', () => {
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
    optionIDs = products.docs.map((product) => product.id)
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

  test('keeps keyboard focus inside the enlarged photo', async ({ page }) => {
    await openVotePage(page)

    const expand = page.getByRole('button', { name: /Enlarge photo of/ }).first()
    await expand.click()

    const lightbox = page.locator('.imageLightbox')
    await expect(page.getByRole('button', { name: 'Close enlarged image' })).toBeFocused()

    for (let press = 0; press < 3; press += 1) {
      await page.keyboard.press('Tab')
      expect(await lightbox.evaluate((node) => node.contains(document.activeElement))).toBe(true)
    }
    await page.keyboard.press('Shift+Tab')
    expect(await lightbox.evaluate((node) => node.contains(document.activeElement))).toBe(true)

    await page.keyboard.press('Escape')
    await expect(lightbox).toHaveCount(0)
    await expect(expand).toBeFocused()
  })

  test('keeps focus in the thank-you dialog and returns it to the saved ballot', async ({
    page,
  }) => {
    await openVotePage(page)

    await page
      .getByRole('button', { name: /Put a token on/ })
      .first()
      .click()
    await page.getByRole('button', { name: 'Submit my votes' }).click()

    const dialog = page.getByRole('dialog', { name: 'Thanks for voting!' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused()

    for (let press = 0; press < 6; press += 1) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true)
    }

    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Change my votes' })).toBeFocused()
  })

  test('lets a voter re-vote after their flavor leaves the ballot', async ({ page }) => {
    test.skip(optionIDs.length < 3, 'Needs three flavors on the ballot')

    await openVotePage(page)
    const removedTitle = ((await page.locator('.voteCardTitle').first().textContent()) ?? '').trim()
    await page.getByRole('button', { name: `Put a token on ${removedTitle}` }).click()
    await page.getByRole('button', { name: 'Submit my votes' }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByText('Your votes are in')).toBeVisible()

    const [, ...remaining] = optionIDs
    try {
      await payload.update({
        collection: 'flavor-polls',
        data: { options: remaining },
        id: pollID as number,
        overrideAccess: true,
      })

      await openVotePage(page)
      await expect(page.getByText('Your votes are in')).toHaveCount(0)
      await expect(page.locator('.voteCardTitle', { hasText: removedTitle })).toHaveCount(0)

      await page
        .getByRole('button', { name: /Put a token on/ })
        .first()
        .click()
      await page.getByRole('button', { name: 'Submit my votes' }).click()
      await expect(page.getByRole('dialog', { name: 'Thanks for voting!' })).toBeVisible()
    } finally {
      await payload.update({
        collection: 'flavor-polls',
        data: { options: optionIDs },
        id: pollID as number,
        overrideAccess: true,
      })
    }
  })

  test('keeps closed results at their own link and in the past votes list', async ({ page }) => {
    const winnerID = optionIDs[1] ?? optionIDs[0]
    const olderWinnerID = optionIDs[0]
    const [winner, olderWinner] = await Promise.all(
      [winnerID, olderWinnerID].map((id) =>
        payload.findByID({ collection: 'products', depth: 0, id, overrideAccess: true }),
      ),
    )
    const createClosed = (title: string, minutesAgo: number) =>
      payload.create({
        collection: 'flavor-polls',
        data: {
          closesAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
          options: optionIDs,
          status: 'live',
          title,
          votesPerPerson: 3,
        },
        overrideAccess: true,
      })
    const closed = await createClosed('Results link check', 1)
    const older = await createClosed('Older results check', 2)

    try {
      await Promise.all([
        payload.create({
          collection: 'flavor-poll-votes',
          data: {
            picks: [{ count: 3, product: winnerID }],
            poll: closed.id,
            voterKey: 'e2e-results',
          },
          overrideAccess: true,
        }),
        payload.create({
          collection: 'flavor-poll-votes',
          data: {
            picks: [{ count: 3, product: olderWinnerID }],
            poll: older.id,
            voterKey: 'e2e-results-older',
          },
          overrideAccess: true,
        }),
      ])

      await page.goto(`${baseURL}/vote/results/${closed.id}`, { waitUntil: 'networkidle' })
      await expect(page.getByRole('heading', { name: `You picked ${winner.title}` })).toBeVisible()
      await expect(page.getByText('Open now')).toBeVisible()
      await expect(page.getByRole('link', { name: /Vote in the next one/ })).toHaveAttribute(
        'href',
        '/vote',
      )

      await openVotePage(page)
      const history = page.locator('.voteHistory')
      await expect(history.getByRole('heading', { name: 'Past votes' })).toBeVisible()

      const latest = history.locator(`details[data-poll-id="${closed.id}"]`)
      const previous = history.locator(`details[data-poll-id="${older.id}"]`)
      await expect(latest).toHaveAttribute('open', '')
      await expect(latest.locator('summary')).toContainText(`${winner.title} won`)
      await expect(latest.getByRole('link', { name: /See the results page/ })).toHaveAttribute(
        'href',
        `/vote/results/${closed.id}`,
      )

      await expect(previous).not.toHaveAttribute('open', '')
      await expect(previous.locator('summary')).toContainText(`${olderWinner.title} won`)
      await previous.locator('summary').click()
      await expect(previous).toHaveAttribute('open', '')
      await expect(previous.getByRole('heading', { name: 'Final standings' })).toBeVisible()

      await page.goto(`${baseURL}/vote/results/${pollID}`, { waitUntil: 'networkidle' })
      await expect(page).toHaveURL(`${baseURL}/vote`)
    } finally {
      await Promise.all(
        [closed.id, older.id].map((id) =>
          payload.delete({ collection: 'flavor-polls', id, overrideAccess: true }),
        ),
      )
    }
  })
})
