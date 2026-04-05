import 'dotenv/config'

import { prisma } from '../src/lib/prisma'

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
