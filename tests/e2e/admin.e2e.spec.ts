import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { cleanupAdminOrderFixture, seedAdminOrderFixture } from '../helpers/seedAdminOrders'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

test.describe('Admin Panel', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('can navigate to dashboard', async () => {
    await page.goto('http://localhost:3000/admin')
    await expect(page).toHaveURL('http://localhost:3000/admin')
    const dashboardArtifact = page.locator('span[title="Dashboard"]').first()
    await expect(dashboardArtifact).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'What would you like to take care of?' }),
    ).toBeVisible()
    await expect(page.getByText('Seed starter data')).toHaveCount(0)
    await expect(page.getByText('Connect Stripe test keys')).toHaveCount(0)
  })

  test('opens everyday work in one dashboard click', async () => {
    const destinations = [
      {
        heading: 'Orders',
        label: 'Orders to handle',
        path: '/admin/collections/orders',
      },
      {
        heading: 'Products',
        label: 'Products and prices',
        path: '/admin/collections/products',
      },
      {
        heading: 'Flavor Rotations',
        label: 'Current cookie lineup',
        path: '/admin/collections/flavor-rotations',
      },
      {
        heading: 'Announcements',
        label: 'Announcements',
        path: '/admin/globals/announcements',
      },
      {
        heading: 'Store Settings',
        label: 'Store settings',
        path: '/admin/globals/store-settings',
      },
    ]

    for (const destination of destinations) {
      await page.goto('http://localhost:3000/admin')
      const dailyWork = page.locator('section[aria-labelledby="daily-work-heading"]')

      await dailyWork.getByRole('link', { name: new RegExp(`^${destination.label}`) }).click()

      await expect(page).toHaveURL(new RegExp(`${destination.path}(?:\\?.*)?$`))
      await expect(page.getByRole('heading', { level: 1, name: destination.heading })).toBeVisible()
    }
  })

  test('keeps daily work within two clicks from collection screens', async () => {
    await page.goto('http://localhost:3000/admin/collections/products')

    await page.getByRole('button', { name: 'Open Menu' }).click()
    const quickNav = page.locator('section[aria-labelledby="daily-work-nav-heading"]')
    await quickNav.getByRole('link', { exact: true, name: 'Orders to handle' }).click()

    await expect(page).toHaveURL(/\/admin\/collections\/orders(?:\?.*)?$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Orders' })).toBeVisible()
  })

  test('opens the complete active-order queue without completed orders', async () => {
    const fixture = await seedAdminOrderFixture()

    try {
      await page.goto('http://localhost:3000/admin')
      await page.getByRole('link', { name: /View all \d+ open orders/ }).click()
      await page.waitForURL(/\/admin\/collections\/orders\?/)

      const url = new URL(page.url())
      expect([0, 1, 2].map((index) => url.searchParams.get(`where[status][in][${index}]`))).toEqual(
        ['processing', 'confirmed', 'ready'],
      )
      expect(url.searchParams.get('sort')).toBe('createdAt')
      await expect(page.getByText(fixture.openName, { exact: true })).toBeVisible()
      await expect(page.getByText(fixture.completedName, { exact: true })).toHaveCount(0)
    } finally {
      await cleanupAdminOrderFixture(fixture.ids)
    }
  })

  test('reviews a bulk price change before sending it', async () => {
    let updateRequests = 0
    const productsPattern = '**/api/products?*'
    const updatePattern = '**/next/admin-cookie-prices'

    await page.route(productsPattern, async (route) => {
      await route.fulfill({ body: 'Unavailable', status: 503 })
    })
    await page.route(updatePattern, async (route) => {
      updateRequests += 1
      expect(route.request().postDataJSON()).toEqual({ priceInUSD: 8, updateMiniPrices: true })
      await route.fulfill({
        json: {
          matchedCount: 4,
          miniPriceInUSD: 400,
          priceInUSD: 800,
          success: true,
          updatedCount: 4,
        },
        status: 200,
      })
    })

    try {
      await page.goto('http://localhost:3000/admin')
      const bulkTools = page.locator('section[aria-labelledby="admin-tools-heading"]')
      await expect(bulkTools.getByText('Bundle price check unavailable')).toBeVisible()
      await bulkTools.getByLabel('Cookie price').fill('8.00')
      await bulkTools.getByRole('button', { name: 'Set all cookies' }).click()

      const confirmationHeading = page.getByRole('heading', { name: 'Set every cookie price?' })
      await expect(confirmationHeading).toBeVisible()
      await expect(page.getByText('Bundle prices have not been verified.')).toBeVisible()
      expect(updateRequests).toBe(0)

      await page.getByRole('button', { name: 'Cancel' }).click()
      await expect(confirmationHeading).toBeHidden()
      expect(updateRequests).toBe(0)

      await bulkTools.getByRole('button', { name: 'Set all cookies' }).click()
      await page.getByRole('button', { name: 'Set all cookie prices' }).click()

      await expect.poll(() => updateRequests).toBe(1)
      await expect(bulkTools.getByText('Updated 4 cookies to $8.00 (mini $4.00).')).toBeVisible()
    } finally {
      await page.unroute(productsPattern)
      await page.unroute(updatePattern)
    }
  })

  test('keeps known bundle conflicts inside the price confirmation', async () => {
    const productsPattern = '**/api/products?*'
    const bundleWarning =
      'Cookie tray ($32.00) would be no cheaper than buying 4 large cookies individually ($32.00).'

    await page.route(productsPattern, async (route) => {
      await route.fulfill({
        json: {
          docs: [
            {
              priceInUSD: 3200,
              requiredSelectionCount: 4,
              slug: 'cookie-tray',
              title: 'Cookie tray',
            },
          ],
          hasNextPage: false,
          totalDocs: 1,
        },
        status: 200,
      })
    })

    try {
      await page.goto('http://localhost:3000/admin')
      const bulkTools = page.locator('section[aria-labelledby="admin-tools-heading"]')
      await bulkTools.getByLabel('Cookie price').fill('8.00')
      await expect(bulkTools.getByText(bundleWarning)).toBeVisible()
      await bulkTools.getByRole('button', { name: 'Set all cookies' }).click()

      await expect(page.getByRole('dialog').getByText(bundleWarning)).toBeVisible()
      await page.getByRole('button', { name: 'Cancel' }).click()
    } finally {
      await page.unroute(productsPattern)
    }
  })

  test('treats partial bundle pricing as unverified', async () => {
    const productsPattern = '**/api/products?*'

    await page.route(productsPattern, async (route) => {
      await route.fulfill({
        json: {
          docs: [
            {
              priceInUSD: 2000,
              requiredSelectionCount: 4,
              slug: 'cookie-tray',
              title: 'Cookie tray',
            },
            {
              priceInUSD: null,
              requiredSelectionCount: 4,
              slug: 'mini-cookie-tray',
              title: 'Mini cookie tray',
            },
          ],
          hasNextPage: false,
          totalDocs: 2,
        },
        status: 200,
      })
    })

    try {
      await page.goto('http://localhost:3000/admin')
      const bulkTools = page.locator('section[aria-labelledby="admin-tools-heading"]')
      await expect(bulkTools.getByText('Bundle price check unavailable')).toBeVisible()
      await bulkTools.getByRole('button', { name: 'Set all cookies' }).click()

      await expect(
        page.getByRole('dialog').getByText('Bundle prices have not been verified.'),
      ).toBeVisible()
      await page.getByRole('button', { name: 'Cancel' }).click()
    } finally {
      await page.unroute(productsPattern)
    }
  })

  test('keeps the dashboard usable at a mobile viewport', async () => {
    await page.setViewportSize({ height: 844, width: 390 })
    await page.goto('http://localhost:3000/admin')

    await expect(
      page.getByRole('heading', { name: 'What would you like to take care of?' }),
    ).toBeVisible()
    await expect(page.locator('section[aria-labelledby="daily-work-heading"]')).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      ),
    ).toBe(false)

    await page.setViewportSize({ height: 720, width: 1280 })
  })

  test('can navigate to list view', async () => {
    await page.goto('http://localhost:3000/admin/collections/admins')
    await expect(page).toHaveURL('http://localhost:3000/admin/collections/admins')
    const listViewArtifact = page.locator('h1', { hasText: 'Admins' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('can navigate to edit view', async () => {
    await page.goto('http://localhost:3000/admin/collections/admins/create')
    await expect(page).toHaveURL(/\/admin\/collections\/admins\/[a-zA-Z0-9-_]+/)
    const editViewArtifact = page.locator('input[name="email"]')
    await expect(editViewArtifact).toBeVisible()
  })
})
