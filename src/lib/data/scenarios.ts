import { prisma } from '@/lib/prisma'

export async function getDefaultScenario() {
  const def = await prisma.scenario.findFirst({ where: { isDefault: true } })
  if (def) return def
  return prisma.scenario.findFirst({ orderBy: { createdAt: 'asc' } })
}

export async function listScenarios() {
  return prisma.scenario.findMany({ orderBy: { createdAt: 'asc' } })
}

export async function getScenario(id: string) {
  return prisma.scenario.findUnique({ where: { id } })
}

/** Create the default list if the DB has no scenarios (e.g. fresh SQLite in /tmp on serverless). */
export async function ensureDefaultScenario() {
  const existing = await getDefaultScenario()
  if (existing) return existing
  return prisma.scenario.create({
    data: {
      name: 'Base List',
      isDefault: true,
    },
  })
}

/**
 * Prefer exact id; if missing (stale client id or another instance’s DB), use default.
 * If there are no scenarios at all, create the default list so import/clear can proceed.
 */
export async function resolveScenarioForImport(requestedId: string) {
  const direct = await prisma.scenario.findUnique({ where: { id: requestedId } })
  if (direct) return direct
  const fallback = await getDefaultScenario()
  if (fallback) return fallback
  return ensureDefaultScenario()
}
