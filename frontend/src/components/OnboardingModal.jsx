import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flame, ChevronDown, Loader2, Users, ShieldCheck, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';

/**
 * Shown to a tasker on first login (no project memberships yet).
 * They pick a Project Lead and a Quality Reviewer.
 * The backend finds or creates the matching project and adds them as a member.
 */
export default function OnboardingModal({ onComplete }) {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [selectedLead, setSelectedLead] = useState('');
  const [selectedQR,   setSelectedQR]   = useState('');
  const [step, setStep] = useState(1); // 1 = pick, 2 = confirm

  // Fetch all PLs and QRs
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['onboarding-users'],
    queryFn: () => api.get('/users').then((r) => r.data.users),
  });

  const leads    = (usersData || []).filter((u) => u.role === 'PROJECT_LEAD');
  const qrUsers  = (usersData || []).filter((u) => u.role === 'QUALITY_REVIEWER');

  const chosenLead = leads.find((u) => u.id === selectedLead);
  const chosenQR   = qrUsers.find((u) => u.id === selectedQR);

  const joinMutation = useMutation({
    mutationFn: (payload) => api.post('/projects/join', payload),
    onSuccess: () => {
      toast.success('Welcome! Your workspace is ready.');
      qc.invalidateQueries({ queryKey: ['my-projects'] });
      onComplete();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to join project'),
  });

  function handleConfirm() {
    if (!selectedLead || !selectedQR) return toast.error('Please select both a Project Lead and a Quality Reviewer');
    joinMutation.mutate({ leadId: selectedLead, qrId: selectedQR });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
         style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md modal-card"
           style={{ background: '#1e1115', border: '1px solid #3d1f25', borderRadius: '1.25rem',
                    padding: '2rem', boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(225,29,72,0.08)' }}>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3"
               style={{ background: 'linear-gradient(135deg,#e11d48,#9f1239)', boxShadow: '0 4px 16px rgba(225,29,72,0.4)' }}>
            <Flame size={20} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-white font-['Montserrat']">Welcome, {user?.name?.split(' ')[0]}!</h2>
          <p className="text-xs text-gray-500 mt-1">
            Choose your Project Lead and Quality Reviewer to get started.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-rose-400" />
          </div>
        ) : step === 1 ? (
          <div className="space-y-4">

            {/* Project Lead picker */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
                <Users size={12} className="text-rose-400" />
                Project Lead <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                {leads.length === 0 && <p className="text-xs text-gray-600 text-center py-3">No project leads available</p>}
                {leads.map((u) => (
                  <button key={u.id} type="button"
                    onClick={() => setSelectedLead(u.id)}
                    className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                    style={{
                      background: selectedLead === u.id ? 'rgba(225,29,72,0.1)' : '#261519',
                      borderColor: selectedLead === u.id ? 'rgba(225,29,72,0.4)' : '#3d1f25',
                    }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                         style={{ background: 'rgba(225,29,72,0.15)', color: '#fb7185' }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{u.name}</p>
                      <p className="text-xs text-gray-600 truncate">{u.email}</p>
                    </div>
                    {selectedLead === u.id && <CheckCircle2 size={15} className="text-rose-400 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* QR picker */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-2">
                <ShieldCheck size={12} className="text-gold-400" />
                Quality Reviewer <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                {qrUsers.length === 0 && <p className="text-xs text-gray-600 text-center py-3">No quality reviewers available</p>}
                {qrUsers.map((u) => (
                  <button key={u.id} type="button"
                    onClick={() => setSelectedQR(u.id)}
                    className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                    style={{
                      background: selectedQR === u.id ? 'rgba(245,158,11,0.08)' : '#261519',
                      borderColor: selectedQR === u.id ? 'rgba(245,158,11,0.35)' : '#3d1f25',
                    }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                         style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{u.name}</p>
                      <p className="text-xs text-gray-600 truncate">{u.email}</p>
                    </div>
                    {selectedQR === u.id && <CheckCircle2 size={15} className="text-gold-400 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                if (!selectedLead || !selectedQR) return toast.error('Select both a Project Lead and a Quality Reviewer');
                setStep(2);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 text-white font-semibold text-sm transition-all mt-2"
              style={{ boxShadow: '0 4px 16px rgba(225,29,72,0.3)' }}
            >
              Continue →
            </button>
          </div>
        ) : (
          /* Step 2: Confirm */
          <div className="space-y-4">
            <p className="text-xs text-gray-500 text-center mb-2">Confirm your workspace setup</p>

            <div className="rounded-xl border p-4 space-y-3" style={{ background: '#261519', borderColor: '#3d1f25' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                     style={{ background: 'rgba(225,29,72,0.15)', color: '#fb7185' }}>
                  {chosenLead?.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider">Project Lead</p>
                  <p className="text-sm font-semibold text-white">{chosenLead?.name}</p>
                </div>
              </div>
              <div className="h-px" style={{ background: '#3d1f25' }} />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                     style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>
                  {chosenQR?.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider">Quality Reviewer</p>
                  <p className="text-sm font-semibold text-white">{chosenQR?.name}</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600 text-center">
              Your tasks will be reviewed by <span className="text-gold-400">{chosenQR?.name}</span> and
              managed by <span className="text-rose-400">{chosenLead?.name}</span>.
            </p>

            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1 justify-center text-xs">
                ← Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={joinMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 text-white font-semibold text-sm transition-all disabled:opacity-50"
              >
                {joinMutation.isPending
                  ? <><Loader2 size={13} className="animate-spin" /> Setting up…</>
                  : <><CheckCircle2 size={13} /> Confirm & Start</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
