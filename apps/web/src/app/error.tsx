'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white">500</h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">Something went wrong</p>
        <p className="mt-2 text-gray-500 dark:text-gray-500">
          We encountered an unexpected error.
        </p>
        <button
          onClick={() => reset()}
          className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
