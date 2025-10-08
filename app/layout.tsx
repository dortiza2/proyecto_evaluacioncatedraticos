import './global.css';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body>
        <header style={{padding:'12px 16px', borderBottom:'1px solid #1f2937', backgroundColor:'#000', color:'#fff'}}>
          <nav style={{display:'flex', gap:12}} aria-label="Main Navigation">
            <a href="/evaluations" style={{color:'#fff'}}>Evaluación</a>
            <a href="/evaluations#stats" style={{color:'#fff'}}>Estadísticas</a>
            <a href="/evaluations#comments" style={{color:'#fff'}}>Comentarios</a>
          </nav>
        </header>
        {children}
        {/* Favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.svg" />
      </body>
    </html>
  );
}