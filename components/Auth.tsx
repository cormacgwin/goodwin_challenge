
import React, { useState } from 'react';
import { Button } from './Button';
import { supabase } from '../services/supabaseClient';

interface AuthProps {
  onLoginSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            }
          }
        });

        if (authError) throw authError;

        if (data.user) {
          const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
          const isFirstUser = count === 0;
          const assignedRole = isFirstUser ? 'ADMIN' : 'MEMBER';

          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: email,
            name: name,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            role: assignedRole
          });

          if (!data.session) {
            setVerificationSent(true);
          } else {
            onLoginSuccess();
          }
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('Could not find the table')) {
        setError('Database error: Tables are missing.');
      } else if (err.message && err.message.includes('Email not confirmed')) {
         setError('Please confirm your email before logging in.');
      } else {
        setError(err.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">Check your email</h2>
          <p className="mt-2 text-sm text-slate-600">
            We sent a verification link to <strong>{email}</strong>.
          </p>
          <div className="space-y-3 mt-6">
            <Button className="w-full" onClick={() => { setVerificationSent(false); setMode('login'); }}>
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 md:p-10 rounded-3xl shadow-2xl border border-slate-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {mode === 'login' ? 'Welcome Back!' : 'Join the Challenge'}
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {mode === 'login' 
              ? 'Sign in to log your habits.' 
              : 'Create an account to start tracking.'}
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleAuth}>
          {mode === 'signup' && (
             <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full border border-slate-300 rounded-xl shadow-sm py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 outline-none transition-all"
                placeholder="John Doe"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full border border-slate-300 rounded-xl shadow-sm py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 outline-none transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full border border-slate-300 rounded-xl shadow-sm py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-red-600 text-xs font-bold text-center bg-red-50 p-3 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full py-3 rounded-xl text-base font-bold shadow-lg shadow-indigo-200" isLoading={loading}>
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>

          <div className="text-center mt-6">
            <button 
              type="button" 
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError(null);
              }} 
              className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              {mode === 'login' 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
