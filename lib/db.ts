import { Pool } from 'pg';
import type { Session, SessionScores, SessionType } from './rubric';

// Works with any standard Postgres connection string — Vercel's Postgres
// (Neon) storage integration sets POSTGRES_URL automatically once added to
// the project. `sslmode=require` is what Neon/Vercel Postgres expects; the
// query param is ignored harmlessly by a plain local Postgres.
declare global {
  // eslint-disable-next-line no-var
  var __scDbPool: Pool | undefined;
}

function pool(): Pool {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not set — add the Postgres storage integration in the Vercel dashboard (Storage tab) and connect it to this project.');
  }
  if (!global.__scDbPool) {
    global.__scDbPool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      // node-postgres does NOT reliably parse `sslmode=require` out of the
      // connection string on its own — Neon/Vercel Postgres requires TLS, so
      // this needs to be explicit or every query fails with a connection
      // error. rejectUnauthorized:false matches what Vercel's own docs use
      // for this exact integration (Neon's cert chain isn't in Node's
      // default trust store in every runtime).
      ssl: { rejectUnauthorized: false },
    });
  }
  return global.__scDbPool;
}

let schemaReady: Promise<void> | null = null;

// Lazily creates the table on first real query rather than requiring a
// separate migration step — this is a single-table, single-user app, so a
// manual migration pipeline would be pure ceremony.
function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = pool().query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        session_date DATE NOT NULL,
        session_type TEXT NOT NULL CHECK (session_type IN ('consult', 'meeting')),
        label TEXT NOT NULL DEFAULT '',
        transcript TEXT NOT NULL,
        scores JSONB NOT NULL,
        coaching_notes TEXT NOT NULL DEFAULT ''
      );
      -- De-identified index key for consult sessions (initials/code chosen by
      -- Julian, deliberately never a real patient name — see 2026-09-17
      -- decision). Nullable/blank for meetings, which have no patient.
      -- IF NOT EXISTS makes this safe to run against the table that already
      -- existed before this column was added.
      ALTER TABLE sessions ADD COLUMN IF NOT EXISTS patient_handle TEXT NOT NULL DEFAULT '';
      CREATE INDEX IF NOT EXISTS sessions_patient_handle_idx ON sessions (patient_handle) WHERE patient_handle != '';
    `).then(() => undefined);
  }
  return schemaReady;
}

function rowToSession(row: any): Session {
  return {
    id: row.id,
    createdAt: row.created_at.toISOString ? row.created_at.toISOString() : row.created_at,
    sessionDate: row.session_date.toISOString ? row.session_date.toISOString().slice(0, 10) : row.session_date,
    sessionType: row.session_type,
    label: row.label,
    patientHandle: row.patient_handle || '',
    transcript: row.transcript,
    scores: row.scores,
    coachingNotes: row.coaching_notes,
  };
}

export async function createSession(input: {
  sessionDate: string;
  sessionType: SessionType;
  label: string;
  patientHandle: string;
  transcript: string;
  scores: SessionScores;
  coachingNotes: string;
}): Promise<Session> {
  await ensureSchema();
  const res = await pool().query(
    `INSERT INTO sessions (session_date, session_type, label, patient_handle, transcript, scores, coaching_notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [input.sessionDate, input.sessionType, input.label, input.patientHandle, input.transcript, JSON.stringify(input.scores), input.coachingNotes]
  );
  return rowToSession(res.rows[0]);
}

export async function listSessions(filter?: { sessionType?: SessionType }): Promise<Session[]> {
  await ensureSchema();
  const res = filter?.sessionType
    ? await pool().query('SELECT * FROM sessions WHERE session_type = $1 ORDER BY session_date ASC, id ASC', [filter.sessionType])
    : await pool().query('SELECT * FROM sessions ORDER BY session_date ASC, id ASC');
  return res.rows.map(rowToSession);
}

export async function getSession(id: number): Promise<Session | null> {
  await ensureSchema();
  const res = await pool().query('SELECT * FROM sessions WHERE id = $1', [id]);
  return res.rows[0] ? rowToSession(res.rows[0]) : null;
}

export async function deleteSession(id: number): Promise<boolean> {
  await ensureSchema();
  const res = await pool().query('DELETE FROM sessions WHERE id = $1', [id]);
  return (res.rowCount ?? 0) > 0;
}

export interface PatientSummary {
  patientHandle: string;
  sessionCount: number;
  lastSessionDate: string;
}

// Distinct consult patient handles, most-recently-seen first. Meetings have
// no patient_handle (blank), so they're excluded by construction.
export async function listPatients(): Promise<PatientSummary[]> {
  await ensureSchema();
  const res = await pool().query(
    `SELECT patient_handle, COUNT(*)::int AS session_count, MAX(session_date) AS last_session_date
     FROM sessions
     WHERE session_type = 'consult' AND patient_handle != ''
     GROUP BY patient_handle
     ORDER BY last_session_date DESC`
  );
  return res.rows.map((row: any) => ({
    patientHandle: row.patient_handle,
    sessionCount: row.session_count,
    lastSessionDate: row.last_session_date.toISOString ? row.last_session_date.toISOString().slice(0, 10) : row.last_session_date,
  }));
}

export async function listSessionsForPatient(patientHandle: string): Promise<Session[]> {
  await ensureSchema();
  const res = await pool().query(
    `SELECT * FROM sessions WHERE session_type = 'consult' AND patient_handle = $1 ORDER BY session_date ASC, id ASC`,
    [patientHandle]
  );
  return res.rows.map(rowToSession);
}
