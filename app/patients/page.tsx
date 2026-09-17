import Link from 'next/link';
import { listPatients } from '../../lib/db';

export const dynamic = 'force-dynamic';

export default async function PatientsPage() {
  const patients = await listPatients();

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Patients</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Grouped by the de-identified handle entered at upload — consult sessions only.
      </p>

      {patients.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-secondary)' }}>No consult sessions with a patient handle yet.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {patients.map((p, i) => (
            <Link
              key={p.patientHandle}
              href={`/patients/${encodeURIComponent(p.patientHandle)}`}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 16px', textDecoration: 'none', color: 'var(--text-primary)',
                borderTop: i === 0 ? 'none' : '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600 }}>{p.patientHandle}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {p.sessionCount} session{p.sessionCount === 1 ? '' : 's'} · last {p.lastSessionDate}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
