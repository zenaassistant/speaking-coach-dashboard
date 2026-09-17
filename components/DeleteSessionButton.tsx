'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteSessionButton({ id, label }: { id: number; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${label}"? This can't be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error || 'Delete failed');
        setBusy(false);
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      alert('Delete failed — try again.');
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      style={{
        padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: busy ? 'default' : 'pointer',
        border: '1px solid var(--critical)', background: 'transparent', color: 'var(--critical)',
        opacity: busy ? 0.6 : 1,
      }}
    >
      {busy ? 'Deleting…' : 'Delete'}
    </button>
  );
}
