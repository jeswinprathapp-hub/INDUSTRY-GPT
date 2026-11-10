import { useState, useEffect } from 'react';
import { Plus, Server, Activity, ArrowRight, Settings, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Machines() {
  const navigate = useNavigate();
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMachine, setNewMachine] = useState({
    name: '',
    machine_code: '',
    machine_type: '',
    manufacturer: '',
    model: ''
  });

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/machines/', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMachines(data);
      }
    } catch (error) {
      console.error('Failed to fetch machines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMachine.name) return;
    
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/machines/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(newMachine)
      });
      
      if (response.ok) {
        setIsAddModalOpen(false);
        setNewMachine({ name: '', machine_code: '', machine_type: '', manufacturer: '', model: '' });
        fetchMachines();
      }
    } catch (error) {
      console.error('Failed to create machine:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">Machine Profiles</h1>
          <p className="text-text-secondary">Manage industrial equipment and centralized knowledge.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-primary/20 font-medium"
        >
          <Plus size={18} />
          <span>Add Machine</span>
        </button>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin text-primary">
              <Server size={32} />
            </div>
          </div>
        ) : machines.length === 0 ? (
          <div className="glass-panel border-dashed border-2 border-border/50 rounded-2xl p-16 text-center">
            <Server className="w-16 h-16 text-text-muted mx-auto mb-6" />
            <h3 className="text-xl font-display font-semibold text-white mb-2">No machines yet</h3>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              Create a machine profile to start organizing your industrial knowledge, manuals, and maintenance records.
            </p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center space-x-2 bg-surface hover:bg-surface-hover text-white px-5 py-2.5 rounded-xl border border-border transition-colors font-medium"
            >
              <Plus size={18} />
              <span>Add your first machine</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {machines.map((machine) => (
              <div 
                key={machine.id} 
                onClick={() => navigate(`/machines/${machine.id}`)}
                className="glass-panel p-6 rounded-2xl hover:border-primary/50 transition-colors group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Server className="w-6 h-6 text-primary" />
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    machine.status === 'Operational' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {machine.status || 'Operational'}
                  </span>
                </div>
                <h3 className="text-xl font-display font-bold text-white mb-1 group-hover:text-primary transition-colors">{machine.name}</h3>
                <p className="text-sm text-text-muted mb-4">{machine.machine_code || 'No code assigned'}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-surface rounded-lg p-3 border border-border/50">
                    <p className="text-xs text-text-muted mb-1 flex items-center gap-1.5">
                      <Settings size={12} />
                      Type
                    </p>
                    <p className="text-sm font-medium text-text-primary truncate">{machine.machine_type || 'Unknown'}</p>
                  </div>
                  <div className="bg-surface rounded-lg p-3 border border-border/50">
                    <p className="text-xs text-text-muted mb-1 flex items-center gap-1.5">
                      <Activity size={12} />
                      Manufacturer
                    </p>
                    <p className="text-sm font-medium text-text-primary truncate">{machine.manufacturer || 'Unknown'}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="text-sm text-text-secondary">View Profile</span>
                  <ArrowRight size={16} className="text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Machine Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-white">Add New Machine</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-text-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateMachine} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Machine Name *</label>
                <input 
                  type="text" 
                  required
                  value={newMachine.name}
                  onChange={(e) => setNewMachine({...newMachine, name: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g. Compressor A"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Machine Code</label>
                  <input 
                    type="text" 
                    value={newMachine.machine_code}
                    onChange={(e) => setNewMachine({...newMachine, machine_code: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="e.g. M-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
                  <input 
                    type="text" 
                    value={newMachine.machine_type}
                    onChange={(e) => setNewMachine({...newMachine, machine_type: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="e.g. Centrifugal"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Manufacturer</label>
                  <input 
                    type="text" 
                    value={newMachine.manufacturer}
                    onChange={(e) => setNewMachine({...newMachine, manufacturer: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Model</label>
                  <input 
                    type="text" 
                    value={newMachine.model}
                    onChange={(e) => setNewMachine({...newMachine, model: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-text-secondary hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || !newMachine.name}
                  className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-xl transition-colors font-medium flex items-center disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <><Loader2 size={18} className="animate-spin mr-2" /> Saving...</>
                  ) : (
                    "Save Machine"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
