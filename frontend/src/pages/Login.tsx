import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Track tasks across all departments',
    'Real-time progress monitoring',
    'Team collaboration & assignments',
  ];

  return (
    <div className="min-h-screen lg:flex">

      {/* ══════════════════════════════════════
          LEFT: Branding panel
      ══════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col items-center justify-center px-16 min-h-screen overflow-hidden"
           style={{ background: 'linear-gradient(145deg, #6d28d9 0%, #7c3aed 45%, #4f46e5 100%)' }}>

        {/* ── Geometric decoration circles ── */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/5 border border-white/10" />
        <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-white/5 border border-white/10" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-white/5 border border-white/10" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white/5 border border-white/10" />

        {/* ── Dot grid pattern ── */}
        <div className="absolute inset-0 opacity-10"
             style={{
               backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
               backgroundSize: '28px 28px',
             }} />

        {/* ── Main content ── */}
        <div className="relative z-10 flex flex-col items-start max-w-md w-full">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="h-12 w-12 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center backdrop-blur-sm shadow-lg">
              <svg width="26" height="26" viewBox="0 0 52 52" fill="none">
                <rect x="10" y="17" width="9" height="20" rx="2.5" fill="white" fillOpacity="0.85" />
                <rect x="22" y="12" width="9" height="25" rx="2.5" fill="white" />
                <rect x="34" y="21" width="9" height="16" rx="2.5" fill="white" fillOpacity="0.65" />
                <rect x="10" y="10" width="33" height="2.5" rx="1.25" fill="white" fillOpacity="0.45" />
              </svg>
            </div>
            <div>
              <p className="text-white font-black text-2xl tracking-tight leading-none">B1G</p>
              <p className="text-white/60 text-xs font-semibold tracking-[0.15em] uppercase mt-0.5">Corporation</p>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-white font-black text-5xl leading-[1.05] tracking-tight mb-4">
            Project<br />
            <span className="text-white/50">Tracker</span>
          </h1>
          <p className="text-white/70 text-base leading-relaxed mb-10 max-w-xs">
            Manage projects, track progress, and collaborate with your team — all in one place.
          </p>

          {/* Feature list */}
          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-full bg-white/15 border border-white/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
                <p className="text-white/75 text-sm font-medium">{f}</p>
              </div>
            ))}
          </div>

          {/* Bottom tag */}
          <div className="mt-12 flex items-center gap-2">
            <div className="h-px flex-1 w-12 bg-white/20" />
            <p className="text-white/30 text-xs font-semibold tracking-widest uppercase">B1G Project Tracker</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          RIGHT: Login form
      ══════════════════════════════════════ */}
      <div className="lg:w-[48%] min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 sm:px-12 lg:px-16 py-12 relative">

        {/* Subtle bg texture */}
        <div className="absolute inset-0 opacity-[0.03]"
             style={{
               backgroundImage: 'radial-gradient(circle, #7c3aed 1px, transparent 1px)',
               backgroundSize: '24px 24px',
             }} />

        <div className="relative w-full max-w-sm">

          {/* Mobile-only logo */}
          <div className="flex flex-col items-center mb-10 lg:hidden">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                <svg width="22" height="22" viewBox="0 0 52 52" fill="none">
                  <rect x="10" y="17" width="9" height="20" rx="2.5" fill="white" fillOpacity="0.85" />
                  <rect x="22" y="12" width="9" height="25" rx="2.5" fill="white" />
                  <rect x="34" y="21" width="9" height="16" rx="2.5" fill="white" fillOpacity="0.65" />
                </svg>
              </div>
              <span className="text-[#7C3AED] font-black text-2xl">B1G</span>
            </div>
            <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Project Tracker</p>
          </div>

          {/* Form heading */}
          <div className="mb-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-500 mb-1">Welcome back</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Sign In</h2>
            <p className="text-slate-400 text-sm mt-1">Enter your company credentials to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400
                                 group-focus-within:text-violet-500 transition-colors" />
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="h-12 pl-10 rounded-xl border-slate-200 bg-white text-slate-900
                             placeholder:text-slate-300 text-sm shadow-sm
                             focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20
                             transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400
                                 group-focus-within:text-violet-500 transition-colors" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="h-12 pl-10 pr-11 rounded-xl border-slate-200 bg-white text-slate-900
                             placeholder:text-slate-300 text-sm shadow-sm
                             focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20
                             transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400
                             hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl font-bold text-sm text-white
                           flex items-center justify-center gap-2
                           shadow-lg shadow-violet-500/25 transition-all duration-200
                           hover:shadow-violet-500/40 hover:scale-[1.01] active:scale-[0.99]
                           disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                style={{ background: loading ? '#7c3aed' : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' }}
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-xs text-slate-400 pt-1">
              Sign in with your company email and password.
            </p>
          </form>

          {/* Mobile footer */}
          <p className="text-center text-xs text-slate-300 mt-10 lg:hidden">
            B1G Corporation · Project Tracker
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;