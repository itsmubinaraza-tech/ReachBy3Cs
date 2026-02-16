'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '4rem', fontWeight: 'bold', color: '#111827' }}>500</h1>
            <p style={{ marginTop: '1rem', fontSize: '1.25rem', color: '#6b7280' }}>
              Something went wrong
            </p>
            <button
              onClick={() => reset()}
              style={{
                marginTop: '1.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#2563eb',
                color: 'white',
                fontWeight: '500',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
