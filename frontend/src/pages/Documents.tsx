import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, Clock, AlertCircle, X, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Documents() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
    
    // Set up realtime subscription for status updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'documents',
        },
        (payload) => {
          setDocuments(current => 
            current.map(doc => 
              doc.id === payload.new.id ? { ...doc, status: payload.new.status } : doc
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const fetchDocuments = async () => {
    try {
      let token = session?.access_token;
      if (!token) {
        const { data } = await supabase.auth.getSession();
        token = data.session?.access_token;
      }
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/documents/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (file: File) => {
    let token = session?.access_token;
    if (!token) {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;
    }
    if (!token) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload document');
      }

      await fetchDocuments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      setDragActive(false);
    }
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto animate-fade-in h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-display">Knowledge Base</h1>
          <p className="text-text-secondary mt-1">Your industrial documents, organized and searchable.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-5 h-5" /></button>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div 
        className={`mb-8 border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all duration-200 ${
          dragActive 
            ? 'border-primary bg-primary/10 scale-[1.01]' 
            : 'border-border bg-surface/50 hover:bg-surface hover:border-text-muted'
        }`}
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={onDrop}
      >
        <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mb-4 shadow-inner">
          <Upload className={`w-8 h-8 ${dragActive ? 'text-primary' : 'text-text-muted'}`} />
        </div>
        <h3 className="text-xl font-medium text-white mb-2 font-display">
          Drop your industrial documents here
        </h3>
        <p className="text-text-secondary text-sm mb-6">
          Supports PDF, DOCX, and TXT files.
        </p>
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept=".pdf,.docx,.txt"
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition-colors disabled:opacity-50 shadow-lg shadow-primary/20 flex items-center"
        >
          {uploading ? (
            <>
              <Clock className="animate-spin w-5 h-5 mr-2" />
              Processing...
            </>
          ) : (
            'Browse Files'
          )}
        </button>
      </div>

      {/* Document List */}
      <div className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border bg-surface/50">
          <h2 className="text-lg font-semibold text-white">Your Documents</h2>
        </div>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse-soft flex flex-col items-center">
              <FileText className="w-10 h-10 text-text-muted mb-2" />
              <p className="text-text-secondary">Loading documents...</p>
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-6 border border-border">
              <FileText className="w-12 h-12 text-text-muted" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Your knowledge base is empty</h3>
            <p className="text-text-secondary max-w-md">
              Upload your first industrial document above to start extracting insights and asking questions.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border hover:border-primary/30 transition-colors group">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center text-primary shadow-sm border border-border/50">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{doc.filename}</p>
                    <div className="flex items-center text-xs text-text-muted mt-0.5 space-x-2">
                      <span>Uploaded {new Date(doc.created_at).toLocaleDateString()}</span>
                      {doc.document_type && (
                        <>
                          <span>•</span>
                          <span className="bg-surface-secondary px-2 py-0.5 rounded text-text-secondary">{doc.document_type}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {doc.status === 'processed' && (
                    <>
                      <button 
                        onClick={() => navigate(`/chat?document=${doc.id}`)}
                        className="text-xs bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg flex items-center transition-colors shadow-sm"
                      >
                        <MessageSquare size={14} className="mr-1.5" /> Chat
                      </button>
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-success/10 text-success border border-success/20">
                        <CheckCircle className="w-3 h-3 mr-1" /> Ready
                      </span>
                    </>
                  )}
                  {doc.status === 'processing' && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                      <Clock className="w-3 h-3 mr-1 animate-spin" /> Processing
                    </span>
                  )}
                  {doc.status === 'failed' && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-error/10 text-error border border-error/20">
                      <AlertCircle className="w-3 h-3 mr-1" /> Failed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
