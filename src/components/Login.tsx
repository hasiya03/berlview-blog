import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Lock } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="modal-content w-full max-w-md p-8 shadow-xl" style={{ border: '1px solid var(--border)' }}>
        <div className="flex flex-col items-center mb-8">
          <div className="bg-accent/10 p-4 rounded-full mb-4">
            <Lock size={32} className="text-accent" />
          </div>
          <h2 className="text-2xl font-bold">Admin Login</h2>
          <p className="text-dim text-center mt-2">
            Please sign in to manage your blogs
          </p>
        </div>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="input-group">
            <label className="input-label">Email</label>
            <input 
              type="email" 
              className="input" 
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="p-3 text-red-500 bg-red-500/10 rounded-md text-sm border border-red-500/20">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            className="btn btn-primary w-full mt-4 justify-center"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
