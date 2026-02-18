export async function fetchWithTimeout(
  input: RequestInfo,
  init?: RequestInit,
  timeoutMs: number = 30000
) {
  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | null = null;

  try {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(input, {
      ...(init || {}),
      signal: controller.signal,
    });
    if (timeoutId) clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Fetch with exponential backoff retry logic
 * @param input - Request URL or info
 * @param init - Request init options
 * @param timeoutMs - Timeout per request (default 30000ms)
 * @param maxRetries - Maximum number of retries (default 3)
 * @returns Response
 */
export async function fetchWithRetry(
  input: RequestInfo,
  init?: RequestInit,
  timeoutMs: number = 30000,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(input, init, timeoutMs);
      // Return immediately on success
      if (response.ok) {
        return response;
      }
      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }
      // For server errors (5xx), continue to retry
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // Don't retry on timeout for now, just throw
      if (lastError.message.includes('timeout')) {
        throw lastError;
      }
    }

    // Wait before retrying (exponential backoff: 1s, 2s, 4s)
    if (attempt < maxRetries) {
      const backoffMs = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError || new Error('Failed to fetch after retries');
}
