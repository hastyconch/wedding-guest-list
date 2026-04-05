import { google } from 'googleapis'

const OAUTH_ID = 'google'

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
] as const

export function getAppBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return url.replace(/\/$/, '')
}

export function getGoogleRedirectUri(): string {
  return `${getAppBaseUrl()}/api/google/callback`
}

export function assertGoogleEnv(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId?.trim() || !clientSecret?.trim()) {
    throw new Error(
      'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET. Local: add both to .env.local next to package.json and restart npm run dev. Vercel: Project → Settings → Environment Variables, then redeploy. See .env.example.'
    )
  }
  return { clientId, clientSecret }
}

export function createOAuth2Client() {
  const { clientId, clientSecret } = assertGoogleEnv()
  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    getGoogleRedirectUri()
  )
}

export { OAUTH_ID }
