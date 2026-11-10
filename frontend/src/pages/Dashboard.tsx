import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, MessageSquare, Zap, Activity, Hexagon } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [quickQuestion, setQuickQuestion] = useState('');
  const [stats, setStats] = useState({ total: 0, processed: 0, questions: 0 });
  const [loading, setLoading] = useState(true);

  // Derive friendly display name
  const rawName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const firstName = rawName.split(' ')[0].replace(/[0-9]+$/, '').trim() || rawName.split(' ')[0];

  useEffect(() => {
    let isMounted = true;

    async function fetchStats() {
      try {
        let token = session?.access_token;
        if (!token) {
          const { data } = await supabase.auth.getSession();
          token = data.session?.access_token;
        }

        if (!token) {
          if (isMounted) setLoading(false);
          return;
        }

        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch documents and chat stats in parallel via Vite proxy
        const [docsRes, chatRes] = await Promise.all([
          fetch('/api/documents/', { headers }).catch(() => null),
          fetch('/api/chat/stats', { headers }).catch(() => null)
        ]);

        let total = 0;
        let processed = 0;
        let questions = 0;

        if (docsRes && docsRes.ok) {
          const docs = await docsRes.json();
          if (Array.isArray(docs)) {
            total = docs.length;
            processed = docs.filter((d: any) => d.status === 'processed').length;
          }
        }

        if (chatRes && chatRes.ok) {
          const chatStats = await chatRes.json();
          questions = chatStats.total_questions || 0;
        }

        if (isMounted) {
          setStats({ total, processed, questions });
        }
      } catch (e) {
        console.error("Error fetching stats", e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [session]);

  const handleQuickAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickQuestion.trim()) {
      navigate('/chat', { state: { initialQuestion: quickQuestion } });
    }
  };

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto animate-fade-in">
      {/* Header Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-3 font-display tracking-tight">
          Good morning, {firstName}
        </h1>
        <p className="text-text-secondary text-lg max-w-2xl">
          Your industrial knowledge, ready to explore.
        </p>
      </div>

      {/* Quick Ask Section */}
      <div className="mb-16">
        <h2 className="text-xl font-semibold text-white mb-6">
          Ask anything about your industrial documents
        </h2>
        <form onSubmit={handleQuickAsk} className="relative max-w-3xl group mb-6">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-primary group-focus-within:text-primary-light transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-14 pr-32 py-5 bg-surface backdrop-blur-md border border-border rounded-2xl text-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-xl"
            placeholder="What would you like to know?"
            value={quickQuestion}
            onChange={(e) => setQuickQuestion(e.target.value)}
          />
          <div className="absolute inset-y-0 right-2 flex items-center">
            <button
              type="submit"
              className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl transition-colors shadow-lg shadow-primary/25"
            >
              Ask AI
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl">
          {[
            "How do I perform preventive maintenance?",
            "What causes motor overheating?",
            "What is the emergency shutdown procedure?",
            "What is the normal operating range?"
          ].map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuickQuestion(q);
                navigate('/chat', { state: { initialQuestion: q } });
              }}
              className="text-left p-4 bg-surface/50 border border-border hover:border-primary/50 hover:bg-surface rounded-xl transition-all duration-200 text-sm text-text-secondary hover:text-white"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
        <Activity className="w-5 h-5 mr-2 text-secondary" />
        System Overview
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText className="w-16 h-16 text-white" />
          </div>
          <div className="text-sm font-medium text-text-secondary mb-1">Total Documents</div>
          <div className="text-4xl font-bold text-white font-display">
            {loading ? '-' : stats.total}
          </div>
        </div>
        
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="w-16 h-16 text-success" />
          </div>
          <div className="text-sm font-medium text-text-secondary mb-1">Processed Files</div>
          <div className="text-4xl font-bold text-white font-display">
            {loading ? '-' : stats.processed}
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <MessageSquare className="w-16 h-16 text-primary" />
          </div>
          <div className="text-sm font-medium text-text-secondary mb-1">Questions Asked</div>
          <div className="text-4xl font-bold text-white font-display">
            {loading ? '-' : stats.questions}
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group bg-gradient-to-br from-surface to-primary/10">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Hexagon className="w-16 h-16 text-primary" />
          </div>
          <div className="text-sm font-medium text-primary mb-1">System Status</div>
          <div className="text-xl font-bold text-white mt-2 flex items-center">
            <span className="w-3 h-3 rounded-full bg-success mr-2 animate-pulse"></span>
            Operational
          </div>
        </div>
      </div>
    </div>
  );
}
