import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, checkPassword, makeToken } from '../../../lib/auth';

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: '' }));
  if (typeof password !== 'string' || !checkPassword(password)) {
    return NextResponse.json({ ok: false, error: 'Incorrect password' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await makeToken(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
  return res;
}
