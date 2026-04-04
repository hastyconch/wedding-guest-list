import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

import { loadEnvConfig } from '@next/env'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@/generated/prisma/client'

/** Load `.env` / `.env.local` before reading `DATABASE_URL` (matches Next.js; fixes missing env in some dev setups). */
loadEnvConfig(process.cwd())

/** Local dev: project-root SQLite. Vercel serverless FS is read-only except `/tmp`, so DB must live there. */
function defaultSqliteUrl(): string {
  if (process.env.VERCEL === '1' || process.env.VERCEL === 'true') {
    return 'file:/tmp/wedding-guest.db'
  }
  return 'file:./dev.db'
}

function resolveSqliteFileUrl(): string {
  let raw = process.env.DATABASE_URL?.trim() || defaultSqliteUrl()
  if (!raw.startsWith('file:')) {
    throw new Error(`Expected DATABASE_URL to start with file: — got ${raw}`)
  }
  /** Dashboard often sets `file:./dev.db`; that path is not writable on Vercel. */
  if (
    (process.env.VERCEL === '1' || process.env.VERCEL === 'true') &&
    (raw === 'file:./dev.db' || raw === 'file:dev.db')
  ) {
    raw = 'file:/tmp/wedding-guest.db'
  }
  return raw
}

function sqliteUrlToAbsolutePath(url: string): string {
  const rest = url.slice('file:'.length)
  if (rest.startsWith('./')) {
    return path.join(process.cwd(), rest.slice(2))
  }
  return rest
}

/**
 * On Vercel, `/tmp` starts empty on cold start — apply migrations so the SQLite file exists.
 */
function ensureSqliteMigrated(fileUrl: string) {
  if (process.env.VERCEL !== '1' && process.env.VERCEL !== 'true') return

  const g = globalThis as unknown as { __weddingPrismaMigrateDone?: boolean }
  if (g.__weddingPrismaMigrateDone) return

  const absolutePath = sqliteUrlToAbsolutePath(fileUrl)

  if (existsSync(absolutePath)) {
    g.__weddingPrismaMigrateDone = true
    return
  }

  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: fileUrl },
      cwd: process.cwd(),
      timeout: 120_000,
    })
  } catch (e) {
    if (existsSync(absolutePath)) {
      g.__weddingPrismaMigrateDone = true
      return
    }
    console.error('[prisma] migrate deploy failed on Vercel', e)
    throw e
  }
  g.__weddingPrismaMigrateDone = true
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createClient(): PrismaClient {
  const fileUrl = resolveSqliteFileUrl()
  ensureSqliteMigrated(fileUrl)
  const absolutePath = sqliteUrlToAbsolutePath(fileUrl)
  const adapter = new PrismaBetterSqlite3({ url: absolutePath })
  return new PrismaClient({ adapter })
}

/** True if this client matches the current generated schema (incl. OAuthCredential). */
function clientHasOAuthDelegate(client: PrismaClient): boolean {
  const d = (client as unknown as { oAuthCredential?: { upsert?: unknown } })
    .oAuthCredential
  return typeof d?.upsert === 'function'
}

function getOrCreatePrisma(): PrismaClient {
  const existing = globalForPrisma.prisma
  if (existing && clientHasOAuthDelegate(existing)) {
    return existing
  }
  const fresh = createClient()
  globalForPrisma.prisma = fresh
  return fresh
}

export const prisma = getOrCreatePrisma()
