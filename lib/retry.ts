/**
 * Retries an async operation when it fails due to transient errors
 * (e.g. container restarts, chunk failures, network blips during deployments).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; delayMs?: number; onRetry?: (attempt: number, error: unknown) => void } = {}
): Promise<T> {
  const { retries = 2, delayMs = 1500, onRetry } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const isRetryable =
        message.includes("Failed to fetch") ||
        message.includes("fetch failed") ||
        message.includes("Load failed") ||
        message.includes("Loading chunk") ||
        message.includes("ChunkLoadError") ||
        message.includes("NetworkError") ||
        message.includes("network") ||
        message.includes("ECONNREFUSED") ||
        message.includes("ECONNRESET") ||
        message.includes("socket hang up");

      if (!isRetryable || attempt === retries) {
        throw error;
      }

      onRetry?.(attempt + 1, error);
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }

  throw new Error("Unexpected: retry loop exited without returning or throwing");
}
