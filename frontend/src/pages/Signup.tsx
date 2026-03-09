import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      toast.success('Account created! Check your email for verification.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:flex">

      {/* ── DESKTOP ONLY: Purple left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#7C3AED] flex-col justify-center px-20 min-h-screen">
        <div className="max-w-sm">
          <h1 className="text-5xl font-bold text-white leading-tight mb-4">
            B1G Project Tracker
          </h1>
          <p className="text-white/75 text-lg leading-relaxed">
            Join your team and start tracking projects today.
          </p>
        </div>
      </div>

      {/* ── Right / full-screen panel ── */}
      <div className="lg:w-1/2 min-h-screen bg-white flex flex-col items-center justify-center px-6 sm:px-10 py-12">
        <div className="w-full max-w-sm">

          {/* MOBILE ONLY: B1G circular logo */}
          <div className="flex flex-col items-center mb-10 lg:hidden">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-3 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
            >
              <span className="text-white font-black text-2xl tracking-tight">B1G</span>
            </div>
            <p className="text-sm font-bold text-gray-600 tracking-widest uppercase">B1G Corporation</p>
            <p className="text-xs text-gray-400 tracking-wider">Project Tracker</p>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Create your account</h2>
            <p className="text-gray-500 text-sm">Get started with B1G Project Tracker</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Full Name</Label>
              <Input
                placeholder="John Doe"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                className="h-11 rounded-xl border-gray-200 bg-gray-50 text-sm focus:bg-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl border-gray-200 bg-gray-50 text-sm focus:bg-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11 rounded-xl border-gray-200 bg-gray-50 text-sm pr-10 focus:bg-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Confirm Password</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className="h-11 rounded-xl border-gray-200 bg-gray-50 text-sm pr-10 focus:bg-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl font-bold text-sm text-white !mt-6"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>

            <p className="text-center text-sm text-gray-500 pt-1">
              Already have an account?{' '}
              <Link to="/login" className="text-[#7C3AED] font-semibold hover:underline">
                Log In
              </Link>
            </p>
          </form>

          {/* Mobile footer */}
          <p className="text-center text-xs text-gray-300 mt-12 lg:hidden">
            B1G Corporation · Project Tracker
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;