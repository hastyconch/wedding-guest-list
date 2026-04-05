'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

export function AdminImportToolbar() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function logout() {
    setLoading(true)
    try {
      await fetch('/api/admin/import-logout', { method: 'POST' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/8 pb-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
          Admin
        </p>
        <h1 className="text-xl font-bold tracking-tight text-[#dbdee1]">
          Google Sheets import
        </h1>
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={loading}
        onClick={() => void logout()}
        className="border-white/10 bg-transparent text-[#b5bac1] hover:bg-[#35373c]"
      >
        {loading ? 'Signing out…' : 'Sign out'}
      </Button>
    </div>
  )
}
