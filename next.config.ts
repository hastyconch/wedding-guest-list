import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /** Ensure migration SQL is present when `prisma migrate deploy` runs on Vercel cold start. */
  outputFileTracingIncludes: {
    '/*': ['./prisma/migrations/**/*'],
  },
  serverExternalPackages: ['better-sqlite3'],
}

export default nextConfig
