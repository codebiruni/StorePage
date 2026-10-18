"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-gray-50 text-gray-900">
        <div className="max-w-md w-full p-6 bg-white rounded-xl shadow-lg border border-gray-100 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
          <p className="text-sm text-gray-600">
            A critical error occurred while loading the application.
          </p>
          {error?.digest && (
            <p className="text-xs text-gray-400 font-mono">Digest: {error.digest}</p>
          )}
          <button
            onClick={() => reset()}
            className="w-full py-2.5 px-4 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

