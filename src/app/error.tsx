"use client";

import React, { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-6 bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Something went wrong
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          An unexpected error occurred while loading this page.
        </p>
        {error?.digest && (
          <p className="text-xs text-neutral-400 font-mono">Digest: {error.digest}</p>
        )}
        <button
          onClick={() => reset()}
          className="w-full py-2 px-4 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-lg text-sm font-medium transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

