"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ margin: 0 }}>Something went wrong</h1>
      <p>Sorry — an unexpected error occurred.</p>

      {isDev && (
        <pre
          style={{
            whiteSpace: "pre-wrap",
            background: "#f6f8fa",
            padding: 12,
            borderRadius: 6,
            overflow: "auto",
          }}
        >
          {error?.message}
          {error?.stack ? "\n\n" + error.stack : null}
        </pre>
      )}

      <button
        onClick={() => reset()}
        style={{
          marginTop: 12,
          padding: "8px 12px",
          borderRadius: 6,
          border: "1px solid #ccc",
          background: "#fff",
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </main>
  );
}
