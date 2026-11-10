import { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Circle, Clock, FileText, Loader2, Sparkles, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';

export default function Maintenance() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [machines, setMachines] = useState<any[]>([]);
  const [newTask, setNewTask] = useState({ machine_id: '', task_name: '', description: '', due_date: '', priority: 'Medium' });

  useEffect(() => {
    fetchTasks();
    fetchMachines();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/maintenance/tasks', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMachines = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/machines/', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMachines(data);
      }
    } catch (error) {
      console.error('Failed to fetch machines:', error);
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`/api/maintenance/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      fetchTasks();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const generateReport = async () => {
    setGeneratingReport(true);
    setReport(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/maintenance/report/generate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/maintenance/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify(newTask)
      });
      setIsModalOpen(false);
      setNewTask({ machine_id: '', task_name: '', description: '', due_date: '', priority: 'Medium' });
      fetchTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'Pending');
  const completedTasks = tasks.filter(t => t.status === 'Completed');

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center space-x-3">
            <Calendar className="text-primary" />
            <span>Maintenance Operations</span>
          </h1>
          <p className="text-text-secondary">Track scheduled maintenance and generate AI operations reports.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={generateReport}
            disabled={generatingReport}
            className="bg-surface hover:bg-surface-hover border border-border text-white px-4 py-2 rounded-xl transition-colors font-medium flex items-center space-x-2 disabled:opacity-50"
          >
            {generatingReport ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} className="text-primary" />}
            <span>Generate Report</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl transition-colors font-medium flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>Schedule Task</span>
          </button>
        </div>
      </div>

      {report && (
        <div className="mb-8 glass-panel p-8 rounded-2xl animate-fade-in border-t-4 border-t-primary">
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-border/50">
            <FileText className="text-primary w-6 h-6" />
            <h2 className="text-2xl font-bold text-white">AI Operations & Maintenance Report</h2>
          </div>
          <div className="prose prose-invert prose-primary max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
          <div className="mt-6 pt-4 border-t border-border flex justify-end">
             <button onClick={() => setReport(null)} className="text-text-secondary hover:text-white transition-colors text-sm">Close Report</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Tasks */}
        <div className="glass-panel p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <Clock className="text-accent mr-2" size={20} /> Upcoming Tasks
          </h2>
          
          {loading ? (
             <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
          ) : pendingTasks.length > 0 ? (
            <div className="space-y-3">
              {pendingTasks.map(task => (
                <div key={task.id} className="bg-background border border-border rounded-xl p-4 flex items-center justify-between group hover:border-primary/50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <button onClick={() => completeTask(task.id)} className="mt-1 text-text-muted hover:text-success transition-colors">
                      <Circle size={20} />
                    </button>
                    <div>
                      <h4 className="font-medium text-white">{task.task_name}</h4>
                      <p className="text-sm text-text-secondary">{task.machines?.name} • Due: {task.due_date}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    task.priority === 'High' ? 'bg-error/10 text-error' :
                    task.priority === 'Medium' ? 'bg-accent/10 text-accent' :
                    'bg-success/10 text-success'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-xl">
              <p className="text-text-secondary">No upcoming tasks scheduled.</p>
            </div>
          )}
        </div>

        {/* Completed Tasks */}
        <div className="glass-panel p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <CheckCircle2 className="text-success mr-2" size={20} /> Completed Tasks
          </h2>
          
          {loading ? (
             <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
          ) : completedTasks.length > 0 ? (
            <div className="space-y-3">
              {completedTasks.map(task => (
                <div key={task.id} className="bg-background/50 border border-border/50 rounded-xl p-4 flex items-center space-x-4 opacity-70">
                   <CheckCircle2 size={20} className="text-success" />
                    <div>
                      <h4 className="font-medium text-white line-through">{task.task_name}</h4>
                      <p className="text-sm text-text-secondary">{task.machines?.name}</p>
                    </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-xl">
              <p className="text-text-secondary">No completed tasks yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-white">Schedule Maintenance Task</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Machine</label>
                <select 
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  value={newTask.machine_id}
                  onChange={(e) => setNewTask({...newTask, machine_id: e.target.value})}
                  required
                >
                  <option value="">-- Select Machine --</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Task Name</label>
                <input 
                  type="text"
                  required
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  value={newTask.task_name}
                  onChange={(e) => setNewTask({...newTask, task_name: e.target.value})}
                  placeholder="e.g. Monthly Lubrication"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Due Date</label>
                  <input 
                    type="date"
                    required
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Priority</label>
                  <select 
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-text-secondary hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={!newTask.machine_id || !newTask.task_name} className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-xl transition-colors font-medium disabled:opacity-50">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
