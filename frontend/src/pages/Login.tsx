import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message === 'Failed to fetch') {
        setError('Unable to connect to the authentication server. Please verify your Supabase configuration or internet connection.');
      } else {
        setError(error.message);
      }
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <form className="space-y-5" onSubmit={handleLogin}>
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm animate-fade-in">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Email address</label>
        <input
          type="email"
          required
          className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
        <input
          type="password"
          required
          className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary disabled:opacity-50 transition-all"
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Sign In'}
        </button>
      </div>
      <div className="text-sm text-center mt-6">
        <Link to="/register" className="font-medium text-secondary hover:text-primary transition-colors">
          Don't have an account? Sign up
        </Link>
      </div>
    </form>
  );
}
