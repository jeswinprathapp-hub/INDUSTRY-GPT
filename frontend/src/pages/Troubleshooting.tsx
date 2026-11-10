import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2, Play, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';

export default function Troubleshooting() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [machines, setMachines] = useState<any[]>([]);
  const [loadingMachines, setLoadingMachines] = useState(true);
  const [selectedMachineId, setSelectedMachineId] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [machineName, setMachineName] = useState<string | null>(null);

  // Helper to retrieve auth token
  const getAuthToken = async () => {
    if (session?.access_token) return session.access_token;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  };

  const fetchMachines = async () => {
    setLoadingMachines(true);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch('/api/machines/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const machineList = Array.isArray(data) ? data : [];
        setMachines(machineList);

        // Check if machine id was passed via query parameter
        const params = new URLSearchParams(location.search);
        const queryMachineId = params.get('machine');

        if (queryMachineId && machineList.some(m => m.id === queryMachineId)) {
          setSelectedMachineId(queryMachineId);
        } else if (machineList.length > 0 && !selectedMachineId) {
          // Auto-select first machine so user never gets stuck with empty choice
          setSelectedMachineId(machineList[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch machines:', err);
    } finally {
      setLoadingMachines(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, [session, location.search]);

  const handleDiagnose = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedMachineId) {
      setError("Please select a machine from the list.");
      return;
    }
    if (!symptoms.trim()) {
      setError("Please describe the observed symptoms.");
      return;
    }
    
    setLoading(true);
    setDiagnosis(null);
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Authentication required. Please sign in again.");
      }

      const response = await fetch('/api/troubleshooting/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          machine_id: selectedMachineId,
          symptoms: symptoms.trim()
        })
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      setDiagnosis(data.diagnosis);
      setMachineName(data.machine_name);
    } catch (err: any) {
      console.error('Failed to run diagnostics:', err);
      setError(err.message || 'Failed to complete diagnosis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sampleSymptoms = [
    "High-pitched whining noise and pressure drops noticeably after 10 minutes.",
    "Motor casing temperature exceeding normal operating threshold (over 85°C).",
    "Abnormal shaft vibration and intermittent cavitation noise during startup.",
    "Oil pressure warning light triggered with minor fluid leakage around seals."
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto">
      <div className="mb-8 flex items-center space-x-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 bg-surface hover:bg-surface-hover rounded-xl text-text-secondary transition-colors"
          title="Go Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center space-x-3">
            <AlertCircle className="text-primary" />
            <span>Troubleshooting Assistant</span>
          </h1>
          <p className="text-text-secondary">AI-powered root cause analysis using your machine manuals and maintenance history.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-error/10 border border-error/30 text-error px-4 py-3 rounded-xl flex items-center justify-between text-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-text-muted hover:text-white font-bold ml-4">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Diagnostic Input</h3>
            <form onSubmit={handleDiagnose} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Select Machine</label>
                {loadingMachines ? (
                  <div className="flex items-center space-x-2 py-2 px-3 text-sm text-text-muted bg-background rounded-xl border border-border">
                    <Loader2 size={16} className="animate-spin text-primary" />
                    <span>Loading machines...</span>
                  </div>
                ) : machines.length === 0 ? (
                  <div className="text-sm p-3 bg-accent/10 border border-accent/20 text-accent rounded-xl">
                    No machines found. <button type="button" onClick={() => navigate('/machines')} className="underline font-semibold ml-1">Add a machine</button> first.
                  </div>
                ) : (
                  <select 
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                    value={selectedMachineId}
                    onChange={(e) => setSelectedMachineId(e.target.value)}
                  >
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                )}
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-text-secondary">Describe Symptoms</label>
                  <span className="text-xs text-text-muted">Technical symptoms</span>
                </div>
                <textarea 
                  rows={5}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-white placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm leading-relaxed"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g., The pressure drops significantly after 10 minutes of operation, and I hear a high-pitched whining noise."
                />
              </div>

              {/* Sample symptom quick-pickers */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs text-text-muted font-medium flex items-center">
                  <Sparkles size={12} className="mr-1 text-primary" /> Example Symptoms:
                </span>
                <div className="space-y-1">
                  {sampleSymptoms.slice(0, 2).map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSymptoms(s)}
                      className="text-left w-full text-xs p-2 bg-surface hover:bg-surface-hover border border-border hover:border-primary/40 rounded-lg text-text-secondary hover:text-white transition-all truncate"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              
              <button 
                type="submit"
                disabled={loading || !selectedMachineId || !symptoms.trim()}
                className="w-full bg-primary hover:bg-primary-hover text-white px-5 py-3 rounded-xl transition-all font-medium flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg shadow-primary/20 mt-2"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> <span>Analyzing...</span></>
                ) : (
                  <><Play size={18} /> <span>Run Diagnostics</span></>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="md:col-span-2">
          {loading ? (
            <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center h-[500px]">
              <div className="w-16 h-16 relative mb-6">
                <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-r-2 border-secondary animate-spin animation-delay-150"></div>
                <div className="absolute inset-4 rounded-full border-b-2 border-white animate-spin animation-delay-300"></div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Analyzing Machine Data</h3>
              <p className="text-text-secondary text-center max-w-sm">
                Cross-referencing symptoms with technical manuals, historical maintenance logs, and safety guidelines...
              </p>
            </div>
          ) : diagnosis ? (
            <div className="glass-panel p-8 rounded-2xl animate-fade-in border-t-4 border-t-primary">
              <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-border/50">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Diagnostic Results</h2>
                  <p className="text-text-secondary text-sm">Analysis for <strong className="text-white">{machineName}</strong></p>
                </div>
              </div>
              
              <div className="prose prose-invert prose-primary max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary leading-relaxed">
                <ReactMarkdown>{diagnosis}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center h-[500px] border-dashed border-2 border-border/50">
              <AlertCircle className="w-16 h-16 text-text-muted mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">Awaiting Input</h3>
              <p className="text-text-secondary text-center max-w-sm">
                Select a machine and describe the issue to generate a step-by-step troubleshooting guide based on its documentation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
