'use client'

import { Button } from '@/components/ui/button'
import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  className?: string
}

export const AccountNav: React.FC<Props> = ({ className }) => {
  const pathname = usePathname()

  return (
    <nav className={clsx('accountSideNav', className)} aria-label="Account sections">
      <ul className="flex w-full flex-col gap-2">
        <li>
          <Button asChild className="accountSideNavButton" variant="link">
            <Link
              href="/account"
              className={clsx('accountSideNavLink', {
                'accountSideNavLink-active': pathname === '/account',
              })}
            >
              Account settings
            </Link>
          </Button>
        </li>

        <li>
          <Button asChild className="accountSideNavButton" variant="link">
            <Link
              href="/account/addresses"
              className={clsx('accountSideNavLink', {
                'accountSideNavLink-active': pathname === '/account/addresses',
              })}
            >
              Addresses
            </Link>
          </Button>
        </li>

        <li>
          <Button
            asChild
            variant="link"
            className="accountSideNavButton"
          >
            <Link
              className={clsx('accountSideNavLink', {
                'accountSideNavLink-active': pathname === '/orders' || pathname.includes('/orders'),
              })}
              href="/orders"
            >
              Orders
            </Link>
          </Button>
        </li>
      </ul>

      <hr className="accountSideNavRule" />

      <Button
        asChild
        variant="link"
        className="accountSideNavButton"
      >
        <Link
          className={clsx('accountSideNavLink', {
            'accountSideNavLink-active': pathname === '/logout',
          })}
          href="/logout"
        >
          Log out
        </Link>
      </Button>
    </nav>
  )
}
