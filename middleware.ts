import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, verifyToken, checkApiKey } from './lib/auth';

const PUBLIC_PATHS = ['/login', '/api/login'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // Server-to-server path (plaud-crm-sync cron) — a valid API key bypasses
  // the browser cookie entirely, checked first since there's no cookie on a
  // machine-to-machine call.
  const authHeader = req.headers.get('authorization');
  const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  if (pathname.startsWith('/api/') && checkApiKey(bearerKey)) {
    return NextResponse.next();
  }

  // Normal browser path — the UI's own fetch() calls to /api/* also rely on
  // this cookie, so API paths must still accept it (the key check above is
  // an ADDITIONAL way in, not a replacement for the cookie on API routes).
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (await verifyToken(token)) {
    return NextResponse.next();
  }

  // Neither a valid key nor a valid cookie. A machine caller wants JSON, not
  // an HTML login page — that mismatch is exactly how a bad/missing key
  // turned into a confusing 405 before (redirect preserves POST, /login has
  // no POST handler). Diagnostic fields are booleans/lengths only, never the
  // secret itself — temporary while SYNC_API_KEY auth is being verified
  // live, harmless to leave since nothing sensitive is exposed.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({
      error: 'unauthorized',
      debug: {
        authHeaderPresent: !!authHeader,
        bearerKeyLength: bearerKey?.length ?? null,
        envKeySet: !!process.env.SYNC_API_KEY,
        envKeyLength: process.env.SYNC_API_KEY?.length ?? null,
      },
    }, { status: 401 });
  }

  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
// build: 1789700932
