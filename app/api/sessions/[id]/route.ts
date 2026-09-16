import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../../lib/db';

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
