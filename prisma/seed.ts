import 'dotenv/config'
import path from 'node:path'

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

import { PrismaClient } from '../src/generated/prisma/client'

function resolveSqliteFilePath(): string {
  const raw = process.env.DATABASE_URL
  if (!raw) throw new Error('DATABASE_URL is not set')
  if (!raw.startsWith('file:')) {
    throw new Error(`Expected DATABASE_URL to start with file: — got ${raw}`)
  }
  const rest = raw.slice('file:'.length)
  if (rest.startsWith('./')) {
    return path.join(process.cwd(), rest.slice(2))
  }
  return rest
}

const adapter = new PrismaBetterSqlite3({ url: resolveSqliteFilePath() })
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.scenarioGuest.deleteMany()
  await prisma.guest.deleteMany()
  await prisma.group.deleteMany()
  await prisma.scenario.deleteMany()

  const scenario = await prisma.scenario.create({
    data: {
      name: 'Base List',
      isDefault: true,
    },
  })

  console.log(
    'Seed complete: default scenario only (no sample guests). Import from Google Sheets in the app.',
    { scenarioId: scenario.id }
  )
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
