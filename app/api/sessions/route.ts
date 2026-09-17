import { NextRequest, NextResponse } from 'next/server';
import { createSession, listSessions } from '../../../lib/db';
import { scoreTranscript } from '../../../lib/scoring';
import type { SessionType } from '../../../lib/rubric';

export async function GET(req: NextRequest) {
  const sessionType = req.nextUrl.searchParams.get('sessionType') as SessionType | null;
  try {
    const sessions = await listSessions(sessionType ? { sessionType } : undefined);
    return NextResponse.json({ sessions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load sessions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const transcript = (body?.transcript || '').trim();
  const sessionType: SessionType = body?.sessionType === 'meeting' ? 'meeting' : 'consult';
  const sessionDate = body?.sessionDate || new Date().toISOString().slice(0, 10);
  const label = (body?.label || '').trim();
  const patientHandle = (body?.patientHandle || '').trim();

  if (!transcript) {
    return NextResponse.json({ error: 'transcript is required' }, { status: 400 });
  }
  if (transcript.length < 200) {
    return NextResponse.json({ error: 'Transcript looks too short to score meaningfully (< 200 characters) — paste the full transcript.' }, { status: 400 });
  }
  // Required for consults so per-patient review actually has something to
  // group on — meetings have no patient, so nothing to require here.
  if (sessionType === 'consult' && !patientHandle) {
    return NextResponse.json({ error: 'Patient handle is required for consult sessions (an initial/code you choose — not their real name).' }, { status: 400 });
  }

  try {
    const { scores, coachingNotes } = await scoreTranscript(transcript, sessionType);
    const session = await createSession({ sessionDate, sessionType, label, patientHandle, transcript, scores, coachingNotes });
    return NextResponse.json({ session });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Scoring failed' }, { status: 500 });
  }
}
