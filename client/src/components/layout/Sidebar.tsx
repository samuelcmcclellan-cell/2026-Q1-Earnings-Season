import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, TrendingUp, PieChart, MessageSquareQuote, Brain } from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/earnings', label: 'Earnings', icon: TrendingUp },
  { path: '/sectors', label: 'Sectors', icon: PieChart },
  { path: '/themes', label: 'Themes', icon: MessageSquareQuote },
  { path: '/ai', label: 'AI Insights', icon: Brain },
];

export function Sidebar() {
  return (
    <aside className="w-56 bg-bg-secondary border-r border-border flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-border">
        <h1 className="text-sm font-bold text-accent-blue tracking-wide">EARNINGS TRACKER</h1>
        <p className="text-[10px] text-text-muted font-mono mt-0.5">Q1 2026</p>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-accent-blue/15 text-accent-blue font-medium'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <p className="text-[10px] text-text-muted font-mono">Data: Seed (Offline)</p>
        <p className="text-[10px] text-text-muted font-mono">195 companies tracked</p>
      </div>
    </aside>
  );
}
