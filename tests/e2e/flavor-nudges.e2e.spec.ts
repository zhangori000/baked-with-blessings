import { expect, test } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '../../src/payload.config.js'

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'
const email = 'nudge-e2e@example.com'
const customerEmail = 'nudge-e2e-customer@example.com'
const customerPassword = 'NudgeE2E-2026!'

let payload: Payload

const removeTestNudges = () =>
  payload.delete({
    collection: 'flavor-nudges',
    overrideAccess: true,
    where: { email: { in: [email, customerEmail] } },
  })

const removeTestCustomer = () =>
  payload.delete({
    collection: 'customers',
    overrideAccess: true,
    where: { email: { equals: customerEmail } },
  })

test.describe('Bring back an old flavor', () => {
  test.beforeAll(async () => {
    payload = await getPayload({ config })
    await removeTestNudges()
    await removeTestCustomer()
    await payload.create({
      collection: 'customers',
      data: {
        _verified: true,
        email: customerEmail,
        name: 'Nudge Tester',
        password: customerPassword,
      } as never,
      overrideAccess: true,
    })
  })

  test.afterAll(async () => {
    await removeTestNudges()
    await removeTestCustomer()
  })

  test('nudges an old flavor and remembers it on the page', async ({ page }) => {
    await page.goto(`${baseURL}/old-flavors`, { waitUntil: 'networkidle' })
    await page.evaluate(() => {
      document.querySelector<HTMLElement>('.announcementsPortalBackdrop')?.click()
    })

    const card = page.locator('.oldFlavorsCard').first()
    const title = (await card.locator('.oldFlavorsCardTitle').innerText()).trim()
    await card.getByRole('button', { name: `Bring back ${title}` }).click()

    const dialog = page.getByRole('dialog', { name: 'Bring back a flavor' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: title, pressed: true })).toBeVisible()

    await dialog.getByLabel(/Email me when it is back/).fill(email)
    await dialog.getByRole('button', { name: 'Send nudge' }).click()

    const sent = page.getByRole('dialog', { name: 'Nudge sent!' })
    await expect(sent).toContainText(title)
    await sent.getByRole('button', { name: 'Done' }).click()
    await expect(card.locator('.flavorNudgeCardDone')).toBeVisible()

    await page.reload({ waitUntil: 'networkidle' })
    await expect(
      page.locator('.oldFlavorsCard').first().locator('.flavorNudgeCardDone'),
    ).toBeVisible()

    const saved = await payload.find({
      collection: 'flavor-nudges',
      overrideAccess: true,
      where: { email: { equals: email } },
    })
    expect(saved.totalDocs).toBe(1)
  })

  test('signs in inside the dialog and uses the account email', async ({ page }) => {
    await page.goto(`${baseURL}/old-flavors`, { waitUntil: 'networkidle' })
    await page.evaluate(() => {
      document.querySelector<HTMLElement>('.announcementsPortalBackdrop')?.click()
    })

    const card = page.locator('.oldFlavorsCard').nth(1)
    const title = (await card.locator('.oldFlavorsCardTitle').innerText()).trim()
    await card.getByRole('button', { name: `Bring back ${title}` }).click()

    const dialog = page.getByRole('dialog', { name: 'Bring back a flavor' })
    await dialog.getByRole('button', { exact: true, name: 'Sign in' }).click()
    await dialog.getByLabel('Email or phone').fill(customerEmail)
    await dialog.getByLabel('Password', { exact: true }).fill(customerPassword)
    await dialog.getByRole('button', { exact: true, name: 'Sign in' }).click()

    const emailMe = dialog.getByLabel(`Email me at ${customerEmail} when it is back`)
    await expect(emailMe).toBeChecked()
    await expect(dialog.getByLabel(/Email me when it is back/)).toHaveCount(0)
    await expect(dialog.getByRole('button', { name: title, pressed: true })).toBeVisible()

    await dialog.getByRole('button', { name: 'Send nudge' }).click()
    await expect(page.getByRole('dialog', { name: 'Nudge sent!' })).toContainText(customerEmail)

    const saved = await payload.find({
      collection: 'flavor-nudges',
      overrideAccess: true,
      where: { email: { equals: customerEmail } },
    })
    expect(saved.totalDocs).toBe(1)
  })
})
