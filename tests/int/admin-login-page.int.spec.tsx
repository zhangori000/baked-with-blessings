import { AdminBootError } from '@/components/admin/AdminBootError'
import { AdminLoginPage } from '@/components/admin/AdminLoginPage'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

afterEach(cleanup)

describe('admin standalone login and error pages', () => {
  it('renders a real login form in the HTML, not an empty Suspense shell', () => {
    const { container } = render(<AdminLoginPage />)

    expect(container.querySelector('[data-admin-shell="login"]')).toBeTruthy()
    expect(container.querySelector('div[hidden]')).toBeNull()
    expect(container.innerHTML).not.toContain('<!--$-->')
    expect(screen.getByRole('heading', { name: 'Sign in to the bakery admin' })).toBeTruthy()
    expect(screen.getByLabelText('Email')).toBeTruthy()
    expect(screen.getByLabelText('Password')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy()
    expect(container.querySelector('#field-email')).toBeTruthy()
    expect(container.querySelector('#field-password')).toBeTruthy()
  })

  it('renders a visible error page instead of a blank body', () => {
    const { container } = render(
      <AdminBootError
        error={new Error('missing secret key. A secret key is needed to secure Payload.')}
      />,
    )

    expect(container.querySelector('[data-admin-shell="error"]')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'The admin panel could not load' })).toBeTruthy()
    expect(container.textContent).toMatch(/PAYLOAD_SECRET/)
    expect(container.textContent).toMatch(/missing secret key/)
  })
})
