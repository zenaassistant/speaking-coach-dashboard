'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SessionHeader({
  id, sessionType, sessionDate, label: initialLabel, patientHandle: initialHandle,
}: {
  id: number;
  sessionType: 'consult' | 'meeting';
  sessionDate: string;
  label: string;
  patientHandle: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(initialLabel);
  const [patientHandle, setPatientHandle] = useState(initialHandle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const displayTitle = initialLabel || `Session #${id}`;

  async function handleSave() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, patientHandle }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || 'Save failed');
        setBusy(false);
        return;
      }
      setEditing(false);
      setBusy(false);
      router.refresh();
    } catch {
      setError('Save failed — try again.');
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${displayTitle}"? This can't be undone.`)) return;
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

  if (editing) {
    return (
      <div className="card" style={{ marginBottom: 4, padding: 16 }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Label</div>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            autoFocus
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 14 }}
          />
        </div>
        {sessionType === 'consult' && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Patient handle</div>
            <input
              type="text"
              value={patientHandle}
              onChange={(e) => setPatientHandle(e.target.value)}
              placeholder="e.g. J.A. or pt-014 — not their real name"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 14 }}
            />
          </div>
        )}
        {error && <p style={{ color: 'var(--critical)', fontSize: 12, marginBottom: 8 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleSave}
            disabled={busy}
            style={{ padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'var(--series-1)', color: '#fff' }}
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => { setEditing(false); setLabel(initialLabel); setPatientHandle(initialHandle); setError(''); }}
            disabled={busy}
            style={{ padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span className={`chip ${sessionType === 'consult' ? 'chip-consult' : 'chip-meeting'}`}>{sessionType}</span>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, flex: 1 }}>{displayTitle}</h1>
        <button
          onClick={() => setEditing(true)}
          style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)' }}
        >
          Rename
        </button>
        <button
          onClick={handleDelete}
          disabled={busy}
          style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: busy ? 'default' : 'pointer', border: '1px solid var(--critical)', background: 'transparent', color: 'var(--critical)', opacity: busy ? 0.6 : 1 }}
        >
          {busy ? 'Deleting…' : 'Delete'}
        </button>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
        {sessionDate}
        {initialHandle && (
          <>
            {' · '}
            <Link href={`/patients/${encodeURIComponent(initialHandle)}`} style={{ color: 'var(--series-1)' }}>{initialHandle}</Link>
          </>
        )}
      </p>
    </div>
  );
}
