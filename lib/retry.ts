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
      const messageLower = message.toLowerCase();
      const isRetryable =
        messageLower.includes("failed to fetch") ||
        messageLower.includes("fetch failed") ||
        messageLower.includes("load failed") ||
        messageLower.includes("loading chunk") ||
        messageLower.includes("chunkloaderror") ||
        messageLower.includes("networkerror") ||
        messageLower.includes("network") ||
        messageLower.includes("econnrefused") ||
        messageLower.includes("econnreset") ||
        messageLower.includes("socket hang up") ||
        // Next.js server action transport parse failures (often transient during deploys/restarts)
        messageLower.includes("unexpected response was received from the server") ||
        messageLower.includes("failed to execute 'json' on 'response'");

      if (!isRetryable || attempt === retries) {
        throw error;
      }

      onRetry?.(attempt + 1, error);
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }

  throw new Error("Unexpected: retry loop exited without returning or throwing");
}
