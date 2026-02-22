"use client";

import { useEffect, useState } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isChunkError, setIsChunkError] = useState(false);

  useEffect(() => {
    const chunkError =
      error.message?.includes("Loading chunk") ||
      error.message?.includes("Failed to fetch") ||
      error.message?.includes("ChunkLoadError") ||
      error.message?.includes("Loading CSS chunk") ||
      error.message?.includes("Load failed") ||
      error.name === "ChunkLoadError";

    setIsChunkError(chunkError);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030303] px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl font-bold text-red-500">Oops!</div>
        <h2 className="text-xl font-semibold text-white">
          Something went wrong
        </h2>
        {isChunkError ? (
          <p className="text-zinc-400 text-sm leading-relaxed">
            Please logout and login again to use the latest version of the
            website. Upload the same payment screenshot and details and register
            again if your past registration failed.
          </p>
        ) : (
          <p className="text-zinc-400 text-sm">
            An unexpected error occurred. Please try refreshing the page.
          </p>
        )}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Refresh Page
          </button>
          <button
            onClick={reset}
            className="w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors border border-zinc-700"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
