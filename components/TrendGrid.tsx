'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { LAYER_A, LAYER_B, LAYER_C, type RubricDimension, type SessionType } from '../lib/rubric';

interface SessionSummary {
  id: number;
  sessionDate: string;
  sessionType: SessionType;
  label: string;
  scores: { layerA: Record<string, { score: number }>; layerB: Record<string, { score: number }> | null; layerC: Record<string, { score: number }> };
}

function MiniTrend({ dim, points }: { dim: RubricDimension; points: { date: string; score: number }[] }) {
  const latest = points[points.length - 1];
  const color = !latest ? 'var(--text-muted)' : latest.score >= 4 ? 'var(--good)' : latest.score >= 3 ? 'var(--warn)' : 'var(--critical)';
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{dim.label}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color }}>{latest ? `${latest.score}/5` : '—'}</span>
      </div>
      {points.length > 1 ? (
        <ResponsiveContainer width="100%" height={64}>
          <LineChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <XAxis dataKey="date" hide />
            <YAxis domain={[1, 5]} hide />
            <Tooltip
              formatter={(v: number) => [`${v}/5`, dim.label]}
              labelFormatter={(l) => l}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
            />
            <Line type="monotone" dataKey="score" stroke="var(--series-1)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Need at least 2 sessions to show a trend.</p>
      )}
    </div>
  );
}

function LayerSection({ title, dims, sessions, extract }: {
  title: string;
  dims: RubricDimension[];
  sessions: SessionSummary[];
  extract: (s: SessionSummary) => Record<string, { score: number }> | null;
}) {
  const withData = sessions.filter((s) => extract(s) !== null);
  if (withData.length === 0) return null;
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>{title}</h2>
      <div className="grid">
        {dims.map((dim) => {
          const points = withData
            .map((s) => ({ date: s.sessionDate, score: extract(s)?.[dim.key]?.score }))
            .filter((p): p is { date: string; score: number } => typeof p.score === 'number');
          return <MiniTrend key={dim.key} dim={dim} points={points} />;
        })}
      </div>
    </section>
  );
}

export default function TrendGrid({ sessions }: { sessions: SessionSummary[] }) {
  const [filter, setFilter] = useState<'all' | SessionType>('all');
  const filtered = useMemo(
    () => (filter === 'all' ? sessions : sessions.filter((s) => s.sessionType === filter)),
    [sessions, filter]
  );

  if (sessions.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>No sessions scored yet.</p>
        <Link href="/sessions/new" style={{ color: 'var(--series-1)', fontWeight: 600 }}>Score your first session →</Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['all', 'consult', 'meeting'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: '1px solid var(--border)',
              background: filter === f ? 'var(--series-1)' : 'var(--surface-2)',
              color: filter === f ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {f === 'all' ? 'All' : f === 'consult' ? 'Consults' : 'Meetings'}
          </button>
        ))}
      </div>

      <LayerSection title="Communication competency" dims={LAYER_A} sessions={filtered} extract={(s) => s.scores.layerA} />
      <LayerSection title="Shared decision-making (consults only)" dims={LAYER_B} sessions={filtered} extract={(s) => s.scores.layerB} />
      <LayerSection title="Delivery" dims={LAYER_C} sessions={filtered} extract={(s) => s.scores.layerC} />

      <section>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Recent sessions</h2>
        <div className="card" style={{ padding: 0 }}>
          {[...filtered].reverse().map((s, i) => (
            <Link
              key={s.id}
              href={`/sessions/${s.id}`}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', textDecoration: 'none', color: 'var(--text-primary)',
                borderTop: i === 0 ? 'none' : '1px solid var(--border)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`chip ${s.sessionType === 'consult' ? 'chip-consult' : 'chip-meeting'}`}>{s.sessionType}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{s.label || `Session #${s.id}`}</span>
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.sessionDate}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
