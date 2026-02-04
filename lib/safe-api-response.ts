/**
 * Safe API Response Helpers
 * Provides consistent error handling and fallback responses across all API routes
 */

import { NextResponse } from 'next/server';
import { isDatabaseConnectionError, logDatabaseError } from './db-error-handler';

/**
 * Return safe empty list response when database is unavailable
 */
export function safeListResponse(context: string) {
  return (error: unknown) => {
    logDatabaseError(error, `${context} - falling back to empty list`);
    return NextResponse.json([], { status: 200 });
  };
}

/**
 * Return safe empty object response when database is unavailable
 */
export function safeObjectResponse(defaultData: any, context: string) {
  return (error: unknown) => {
    logDatabaseError(error, `${context} - falling back to empty object`);
    return NextResponse.json(defaultData, { status: 200 });
  };
}

/**
 * Return appropriate error response based on error type
 */
export function handleDatabaseError(error: unknown, context: string) {
  logDatabaseError(error, context);
  
  if (isDatabaseConnectionError(error)) {
    return NextResponse.json(
      { error: 'Database temporarily unavailable' },
      { status: 503 }
    );
  }
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

/**
 * Safe wrapper for API GET requests with fallback
 */
export async function safeApiCall<T>(
  fn: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logDatabaseError(error, `${context} - using fallback`);
    return fallback;
  }
}
