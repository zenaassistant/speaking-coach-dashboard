// Web Crypto API only (globalThis.crypto.subtle) — NOT Node's `crypto` module —
// so this stays compatible with the Edge runtime middleware.ts runs in.

export const AUTH_COOKIE = 'sc_auth';
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET is not set');
  return s;
}

async function hmac(message: string, key: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return Buffer.from(sig).toString('hex');
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Simple signed token: "<expiresAtMs>.<hmac>" — no session store needed for
// a single-user, single-password tool. Not a general-purpose auth system;
// exactly matches the scope (one password gate, same pattern as the other
// dashboards in this project).
export async function makeToken(): Promise<string> {
  const expires = Date.now() + TOKEN_TTL_MS;
  const sig = await hmac(String(expires), secret());
  return `${expires}.${sig}`;
}

export async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [expiresStr, sig] = token.split('.');
  if (!expiresStr || !sig) return false;
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;
  const expected = await hmac(expiresStr, secret());
  return timingSafeEqualStr(sig, expected);
}

export function checkPassword(input: string): boolean {
  const real = process.env.DASHBOARD_PASSWORD;
  if (!real) throw new Error('DASHBOARD_PASSWORD is not set');
  return timingSafeEqualStr(input, real);
}

// Server-to-server auth for the plaud-crm-sync automated pipeline (2026-09-18)
// — separate from the browser password, so the cron's credential can be
// rotated/scoped independently. Checked via `Authorization: Bearer <key>`.
export function checkApiKey(input: string | undefined): boolean {
  const real = process.env.SYNC_API_KEY;
  if (!real || !input) return false;
  return timingSafeEqualStr(input, real);
}
