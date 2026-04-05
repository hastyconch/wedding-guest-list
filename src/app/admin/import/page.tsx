import { Suspense } from 'react'

import { AdminImportLoginForm } from '@/components/admin-import-login-form'
import { AdminImportToolbar } from '@/components/admin-import-toolbar'
import { GoogleOAuthBanner } from '@/components/google-oauth-banner'
import { GoogleSheetsImport } from '@/components/google-sheets-import'
import { hasAdminImportSession } from '@/lib/admin-import-auth'
import { ensureDefaultScenario } from '@/lib/data/scenarios'

export const dynamic = 'force-dynamic'

export default async function AdminImportPage() {
  const authed = await hasAdminImportSession()

  if (!authed) {
    return <AdminImportLoginForm />
  }

  const scenario = await ensureDefaultScenario()

  return (
    <div className="space-y-4">
      <AdminImportToolbar />
      <Suspense fallback={null}>
        <GoogleOAuthBanner />
      </Suspense>
      <GoogleSheetsImport scenarioId={scenario.id} />
    </div>
  )
}
