import Link from 'next/link'

import { DiscordMobileNav, DiscordSidebarNav } from '@/components/discord-nav'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#313338] md:flex-row">
      {/* Sidebar — Discord channel list feel */}
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-black/30 bg-[#2b2d31] md:flex">
        <div className="flex h-12 items-center border-b border-black/20 px-4 shadow-sm">
          <Link
            href="/"
            className="truncate text-[15px] font-semibold tracking-tight text-[#dbdee1] hover:text-white"
          >
            Wedding planner
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-3">
          <DiscordSidebarNav />
        </div>
        <div className="border-t border-black/20 p-3">
          <p className="text-[11px] leading-snug text-[#949ba4]">
            Ceremony cap · 200 guests
          </p>
        </div>
      </aside>

      {/* Main — chat / content area */}
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col pb-16 md:pb-0">
        {/* Mobile title bar */}
        <header className="flex h-12 items-center border-b border-black/20 bg-[#2b2d31] px-4 md:hidden">
          <Link href="/" className="text-[15px] font-semibold text-[#dbdee1]">
            Wedding planner
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-6">
          {children}
        </main>
      </div>

      <DiscordMobileNav />
    </div>
  )
}
