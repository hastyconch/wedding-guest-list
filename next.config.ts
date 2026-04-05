import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /** Native `pg` driver — keep external for serverless bundles. */
  serverExternalPackages: ['pg'],
}

export default nextConfig
