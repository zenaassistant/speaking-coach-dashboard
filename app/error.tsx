'use client';

// Next.js swallows server-component errors behind a bare digest hash in
// production by default — this is the supported way to surface the real
// message instead, without needing Vercel's dashboard/logs at all. Applies
// to every route under the root layout (a root-layout error itself would
// need global-error.tsx instead, but that's a different, rarer failure mode).
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card" style={{ margin: 24, padding: 24 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0 }}>Something went wrong</h2>
      <p style={{ fontSize: 13, color: 'var(--critical)', whiteSpace: 'pre-wrap' }}>{error.message}</p>
      {error.digest && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>digest: {error.digest}</p>}
      <button
        onClick={() => reset()}
        style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', fontSize: 13 }}
      >
        Try again
      </button>
    </div>
  );
}
