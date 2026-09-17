import type { ReactNode } from 'react';
import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'Speaking Coach Dashboard',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="app-header">
            <Link href="/" className="app-title">Speaking Coach</Link>
            <nav className="app-nav">
              <Link href="/">Trends</Link>
              <Link href="/patients">Patients</Link>
              <Link href="/sessions/new">+ New session</Link>
            </nav>
          </header>
          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
