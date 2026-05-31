'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleSignIn = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setMessage("Please fill in both email and password fields.");
      return;
    }

    setLoading(true);
    setMessage('');
    
    const { error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password: password 
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  const handleSignUp = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setMessage("Please enter an email and password to sign up.");
      return;
    }

    setLoading(true);
    setMessage('');

    // 1. Register the new account
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    // 2. AUTO LOGIN FIX: Since email confirmation is off, immediately sign them in
    if (data?.user) {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (loginError) {
        setMessage("Account created, but could not auto-login. Please try logging in manually.");
        setLoading(false);
      } else {
        router.push('/');
        router.refresh();
      }
    } else {
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex min-h-screen items-center justify-center p-4 transition-colors duration-300"
      style={{ background: "var(--bg-primary)", color: "var(--text-main)" }}
    >
      <div 
        className="w-full max-w-md space-y-4 rounded-xl p-6 shadow-xl border transition-all duration-300"
        style={{ 
          background: "var(--bg-secondary)", 
          borderColor: "var(--border)" 
        }}
      >
        <h2 className="text-2xl font-bold text-center">RAG Chatbot Access</h2>
        
        {message && (
          <p className="text-center text-sm font-medium text-amber-500 bg-amber-500/10 p-2 rounded">
            {message}
          </p>
        )}
        
        <div>
          <label className="block text-sm font-medium opacity-80">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded p-2 outline-none border focus:ring-2 focus:ring-blue-500 transition-all"
            style={{ 
              background: "var(--bg-primary)", 
              color: "var(--text-main)",
              borderColor: "var(--border)"
            }}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium opacity-80">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded p-2 outline-none border focus:ring-2 focus:ring-blue-500 transition-all"
            style={{ 
              background: "var(--bg-primary)", 
              color: "var(--text-main)",
              borderColor: "var(--border)"
            }}
            required
          />
        </div>
        
        <div className="flex gap-4 pt-2">
          <button
            type="button"
            onClick={handleSignIn}
            disabled={loading}
            className="flex-1 rounded bg-blue-600 p-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Processing...' : 'Log In'}
          </button>
          <button
            type="button"
            onClick={handleSignUp}
            disabled={loading}
            className="flex-1 rounded p-2 font-semibold border hover:bg-slate-500/10 disabled:opacity-50 transition"
            style={{ borderColor: "var(--border)" }}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}