import { useState, useEffect } from 'react';
import { Activity, Database, Hexagon, Loader2, PieChart, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Analytics() {
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const statsRes = await fetch('/api/analytics/stats', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (statsRes.ok) setStats(await statsRes.json());
      
      const logsRes = await fetch('/api/analytics/audit-logs', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (logsRes.ok) setLogs(await logsRes.json());
      
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center space-x-3">
          <PieChart className="text-primary" />
          <span>Analytics & Audit</span>
        </h1>
        <p className="text-text-secondary">System usage statistics and recent activity logs.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
      ) : (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                <Hexagon size={24} />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total Machines</p>
                <p className="text-2xl font-bold text-white">{stats?.total_machines || 0}</p>
              </div>
            </div>
            <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4">
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center text-accent">
                <Database size={24} />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Knowledge Base Docs</p>
                <p className="text-2xl font-bold text-white">{stats?.total_documents || 0}</p>
              </div>
            </div>
            <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4">
              <div className="w-12 h-12 bg-warning/20 rounded-xl flex items-center justify-center text-warning">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Pending Tasks</p>
                <p className="text-2xl font-bold text-white">{stats?.pending_tasks || 0}</p>
              </div>
            </div>
            <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4">
              <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center text-success">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Completed Tasks</p>
                <p className="text-2xl font-bold text-white">{stats?.completed_tasks || 0}</p>
              </div>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border bg-surface/50">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <Activity className="mr-2 text-primary" size={20} /> Recent Activity (Audit Trail)
              </h2>
            </div>
            
            {logs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface/30 text-text-secondary text-sm">
                    <tr>
                      <th className="px-6 py-4 font-medium">Timestamp</th>
                      <th className="px-6 py-4 font-medium">Action</th>
                      <th className="px-6 py-4 font-medium">Resource</th>
                      <th className="px-6 py-4 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface/50 transition-colors text-sm">
                        <td className="px-6 py-4 text-text-secondary whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-medium text-white">
                          {log.action}
                        </td>
                        <td className="px-6 py-4 text-text-secondary capitalize">
                          {log.resource_type}
                        </td>
                        <td className="px-6 py-4 text-text-muted">
                          {log.metadata ? JSON.stringify(log.metadata) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-text-secondary border-t border-border/50">
                <p>No recent activity found. As you upload documents or manage machines, logs will appear here.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
