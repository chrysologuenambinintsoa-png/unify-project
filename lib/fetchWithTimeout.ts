export async function fetchWithTimeout(input: RequestInfo, init?: RequestInit, timeoutMs: number = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(input, { ...(init || {}), signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
}
