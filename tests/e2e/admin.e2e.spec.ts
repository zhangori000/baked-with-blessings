import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
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
