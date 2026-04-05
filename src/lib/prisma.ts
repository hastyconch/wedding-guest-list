import { loadEnvConfig } from '@next/env'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

/** Load `.env` / `.env.local` before reading `DATABASE_URL` (matches Next.js). */
loadEnvConfig(process.cwd())

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Add a PostgreSQL URL to .env.local (e.g. Neon — see README).'
    )
  }
  if (!url.startsWith('postgres://') && !url.startsWith('postgresql://')) {
    throw new Error(
      'DATABASE_URL must be postgres:// or postgresql://. This app uses PostgreSQL so everyone hitting your deploy shares one database.'
    )
  }
  return url
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createClient(): PrismaClient {
  const connectionString = getDatabaseUrl()
  const adapter = new PrismaPg({ connectionString })
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
