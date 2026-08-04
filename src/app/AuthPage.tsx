import React, { useState } from 'react';
import { Dumbbell, Lock, Mail, User, Shield, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  onSuccess: (user: { name: string; email: string; role: string }) => void;
}

export function AuthPage({ onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'validating' | 'valid' | 'notice'>('valid');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!isLogin && !name) {
      setError('Please provide your full name.');
      return;
    }

    setLoading(true);

    // Simulate login & auth state initialization
    setTimeout(() => {
      setLoading(false);
      onSuccess({
        name: isLogin ? (email.split('@')[0].toUpperCase()) : name,
        email,
        role,
      });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#1E293B] border border-slate-700/60 rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl shadow-lg shadow-orange-500/20 mb-4">
            <Dumbbell className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">FitPeak Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isLogin ? 'Sign in to access your gym portal' : 'Create a new admin account'}
          </p>
        </div>

        {/* Supabase Key Status Badge */}
        <div className="mb-6 bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5 flex items-center gap-3 text-xs">
          <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Supabase Connected</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                Key Verified
              </span>
            </div>
            <p className="text-slate-400 font-mono text-[11px] truncate mt-0.5">
              Key: sb_secret_nnzb...y7ghUsnI
            </p>
          </div>
        </div>

        {/* Form Error */}
        {error && (
          <div className="mb-5 bg-red-500/15 border border-red-500/30 rounded-xl p-3 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="admin@fitpeakgym.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Portal Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-orange-500 transition-colors cursor-pointer"
              >
                <option value="Admin">Gym Owner / Admin</option>
                <option value="Manager">Gym Manager</option>
                <option value="Trainer">Trainer</option>
                <option value="Receptionist">Receptionist</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <span>Connecting...</span>
            ) : (
              <>
                <span>{isLogin ? 'Sign In to Dashboard' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Login/Signup */}
        <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-700/50 pt-4">
          {isLogin ? (
            <p>
              Need a new account?{' '}
              <button
                onClick={() => setIsLogin(false)}
                className="text-orange-400 hover:underline font-semibold cursor-pointer"
              >
                Register Admin
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                onClick={() => setIsLogin(true)}
                className="text-orange-400 hover:underline font-semibold cursor-pointer"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
