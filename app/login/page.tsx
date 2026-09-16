'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Incorrect password');
        setBusy(false);
        return;
      }
      router.push(params.get('next') || '/');
      router.refresh();
    } catch {
      setError('Something went wrong — try again.');
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#fcfcfb' }}>
      <form onSubmit={handleSubmit} style={{ width: 320, padding: 32, borderRadius: 12, border: '1px solid #e5e4e0', background: '#fff' }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4, color: '#0b0b0b' }}>Speaking Coach</h1>
        <p style={{ fontSize: 13, color: '#52514e', marginBottom: 20 }}>Enter the password to continue.</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d5d4cf', fontSize: 14, marginBottom: 12 }}
        />
        {error && <p style={{ color: '#e34948', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: 'none', background: '#2a78d6', color: '#fff', fontSize: 14, fontWeight: 600, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}
        >
          {busy ? 'Checking…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
