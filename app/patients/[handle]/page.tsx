import { notFound } from 'next/navigation';
import { listSessionsForPatient } from '../../../lib/db';
import PatientTrend from '../../../components/PatientTrend';

export const dynamic = 'force-dynamic';

export default async function PatientDetailPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle: rawHandle } = await params;
  const handle = decodeURIComponent(rawHandle);

  let sessions;
  try {
    sessions = await listSessionsForPatient(handle);
  } catch (err: any) {
    return (
      <div className="card" style={{ margin: 24, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0 }}>Error loading patient</h2>
        <p style={{ fontSize: 13, color: 'var(--critical)', whiteSpace: 'pre-wrap' }}>{err.message}</p>
      </div>
    );
  }
  if (sessions.length === 0) notFound();

  return <PatientTrend handle={handle} sessions={sessions} />;
}
