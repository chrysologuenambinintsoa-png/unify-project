import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Retry logic with exponential backoff
async function connectWithRetry(maxRetries = 3) {
  let retries = 0
  let lastError: Error | null = null

  while (retries < maxRetries) {
    try {
      const client = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
        errorFormat: 'minimal',
      })

      // Test the connection with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection test timeout')), 10000)
      )
      await Promise.race([client.$queryRaw`SELECT 1`, timeoutPromise])
      console.log('[Prisma] Database connection successful')
      return client
    } catch (error) {
      lastError = error as Error
      retries++
      const delay = Math.min(1000 * Math.pow(2, retries - 1), 5000)
      const minDelay = retries === 1 ? 500 : delay // Shorter delay for first retry
      console.warn(
        `[Prisma] Connection attempt ${retries}/${maxRetries} failed. Retrying in ${minDelay}ms...`,
        (lastError as Error)?.message?.substring(0, 100)
      )

      if (retries < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, minDelay))
      }
    }
  }

  console.error(
    `[Prisma] Failed to connect after ${maxRetries} attempts`,
    (lastError as Error)?.message?.substring(0, 100)
  )
  throw lastError || new Error('Failed to connect to database after maximum retries')
}

// Initialize Prisma client with retry logic
let prismaPromise: Promise<PrismaClient> | null = null

async function getPrismaClient(): Promise<PrismaClient> {
  if (!globalForPrisma.prisma) {
    // Only initialize once
    if (!prismaPromise) {
      prismaPromise = connectWithRetry()
    }
    globalForPrisma.prisma = await prismaPromise
  }
  return globalForPrisma.prisma
}

// Get or create prisma client synchronously for module exports
// This maintains compatibility with existing code
export const prisma = (globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    errorFormat: 'minimal',
    // Connection pool settings for better resource management
  })) as PrismaClient

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma as unknown as PrismaClient

  process.on('exit', async () => {
    try {
      await prisma.$disconnect()
    } catch (error) {
      console.error('[Prisma] Error disconnecting:', error)
    }
  })
}

// Export async function for use in components that support async initialization
export async function getPrisma(): Promise<PrismaClient> {
  return getPrismaClient()
}