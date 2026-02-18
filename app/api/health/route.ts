import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        status: 'healthy',
        database: 'connected',
        responseTime: `${duration}ms`,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('[Health Check] Database connection failed:', error);

    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        database: 'disconnected',
        error:
          error instanceof Error
            ? error.message
            : 'Unknown database connection error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}
