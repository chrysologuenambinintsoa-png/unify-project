/**
 * Database Error Handler Utility
 * Provides helper functions to handle database connection errors gracefully
 */

export interface DatabaseError extends Error {
  code?: string;
  meta?: {
    target?: string[];
  };
}

/**
 * Check if an error is a database connection error (P1001)
 */
export function isDatabaseConnectionError(error: unknown): boolean {
  if (error instanceof Error) {
    // Check for Prisma P1001 error code (Can't reach database server)
    if ((error as DatabaseError).code === 'P1001') {
      return true;
    }
    // Check error message for connection-related keywords
    const message = error.message.toLowerCase();
    return (
      message.includes('can\'t reach database') ||
      message.includes('connection refused') ||
      message.includes('econnrefused') ||
      message.includes('timeout') ||
      message.includes('connection timeout')
    );
  }
  return false;
}

/**
 * Check if an error is a Prisma validation error
 */
export function isPrismaValidationError(error: unknown): boolean {
  if (error instanceof Error) {
    const code = (error as DatabaseError).code;
    return code === 'P2001' || code === 'P2002' || code === 'P2025';
  }
  return false;
}

/**
 * Log database error with appropriate level
 */
export function logDatabaseError(error: unknown, context: string): void {
  if (isDatabaseConnectionError(error)) {
    console.warn(`[DB Connection] ${context}:`, error);
  } else if (error instanceof Error) {
    console.error(`[DB Error] ${context}:`, error.message);
  } else {
    console.error(`[DB Error] ${context}:`, error);
  }
}

/**
 * Get appropriate HTTP status code for database error
 */
export function getDatabaseErrorStatusCode(error: unknown): number {
  if (isDatabaseConnectionError(error)) {
    return 503; // Service Unavailable
  }
  return 500; // Internal Server Error
}
