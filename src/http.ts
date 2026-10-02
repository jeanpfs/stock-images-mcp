import { setTimeout as sleep } from "node:timers/promises";

const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);
const MAX_RETRY_AFTER_MS = 2000;

export interface FetchOptions {
  /** Per-attempt timeout. */
  timeoutMs?: number;
  retries?: number;
  baseDelayMs?: number;
}

function delayFor(response: Response | undefined, attempt: number, baseDelayMs: number): number {
  const retryAfter = Number(response?.headers?.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.min(retryAfter * 1000, MAX_RETRY_AFTER_MS);
  }
  return baseDelayMs * 2 ** attempt;
}

/**
 * GET JSON from a provider API with a per-attempt timeout and bounded retries on
 * network errors, 429 and 502/503/504. Non-retryable failures throw `<label> API error: <status>`.
 */
export async function fetchProviderJson<T>(
  label: string,
  url: string,
  init: RequestInit = {},
  { timeoutMs = 10_000, retries = 2, baseDelayMs = 300 }: FetchOptions = {}
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    let response: Response | undefined;
    try {
      response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    } catch (error) {
      if (attempt >= retries) {
        throw new Error(
          `${label} request failed: ${error instanceof Error ? error.message : error}`,
          {
            cause: error,
          }
        );
      }
    }

    if (response?.ok) return (await response.json()) as T;

    const retryable = !response || RETRYABLE_STATUS.has(response.status);
    if (!retryable || attempt >= retries) {
      throw new Error(`${label} API error: ${response?.status}`);
    }
    await sleep(delayFor(response, attempt, baseDelayMs));
  }
}
