"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Last-resort fallback — only renders if the root layout itself throws (error.tsx can't
 * catch that). Must define its own <html>/<body> since it replaces the root layout
 * entirely; deliberately skips the Google Fonts import to keep its dependency surface small.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-pink-50/10 px-4 text-zinc-900">
        <div className="w-full max-w-md rounded-2xl border border-pink-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-zinc-600">
            An unexpected error occurred while loading the app. Please try again.
          </p>
          <button
            className="mt-6 cursor-pointer rounded-md bg-pink-300 px-4 py-2 text-sm font-medium text-white"
            type="button"
            onClick={() => unstable_retry()}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
