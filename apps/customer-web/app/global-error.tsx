'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Something went wrong</h2>
          <p style={{ color: '#6B7280', marginBottom: 24 }}>An unexpected error occurred. Please try again.</p>
          <button
            onClick={() => reset()}
            style={{ background: '#7A1F2B', color: '#fff', border: 'none', borderRadius: 999, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
