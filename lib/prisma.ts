import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = (globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})) as PrismaClient & {
  videoCall: any
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma as unknown as PrismaClient

// Ensure Prisma disconnects on exit
if (process.env.NODE_ENV !== 'production') {
  process.on('exit', async () => {
    await prisma.$disconnect()
  })
}