import Link from 'next/link';
import { getSession } from '../../../lib/db';
import { LAYER_A, LAYER_B, LAYER_C, type DimensionScore, type RubricDimension } from '../../../lib/rubric';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

function ScoreRow({ dim, score }: { dim: RubricDimension; score: DimensionScore | undefined }) {
  if (!score) return null;
  const color = score.score >= 4 ? 'var(--good)' : score.score >= 3 ? 'var(--warn)' : 'var(--critical)';
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{dim.label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{score.score}/5</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{score.note}</p>
    </div>
  );
}

function LayerBlock({ title, dims, scores }: { title: string; dims: RubricDimension[]; scores: Record<string, DimensionScore> | null }) {
  if (!scores) return null;
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>{title}</h3>
      {dims.map((d) => <ScoreRow key={d.key} dim={d} score={scores[d.key]} />)}
    </div>
  );
}

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession(Number(id));
  if (!session) notFound();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span className={`chip ${session.sessionType === 'consult' ? 'chip-consult' : 'chip-meeting'}`}>
          {session.sessionType}
        </span>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{session.label || `Session #${session.id}`}</h1>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
        {session.sessionDate}
        {session.patientHandle && (
          <>
            {' · '}
            <Link href={`/patients/${encodeURIComponent(session.patientHandle)}`} style={{ color: 'var(--series-1)' }}>
              {session.patientHandle}
            </Link>
          </>
        )}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        <div>
          <LayerBlock title="Communication competency" dims={LAYER_A} scores={session.scores.layerA} />
          <LayerBlock title="Shared decision-making" dims={LAYER_B} scores={session.scores.layerB} />
          <LayerBlock title="Delivery" dims={LAYER_C} scores={session.scores.layerC} />

          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>Coaching notes</h3>
            <p style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>{session.coachingNotes}</p>
          </div>
        </div>

        <div className="card" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>Transcript</h3>
          <pre style={{ fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, monospace', margin: 0, color: 'var(--text-secondary)' }}>
            {session.transcript}
          </pre>
        </div>
      </div>
    </div>
  );
}
