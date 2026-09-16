import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, verifyToken } from './lib/auth';

const PUBLIC_PATHS = ['/login', '/api/login'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!(await verifyToken(token))) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
