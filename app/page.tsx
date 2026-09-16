import { listSessions } from '../lib/db';
import TrendGrid from '../components/TrendGrid';

// Always live data, never statically generated at build time (there's no
// POSTGRES_URL available during the Vercel build step, and this dashboard's
// whole point is showing current data anyway).
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const sessions = await listSessions();
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Trends</h1>
      <TrendGrid sessions={sessions} />
    </div>
  );
}
