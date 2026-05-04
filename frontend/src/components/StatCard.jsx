import { cn } from '../lib/utils.js';

export default function StatCard({ label, value, icon: Icon, color = 'rose', trend, className }) {
  const colorMap = {
    rose:    { icon: 'bg-rose-500/10 text-rose-400 border-rose-500/20',    glow: '0 0 20px rgba(225,29,72,0.15)' },
    gold:    { icon: 'bg-gold-500/10 text-gold-400 border-gold-500/20',    glow: '0 0 20px rgba(245,158,11,0.15)' },
    crimson: { icon: 'bg-red-700/20 text-red-400 border-red-700/20',       glow: '0 0 20px rgba(185,28,28,0.15)' },
    blue:    { icon: 'bg-blue-500/10 text-blue-400 border-blue-500/20',    glow: '0 0 20px rgba(59,130,246,0.15)' },
    emerald: { icon: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', glow: '0 0 20px rgba(16,185,129,0.15)' },
    orange:  { icon: 'bg-orange-500/10 text-orange-400 border-orange-500/20', glow: '0 0 20px rgba(249,115,22,0.15)' },
    red:     { icon: 'bg-red-500/10 text-red-400 border-red-500/20',       glow: '0 0 20px rgba(239,68,68,0.15)' },
    yellow:  { icon: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', glow: '0 0 20px rgba(234,179,8,0.15)' },
  };

  const c = colorMap[color] || colorMap.rose;

  return (
    <div className={cn(
      'card flex items-center gap-4 group cursor-default',
      'hover:scale-[1.02] hover:-translate-y-0.5',
      className
    )}
    style={{ transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s, border-color 0.2s' }}
    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = c.glow; }}
    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; }}>
      {Icon && (
        <div className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center border flex-shrink-0',
          'transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3',
          c.icon
        )}>
          <Icon size={20} />
        </div>
      )}
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5 tabular-nums">{value ?? '—'}</p>
        {trend && <p className="text-xs text-gray-600 mt-0.5">{trend}</p>}
      </div>
    </div>
  );
}
