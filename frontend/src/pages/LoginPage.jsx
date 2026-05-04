import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth  = useAuthStore((s) => s.setAuth);
  const [form, setForm]     = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      setAuth(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(data.redirect, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4 relative overflow-hidden">

      {/* ── Animated background orbs ─────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large slow-floating rose orb */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px]
                        rounded-full blur-3xl animate-float"
             style={{ background: 'radial-gradient(circle, rgba(225,29,72,0.12) 0%, transparent 70%)' }} />
        {/* Gold orb bottom-right */}
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl animate-float"
             style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)', animationDelay: '1.5s' }} />
        {/* Small rose top-left */}
        <div className="absolute top-1/4 left-1/5 w-48 h-48 rounded-full blur-2xl animate-float"
             style={{ background: 'radial-gradient(circle, rgba(159,18,57,0.15) 0%, transparent 70%)', animationDelay: '0.8s' }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
             style={{ backgroundImage: 'linear-gradient(#e11d48 1px, transparent 1px), linear-gradient(90deg, #e11d48 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      </div>

      <div className="w-full max-w-sm relative z-10">

        {/* ── Logo ── animate-scale-in ─────────────────────────────────── */}
        <div className="text-center mb-8 animate-scale-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4
                          bg-rose-600/20 border border-rose-500/30
                          shadow-lg shadow-rose-900/40 animate-glow-rose
                          transition-transform duration-300 hover:scale-110">
            <Flame size={28} className="text-rose-400 animate-float" />
          </div>
          <h1 className="text-3xl font-bold text-white font-['Montserrat'] tracking-tight">
            Ethara<span className="text-rose-400">-Sync</span>
          </h1>
          <p className="text-sm text-gray-600 mt-1 tracking-wide">RLHF Task Tracker</p>
        </div>

        {/* ── Card ── animate-fade-up ──────────────────────────────────── */}
        <div className="animate-fade-up"
             style={{ animationDelay: '0.1s',
                      background: '#1e1115',
                      borderRadius: '1rem',
                      border: '1px solid #3d1f25',
                      padding: '1.5rem',
                      boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(225,29,72,0.05)' }}>

          <h2 className="text-lg font-semibold text-white mb-1">Sign in</h2>
          <p className="text-xs text-gray-600 mb-5">
            Your role is detected automatically from your email.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="animate-fade-up stagger-1">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email address</label>
              <input
                type="email" className="input" placeholder="you@ethara.ai"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                required autoComplete="email"
              />
            </div>

            <div className="animate-fade-up stagger-2">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} className="input pr-10"
                  placeholder="••••••••" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600
                             hover:text-gray-300 transition-all duration-200 hover:scale-110"
                  aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="animate-fade-up stagger-3">
              <button type="submit" disabled={loading}
                className="btn-primary w-full justify-center py-2.5 mt-1">
                {loading
                  ? <><Loader2 size={14} className="animate-spin" /> Signing in…</>
                  : 'Sign in →'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Demo hint ── animate-fade-up ─────────────────────────────── */}
        <div className="mt-4 p-3.5 rounded-xl border text-xs animate-fade-up"
             style={{ animationDelay: '0.25s', background: '#1e1115', borderColor: '#3d1f25' }}>
          <p className="font-medium text-gray-400 mb-2">
            Demo accounts — password: <span className="text-gold-400 font-semibold">password123</span>
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-600">
            {[
              ['CEO',    'ceo@ethara.ai'],
              ['Lead',   'lead@ethara.ai'],
              ['QR',     'qr@ethara.ai'],
              ['Tasker', 'taker@multimango.com'],
            ].map(([role, email]) => (
              <button key={email} type="button"
                onClick={() => setForm({ email, password: 'password123' })}
                className="text-left hover:text-rose-400 transition-colors duration-150 group">
                <span className="text-gray-600 group-hover:text-gray-400">{role}: </span>
                <span className="text-rose-500 group-hover:text-rose-300">{email.split('@')[0]}</span>
              </button>
            ))}
          </div>
          <p className="text-gray-700 mt-2 text-[10px]">Click any account to auto-fill</p>
        </div>
      </div>
    </div>
  );
}
