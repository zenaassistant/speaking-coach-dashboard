'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewSessionPage() {
  const router = useRouter();
  const [sessionType, setSessionType] = useState<'consult' | 'meeting'>('consult');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [label, setLabel] = useState('');
  const [transcript, setTranscript] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [extracting, setExtracting] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.toLowerCase();

    // .txt/.md are read directly in the browser — no round trip needed.
    if (name.endsWith('.txt') || name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = () => setTranscript(String(reader.result || ''));
      reader.readAsText(file);
      return;
    }

    // .pdf/.docx need real parsing libraries that only run server-side.
    if (name.endsWith('.pdf') || name.endsWith('.docx')) {
      setExtracting(true);
      setError('');
      try {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/extract-text', { method: 'POST', body: form });
        const body = await res.json();
        if (!res.ok) {
          setError(body.error || 'Could not extract text from that file.');
        } else {
          setTranscript(body.text || '');
        }
      } catch {
        setError('Could not extract text from that file — try again.');
      } finally {
        setExtracting(false);
      }
      return;
    }

    setError(`Unsupported file type: ${file.name}. Use .txt, .md, .pdf, or .docx.`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionType, sessionDate, label, transcript }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || 'Something went wrong');
        setBusy(false);
        return;
      }
      router.push(`/sessions/${body.session.id}`);
    } catch {
      setError('Something went wrong — try again.');
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>New session</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Paste a transcript or upload a text file. Scoring takes 10-30 seconds once submitted.
      </p>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <label style={{ flex: 1 }}>
            <div style={fieldLabel}>Session type</div>
            <select value={sessionType} onChange={(e) => setSessionType(e.target.value as any)} style={fieldInput}>
              <option value="consult">Consult (patient)</option>
              <option value="meeting">Meeting (internal/business)</option>
            </select>
          </label>
          <label style={{ flex: 1 }}>
            <div style={fieldLabel}>Date</div>
            <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} style={fieldInput} />
          </label>
        </div>
        <label style={{ display: 'block', marginBottom: 16 }}>
          <div style={fieldLabel}>Label (optional)</div>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Ketamine consult — new patient"
            style={fieldInput}
          />
        </label>
        <label style={{ display: 'block', marginBottom: 8 }}>
          <div style={fieldLabel}>Transcript</div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste the full transcript here…"
            rows={14}
            style={{ ...fieldInput, fontFamily: 'ui-monospace, monospace', fontSize: 13, resize: 'vertical' }}
          />
        </label>
        <div style={{ marginBottom: 20 }}>
          <input type="file" accept=".txt,.md,.pdf,.docx" onChange={handleFile} disabled={extracting} style={{ fontSize: 13 }} />
          <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            {extracting ? 'Extracting text…' : '.txt, .md, .pdf, .docx — or paste directly above'}
          </span>
        </div>
        {error && <p style={{ color: 'var(--critical)', fontSize: 13, marginBottom: 16 }}>{error}</p>}
        <button
          type="submit"
          disabled={busy || extracting || !transcript.trim()}
          style={{
            padding: '10px 20px', borderRadius: 8, border: 'none',
            background: 'var(--series-1)', color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: busy ? 'default' : 'pointer', opacity: busy || !transcript.trim() ? 0.6 : 1,
          }}
        >
          {busy ? 'Scoring…' : 'Score this session'}
        </button>
      </form>
    </div>
  );
}

const fieldLabel: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 };
const fieldInput: React.CSSProperties = {
  width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 14,
};
