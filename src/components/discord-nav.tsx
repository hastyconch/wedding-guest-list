'use client'

import { LayoutDashboard, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

const items = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/guests', label: 'Guests', icon: Users, exact: false },
]

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function DiscordSidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-0.5 px-2" aria-label="Planning">
      <p className="mb-2 px-2 pt-2 text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
        Planning
      </p>
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(pathname, href, exact)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'group flex items-center gap-3 rounded-md px-2 py-2 text-[15px] font-medium transition-colors',
              active
                ? 'bg-[#3f4248] text-[#dbdee1]'
                : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
            )}
          >
            <Icon
              className={cn(
                'size-5 shrink-0',
                active ? 'text-[#dbdee1]' : 'text-[#949ba4] group-hover:text-[#dbdee1]'
              )}
              aria-hidden
            />
            <span className="truncate">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function DiscordMobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-black/30 bg-[#2b2d31] px-2 pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Primary"
    >
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(pathname, href, exact)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold uppercase tracking-wide transition-colors',
              active ? 'text-[#dbdee1]' : 'text-[#949ba4]'
            )}
          >
            <Icon className="size-6" aria-hidden />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
