import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /** Migrations + baked SQLite template copied to `/tmp` at runtime on Vercel. */
  outputFileTracingIncludes: {
    '/*': ['./prisma/migrations/**/*', './prisma/build.db'],
  },
  serverExternalPackages: ['better-sqlite3'],
}

export default nextConfig
