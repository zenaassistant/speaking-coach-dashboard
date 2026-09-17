import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listSessionsForPatient } from '../../../lib/db';
import { LAYER_A, LAYER_B, LAYER_C } from '../../../lib/rubric';
import { LayerSection } from '../../../components/TrendGrid';

export const dynamic = 'force-dynamic';

export default async function PatientDetailPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle: rawHandle } = await params;
  const handle = decodeURIComponent(rawHandle);

  let sessions;
  try {
    sessions = await listSessionsForPatient(handle);
  } catch (err: any) {
    // Rendered directly rather than thrown — Next's production error
    // boundary redacts server-error messages by default, which would hide
    // exactly the info needed to diagnose this. Temporary until confirmed
    // stable.
    return (
      <div className="card" style={{ margin: 24, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0 }}>Error loading patient</h2>
        <p style={{ fontSize: 13, color: 'var(--critical)', whiteSpace: 'pre-wrap' }}>{err.message}</p>
      </div>
    );
  }
  if (sessions.length === 0) notFound();

  return (
    <div>
      <p style={{ marginBottom: 4 }}>
        <Link href="/patients" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>← All patients</Link>
      </p>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>{handle}</h1>

      <LayerSection title="Communication competency" dims={LAYER_A} sessions={sessions} extract={(s) => s.scores.layerA} />
      <LayerSection title="Shared decision-making" dims={LAYER_B} sessions={sessions} extract={(s) => s.scores.layerB} />
      <LayerSection title="Delivery" dims={LAYER_C} sessions={sessions} extract={(s) => s.scores.layerC} />

      <section>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Sessions</h2>
        <div className="card" style={{ padding: 0 }}>
          {[...sessions].reverse().map((s, i) => (
            <Link
              key={s.id}
              href={`/sessions/${s.id}`}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', textDecoration: 'none', color: 'var(--text-primary)',
                borderTop: i === 0 ? 'none' : '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 500 }}>{s.label || `Session #${s.id}`}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.sessionDate}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
