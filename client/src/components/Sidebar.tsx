import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  GitBranch,
  ShoppingBag,
  Package,
  CheckSquare,
  ShieldCheck,
  BarChart3,
  Settings,
  Layers,
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'AI Task Center', href: '/task-center', icon: Sparkles, highlight: true },
  { name: 'Workflows', href: '/workflows', icon: GitBranch },
  { name: 'Orders', href: '/orders', icon: ShoppingBag },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Approval Center', href: '/approvals', icon: CheckSquare },
  { name: 'Audit History', href: '/audit', icon: ShieldCheck },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-navy-950 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white tracking-tight text-lg">FlowPilot</span>
            <span className="text-cyan-400 font-semibold ml-1 text-xs px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60">
              AI
            </span>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Autonomous Operations
        </div>
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              } ${item.highlight && !isActive ? 'text-cyan-300 hover:text-cyan-100' : ''}`
            }
          >
            <item.icon
              className={`w-5 h-5 mr-3 shrink-0 transition-colors ${
                item.highlight ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
              }`}
            />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-navy-900/40 text-xs">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span>Lifecycle Engine</span>
          <span className="text-emerald-400 font-mono text-[11px]">ACTIVE</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          From business problems to verified outcomes with minimal manual coordination.
        </p>
      </div>
    </aside>
  );
};

