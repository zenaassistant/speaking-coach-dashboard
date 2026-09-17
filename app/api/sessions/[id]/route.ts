import { NextRequest, NextResponse } from 'next/server';
import { getSession, deleteSession, updateSession } from '../../../../lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }
  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json({ session });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const fields: { label?: string; patientHandle?: string } = {};
  if (typeof body?.label === 'string') fields.label = body.label.trim();
  if (typeof body?.patientHandle === 'string') fields.patientHandle = body.patientHandle.trim();
  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: 'Nothing to update — provide label and/or patientHandle' }, { status: 400 });
  }
  try {
    const session = await updateSession(id, fields);
    if (!session) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ session });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }
  try {
    const deleted = await deleteSession(id);
    if (!deleted) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 500 });
  }
}
