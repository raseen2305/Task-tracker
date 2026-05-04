import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, MessageSquareWarning,
  Users, BarChart3, LogOut, Flame, ShieldCheck,
  ClipboardList, UserCog,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { cn } from '../lib/utils.js';

const NAV_BY_ROLE = {
  // Tasker: task execution + feedback
  TAKER: [
    { to: '/portal/taker',          label: 'Dashboard',   icon: LayoutDashboard },
    { to: '/portal/taker/tasks',    label: 'My Tasks',    icon: ClipboardList },
    { to: '/portal/taker/projects', label: 'My Projects', icon: FolderKanban },
    { to: '/portal/taker/feedback', label: 'Feedback',    icon: MessageSquareWarning },
  ],
  // Project Lead: create projects, SOPs, monitor QR progress
  PROJECT_LEAD: [
    { to: '/portal/lead',           label: 'Dashboard',  icon: LayoutDashboard },
    { to: '/portal/lead/projects',  label: 'Projects',   icon: FolderKanban },
    { to: '/portal/lead/analytics', label: 'Analytics',  icon: BarChart3 },
  ],
  // Quality Reviewer: review queue + analytics — no projects page
  QUALITY_REVIEWER: [
    { to: '/portal/qr',          label: 'Dashboard',    icon: LayoutDashboard },
    { to: '/portal/qr/review',   label: 'Review Queue', icon: ClipboardList },
    { to: '/portal/qr/analytics',label: 'Analytics',    icon: BarChart3 },
  ],
  // HR: team management + account control only
  HR: [
    { to: '/portal/hr',           label: 'Dashboard',  icon: LayoutDashboard },
    { to: '/portal/hr/users',     label: 'Team',       icon: Users },
    { to: '/portal/hr/batches',   label: 'Batches',    icon: FolderKanban },
    { to: '/portal/hr/accounts',  label: 'Accounts',   icon: UserCog },
    { to: '/portal/hr/analytics', label: 'Analytics',  icon: BarChart3 },
  ],
  // CEO: same as HR
  CEO: [
    { to: '/portal/hr',           label: 'Dashboard',  icon: LayoutDashboard },
    { to: '/portal/hr/users',     label: 'Team',       icon: Users },
    { to: '/portal/hr/batches',   label: 'Batches',    icon: FolderKanban },
    { to: '/portal/hr/accounts',  label: 'Accounts',   icon: UserCog },
    { to: '/portal/hr/analytics', label: 'Analytics',  icon: BarChart3 },
  ],
};

const STAGGER = ['stagger-1','stagger-2','stagger-3','stagger-4','stagger-5'];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const navItems = NAV_BY_ROLE[user?.role] || [];

  function handleLogout() { logout(); navigate('/login'); }

  return (
    <aside className="w-60 min-h-screen flex flex-col animate-slide-left"
           style={{ background: '#160d10', borderRight: '1px solid #3d1f25' }}>

      {/* Logo */}
      <div className="px-5 py-5 animate-fade-down" style={{ borderBottom: '1px solid #3d1f25' }}>
        <div className="flex items-center gap-2.5 group cursor-default">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center
                          transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
               style={{ background: 'linear-gradient(135deg, #e11d48, #9f1239)',
                        boxShadow: '0 4px 14px rgba(225,29,72,0.4)' }}>
            <Flame size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-white font-['Montserrat'] tracking-wide leading-tight">
              Ethara<span className="text-rose-400">-Sync</span>
            </p>
            <p className="text-[10px] text-gray-600 tracking-wider uppercase">RLHF Tracker</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }, i) => (
          <NavLink
            key={to}
            to={to}
            end={to.split('/').length <= 3}
            className={({ isActive }) =>
              cn('sidebar-link animate-fade-up', STAGGER[i] || '', isActive && 'active')
            }
          >
            <Icon size={15} className="flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 animate-fade-up stagger-5" style={{ borderTop: '1px solid #3d1f25' }}>
        <div className="flex items-center gap-3 px-2 py-2 mb-1 rounded-lg" style={{ cursor: 'default' }}>
          <div className="relative">
            <div className="w-8 h-8 rounded-full flex items-center justify-center
                            text-rose-400 text-xs font-bold"
                 style={{ background: 'rgba(225,29,72,0.15)', border: '1px solid rgba(225,29,72,0.3)' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2
                             bg-emerald-400 animate-pulse-slow"
                  style={{ borderColor: '#160d10' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate leading-tight">{user?.name}</p>
            <p className="text-[10px] text-gray-600 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="sidebar-link w-full group" style={{ color: '#f87171' }}>
          <LogOut size={15} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
