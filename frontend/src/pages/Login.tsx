import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

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

  return (
    <div className="min-h-screen lg:flex">

      {/* ── LEFT: Purple branding panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#7C3AED] flex-col items-center justify-center px-16 min-h-screen">
        <div className="flex flex-col items-center text-center max-w-md">

          {/* Kanban icon + B1G side by side */}
          <div className="flex items-center gap-4 mb-5">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="50" height="50" rx="12" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.35" strokeWidth="1.5" />
              <rect x="10" y="17" width="9" height="20" rx="2.5" fill="white" fillOpacity="0.85" />
              <rect x="22" y="12" width="9" height="25" rx="2.5" fill="white" />
              <rect x="34" y="21" width="9" height="16" rx="2.5" fill="white" fillOpacity="0.65" />
              <rect x="10" y="10" width="33" height="2.5" rx="1.25" fill="white" fillOpacity="0.45" />
            </svg>
            <span className="text-white font-black text-5xl tracking-tight leading-none">B1G</span>
          </div>

          {/* App name — large bold white */}
          <h1 className="text-white font-bold text-4xl tracking-wide mb-5">
            Project Tracker
          </h1>

          {/* Tagline — white, centered, matching reference size */}
          <p className="text-white/100 text-lg leading-relaxed text-center">
            Manage projects, track progress, and collaborate with your team efficiently.
          </p>
        </div>
      </div>

      {/* ── RIGHT: Login form panel ── */}
      <div className="lg:w-1/2 min-h-screen bg-white flex flex-col items-center justify-center px-6 sm:px-12 lg:px-20 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile only: compact logo */}
          <div className="flex flex-col items-center mb-10 lg:hidden">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 52 52" fill="none">
                  <rect x="10" y="17" width="9" height="20" rx="2.5" fill="white" fillOpacity="0.85" />
                  <rect x="22" y="12" width="9" height="25" rx="2.5" fill="white" />
                  <rect x="34" y="21" width="9" height="16" rx="2.5" fill="white" fillOpacity="0.65" />
                </svg>
              </div>
              <span className="text-[#7C3AED] font-black text-2xl">B1G</span>
            </div>
            <p className="text-sm font-semibold text-gray-500 tracking-widest uppercase">Project Tracker</p>
          </div>

          {/* Heading */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Sign In</h2>
            <p className="text-gray-400 text-sm">Enter your account credentials</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="h-12 pl-10 rounded-xl border-gray-200 bg-gray-50 text-sm focus:bg-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="h-12 pl-10 pr-11 rounded-xl border-gray-200 bg-gray-50 text-sm focus:bg-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex justify-end pt-0.5">
                <button type="button" className="text-xs text-[#7C3AED] hover:underline font-semibold">
                  Forgot Password?
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-bold text-base text-white mt-1"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <p className="text-center text-xs text-gray-400 pt-1">
              Sign in with your company email and password.
            </p>
          </form>

          {/* Mobile footer */}
          <p className="text-center text-xs text-gray-300 mt-10 lg:hidden">
            B1G Corporation · Project Tracker
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;