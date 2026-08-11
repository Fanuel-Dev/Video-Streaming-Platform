import React, { useState } from 'react';
import { User } from '../types';
import { Lock, Mail, User as UserIcon, X, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, token: string) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const body = isLogin ? { email, password } : { email, username, password };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-modal-overlay" className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div id="auth-modal-card" className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-8 relative overflow-hidden shadow-2xl">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-red-600 blur-md"></div>

        <button
          id="close-auth-modal"
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="auth-modal-title" className="text-2xl font-bold tracking-tight text-white mb-2 text-center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-sm text-neutral-400 text-center mb-6">
          {isLogin ? 'Sign in to sync your watch progress across devices.' : 'Get started to track your personalized analytics.'}
        </p>

        {error && (
          <div id="auth-error-alert" className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  id="auth-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="cyber_pioneer"
                  className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                id="auth-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition"
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-medium text-sm rounded-lg py-2.5 flex items-center justify-center gap-2 transition shadow-lg shadow-red-600/10 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            id="auth-switch-mode"
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-neutral-400 hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
