import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: 'sans-serif', textAlign: 'center', padding: '0 16px' }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7A1F2B', marginBottom: 12 }}>404</p>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', color: '#1B1B1B', marginBottom: 12 }}>Page not found</h1>
        <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 28 }}>We couldn&apos;t find what you were looking for.</p>
        <Link href="/" style={{ background: '#7A1F2B', color: '#fff', borderRadius: 999, padding: '10px 24px', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
          Go home
        </Link>
      </div>
    </main>
  );
}
