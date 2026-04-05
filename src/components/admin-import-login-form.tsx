'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AdminImportLoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/import-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setMsg(data.error ?? 'Sign-in failed')
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border border-white/8 bg-[#2b2d31] p-6">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
        Admin
      </p>
      <h1 className="mt-1 text-lg font-semibold text-[#dbdee1]">
        Google Sheets import
      </h1>
      <p className="mt-2 text-sm text-[#949ba4]">
        Sign in to connect Google and import rows. Guests can use the rest of the app
        without this password.
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="admin-user" className="text-[#b5bac1]">
            Username
          </Label>
          <Input
            id="admin-user"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border-white/10 bg-[#1e1f22] text-[#dbdee1]"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin-pass" className="text-[#b5bac1]">
            Password
          </Label>
          <Input
            id="admin-pass"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-white/10 bg-[#1e1f22] text-[#dbdee1]"
            required
          />
        </div>
        {msg ? (
          <p className="text-sm text-[#f23f43]" role="alert">
            {msg}
          </p>
        ) : null}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#5865f2] font-semibold text-white hover:bg-[#4752c4]"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}
