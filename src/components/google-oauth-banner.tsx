'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export function GoogleOAuthBanner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const g = searchParams.get('google')
  const message = searchParams.get('message')

  let visible: string | null = null
  if (g === 'connected') {
    visible = 'Google connected — you can import a spreadsheet below.'
  } else if (g === 'error') {
    let detail = 'unknown'
    if (message) {
      try {
        detail = decodeURIComponent(message)
      } catch {
        detail = message
      }
    }
    visible = `Google error: ${detail}`
  }

  if (!visible) return null

  return (
    <div
      className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
        visible.startsWith('Google error')
          ? 'border-[#f23f43]/50 bg-[#f23f43]/10 text-[#dbdee1]'
          : 'border-[#23a55a]/40 bg-[#23a55a]/10 text-[#dbdee1]'
      }`}
      role="status"
    >
      <div className="flex items-start justify-between gap-3">
        <p>{visible}</p>
        <button
          type="button"
          className="shrink-0 text-[#949ba4] underline hover:text-[#dbdee1]"
          onClick={() => router.replace(pathname || '/')}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
