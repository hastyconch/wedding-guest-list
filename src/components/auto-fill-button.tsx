'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

export function AutoFillButton({ scenarioId }: { scenarioId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function run() {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/scenarios/${scenarioId}/auto-fill`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.error ?? 'Failed')
        return
      }
      const w = data.warnings?.length
        ? `Done. Warnings: ${data.warnings.join(' · ')}`
        : `Done. ${data.invitedCount} invited (capacity 200).`
      setMessage(w)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        disabled={loading}
        onClick={run}
        className="min-h-10 bg-[#5865f2] font-semibold text-white shadow-sm hover:bg-[#4752c4] disabled:opacity-60"
      >
        {loading ? 'Running…' : 'Auto-fill top 200'}
      </Button>
      {message ? (
        <p className="max-w-md text-sm text-[#949ba4]" role="status">
          {message}
        </p>
      ) : null}
    </div>
  )
}
