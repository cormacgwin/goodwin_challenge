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
        // 1. Sign up with Supabase Auth
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
          // 2. Create Profile entry in our public table
          // Note: We use upsert to prevent errors if the user clicks signup multiple times
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            email: email,
            name: name,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            role: 'MEMBER' // Default role
          });

          if (profileError) {
             console.error("Profile creation failed:", profileError);
             // We don't throw here to ensure the user still sees the "Check Email" screen if auth worked
          }

          // If session is null, it means email confirmation is enabled and required
          if (!data.session) {
            setVerificationSent(true);
          } else {
            onLoginSuccess();
          }
        }
      } else {
        // Login
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
        setError('Database tables are missing. Please go to Supabase -> SQL Editor and run the setup script.');
      } else if (err.message && err.message.includes('Email not confirmed')) {
         setError('Please check your email to confirm your account before logging in.');
      } else {
        setError(err.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Check your email</h2>
          <p className="mt-2 text-sm text-gray-600">
            We sent a verification link to <strong>{email}</strong>.
          </p>
          <p className="text-sm text-gray-500">
            Please click the link in that email to activate your account. Once verified, you can log in below.
          </p>
          <Button 
            className="w-full mt-6" 
            onClick={() => {
              setVerificationSent(false);
              setMode('login');
            }}
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            {mode === 'login' ? 'Welcome Back!' : 'Join the Challenge'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {mode === 'login' 
              ? 'Sign in to log your habits.' 
              : 'Create an account to start tracking.'}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleAuth}>
          {mode === 'signup' && (
             <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-white text-gray-900"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-white text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-white text-gray-900"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" isLoading={loading}>
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>

          <div className="text-center">
            <button 
              type="button" 
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError(null);
              }} 
              className="text-sm text-indigo-600 hover:text-indigo-500"
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