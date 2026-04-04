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
