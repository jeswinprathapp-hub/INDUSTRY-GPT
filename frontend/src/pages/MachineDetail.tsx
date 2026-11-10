import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Server, ArrowLeft, FileText, Activity, AlertCircle, Clock, X, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function MachineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [machine, setMachine] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLinkDocModalOpen, setIsLinkDocModalOpen] = useState(false);
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);
  const [availableDocs, setAvailableDocs] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [newRecord, setNewRecord] = useState({ maintenance_type: 'Inspection', description: '' });

  useEffect(() => {
    fetchMachine();
  }, [id]);

  const fetchMachine = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/machines/${id}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMachine(data);
      } else {
        navigate('/machines');
      }
    } catch (error) {
      console.error('Failed to fetch machine:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDocs = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`/api/documents/`, {
      headers: { 'Authorization': `Bearer ${session?.access_token}` }
    });
    if (response.ok) {
      const data = await response.json();
      setAvailableDocs(data.filter((d: any) => !d.machine_id));
    }
  };

  const handleLinkDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId) return;
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`/api/machines/${id}/link-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify({ document_id: selectedDocId })
    });
    setIsLinkDocModalOpen(false);
    fetchMachine();
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.description) return;
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`/api/machines/${id}/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify(newRecord)
    });
    setIsAddRecordModalOpen(false);
    setNewRecord({ maintenance_type: 'Inspection', description: '' });
    fetchMachine();
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin text-primary">
          <Server size={32} />
        </div>
      </div>
    );
  }

  if (!machine) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <button 
        onClick={() => navigate('/machines')}
        className="flex items-center space-x-2 text-text-secondary hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Back to Machines</span>
      </button>

      <div className="glass-panel p-8 rounded-2xl mb-8 flex items-start justify-between">
        <div className="flex items-start space-x-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Server className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">{machine.name}</h1>
            <div className="flex items-center space-x-4 text-sm text-text-secondary">
              <span className="flex items-center space-x-1"><Activity size={14} /> <span>{machine.manufacturer || 'Unknown Mfr'}</span></span>
              <span>•</span>
              <span>Model: {machine.model || 'Unknown'}</span>
              <span>•</span>
              <span>Code: {machine.machine_code || 'None'}</span>
            </div>
          </div>
        </div>
        <span className={`px-4 py-1.5 text-sm font-medium rounded-full ${
          machine.status === 'Operational' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        }`}>
          {machine.status || 'Operational'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Documents Section */}
          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-bold text-white flex items-center space-x-2">
                <FileText size={20} className="text-primary" />
                <span>Linked Documents</span>
              </h2>
              {machine.documents?.length > 0 && (
                <button onClick={() => { fetchAvailableDocs(); setIsLinkDocModalOpen(true); }} className="text-sm bg-surface-hover hover:bg-surface border border-border px-3 py-1.5 rounded-lg text-white transition-colors flex items-center">
                  <Plus size={14} className="mr-1" /> Add
                </button>
              )}
            </div>
            
            {machine.documents?.length > 0 ? (
              <div className="space-y-3">
                {machine.documents.map((doc: any) => (
                  <div key={doc.id} className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between hover:border-primary/30 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="text-white font-medium">{doc.filename}</p>
                        <p className="text-xs text-text-secondary">Type: {doc.document_type || 'Unknown'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate(`/chat?document=${doc.id}`)}
                      className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Chat
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-border/50 rounded-xl">
                <p className="text-text-secondary mb-4">No documents linked yet.</p>
                <button onClick={() => { fetchAvailableDocs(); setIsLinkDocModalOpen(true); }} className="text-sm bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg text-white transition-colors shadow-lg shadow-primary/20">Link Document</button>
              </div>
            )}
          </div>

          {/* Maintenance Section */}
          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-bold text-white flex items-center space-x-2">
                <AlertCircle size={20} className="text-primary" />
                <span>Maintenance Records</span>
              </h2>
              {machine.maintenance_records?.length > 0 && (
                <button onClick={() => setIsAddRecordModalOpen(true)} className="text-sm bg-surface-hover hover:bg-surface border border-border px-3 py-1.5 rounded-lg text-white transition-colors flex items-center">
                  <Plus size={14} className="mr-1" /> Add
                </button>
              )}
            </div>
            
            {machine.maintenance_records?.length > 0 ? (
              <div className="space-y-3">
                {machine.maintenance_records.map((record: any) => (
                  <div key={record.id} className="bg-surface border border-border rounded-xl p-4">
                    <p className="text-white">{record.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-border/50 rounded-xl">
                <p className="text-text-secondary mb-4">No maintenance records found.</p>
                <button onClick={() => setIsAddRecordModalOpen(true)} className="text-sm bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg text-white transition-colors shadow-lg shadow-primary/20">Add Record</button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar details */}
        <div className="space-y-8">
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Specifications</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-text-muted">Type</p>
                <p className="text-white font-medium">{machine.machine_type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Location</p>
                <p className="text-white font-medium">{machine.location || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Description</p>
                <p className="text-white text-sm mt-1">{machine.description || 'No description provided.'}</p>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
             <div className="space-y-2">
                <button 
                  onClick={() => navigate(`/troubleshooting?machine=${machine.id}`)}
                  className="w-full bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <Clock size={16} />
                  <span>Troubleshoot Machine</span>
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Link Document Modal */}
      {isLinkDocModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-white">Link Document</h2>
              <button onClick={() => setIsLinkDocModalOpen(false)} className="text-text-muted hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleLinkDocument} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Select Document</label>
                <select 
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  required
                >
                  <option value="">-- Choose a document --</option>
                  {availableDocs.map((doc) => (
                    <option key={doc.id} value={doc.id}>{doc.filename}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsLinkDocModalOpen(false)} className="px-4 py-2 rounded-xl text-text-secondary hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={!selectedDocId} className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-xl transition-colors font-medium disabled:opacity-50">Link Document</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Maintenance Record Modal */}
      {isAddRecordModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-white">Add Maintenance Record</h2>
              <button onClick={() => setIsAddRecordModalOpen(false)} className="text-text-muted hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddRecord} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Maintenance Type</label>
                <select 
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  value={newRecord.maintenance_type}
                  onChange={(e) => setNewRecord({...newRecord, maintenance_type: e.target.value})}
                >
                  <option value="Inspection">Inspection</option>
                  <option value="Repair">Repair</option>
                  <option value="Preventative">Preventative</option>
                  <option value="Replacement">Replacement</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Description</label>
                <textarea 
                  required
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  value={newRecord.description}
                  onChange={(e) => setNewRecord({...newRecord, description: e.target.value})}
                  placeholder="Describe the maintenance performed..."
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsAddRecordModalOpen(false)} className="px-4 py-2 rounded-xl text-text-secondary hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={!newRecord.description} className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-xl transition-colors font-medium disabled:opacity-50">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
