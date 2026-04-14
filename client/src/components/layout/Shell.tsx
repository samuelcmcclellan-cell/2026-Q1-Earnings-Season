import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MarketBar } from '../market/MarketBar';

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MarketBar />
        <Header />
        <main className="flex-1 p-3 lg:p-4 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
