import path from 'node:path'

import { loadEnvConfig } from '@next/env'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@/generated/prisma/client'

/** Load `.env` / `.env.local` before reading `DATABASE_URL` (matches Next.js; fixes missing env in some dev setups). */
loadEnvConfig(process.cwd())

function resolveSqliteFilePath(): string {
  /** Default when unset or blank (Vercel has no `.env`; empty env var in dashboard counts as set). */
  const raw =
    process.env.DATABASE_URL?.trim() || 'file:./dev.db'
  if (!raw.startsWith('file:')) {
    throw new Error(`Expected DATABASE_URL to start with file: — got ${raw}`)
  }
  const rest = raw.slice('file:'.length)
  if (rest.startsWith('./')) {
    return path.join(process.cwd(), rest.slice(2))
  }
  return rest
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createClient(): PrismaClient {
  const url = resolveSqliteFilePath()
  const adapter = new PrismaBetterSqlite3({ url })
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
