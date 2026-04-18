import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, TrendingUp, PieChart, MessageSquareQuote, Brain, Globe, Layers, Menu, X, Lightbulb, LineChart, BarChart3, Zap, Target } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUIStore } from '../../stores/ui.store';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/topic-of-the-week', label: 'Topic of Week', icon: Lightbulb },
  { path: '/forward-outlook', label: 'Forward Outlook', icon: LineChart },
  { path: '/bottom-up-eps', label: 'Bottom-Up EPS', icon: BarChart3 },
  { path: '/geographic', label: 'Geographic', icon: Globe },
  { path: '/surprises', label: 'Surprises', icon: Zap },
  { path: '/ratings', label: 'Ratings', icon: Target },
  { path: '/sectors', label: 'Sectors', icon: PieChart },
  { path: '/regions', label: 'Regions', icon: Globe },
  { path: '/segments', label: 'Segments', icon: Layers },
  { path: '/earnings', label: 'Earnings', icon: TrendingUp },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/themes', label: 'Themes', icon: MessageSquareQuote },
  { path: '/ai', label: 'AI Insights', icon: Brain },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="fixed top-2 left-2 z-50 p-1.5 rounded bg-bg-secondary border border-border lg:hidden"
      >
        {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={toggleSidebar} />
      )}

      <aside className={cn(
        'w-48 bg-bg-secondary border-r border-border flex flex-col h-screen sticky top-0 shrink-0 z-40 transition-transform',
        !sidebarOpen && '-translate-x-full lg:translate-x-0',
        sidebarOpen && 'translate-x-0',
        'max-lg:fixed max-lg:left-0'
      )}>
        <div className="px-3 py-3 border-b border-border">
          <h1 className="text-[11px] font-bold text-accent-blue tracking-widest uppercase">Earnings Tracker</h1>
          <p className="text-[9px] text-text-muted font-mono mt-0.5">Q1 2026</p>
        </div>
        <nav className="flex-1 p-1.5 space-y-0.5">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={() => { if (window.innerWidth < 1024) toggleSidebar(); }}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs transition-colors relative',
                  isActive
                    ? 'text-accent-blue font-medium before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[2px] before:bg-accent-blue before:rounded-full'
                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                )
              }
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-2.5 border-t border-border space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-amber" />
            <p className="text-[9px] text-text-muted font-mono">Data: Seed</p>
          </div>
          <p className="text-[9px] text-text-muted font-mono">195 companies</p>
          <div className="pt-1 border-t border-border mt-1.5">
            <p className="text-[8px] text-text-muted uppercase tracking-wider mb-0.5">Data Legend</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] text-text-muted font-mono data-seed">dotted</span>
              <span className="text-[8px] text-text-muted">= estimated</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
