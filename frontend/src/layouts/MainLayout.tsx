import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, MessageSquare, FileText, Hexagon, UserCircle, Wrench, Calendar, PieChart, Search } from 'lucide-react';

export default function MainLayout() {
  const { session, user, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse-soft flex flex-col items-center">
          <Hexagon className="text-primary w-12 h-12 mb-4" />
          <div className="text-text-secondary font-medium">Loading workspace...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/welcome" />;
  }

    const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/search', icon: Search, label: 'Search Knowledge' },
    { path: '/documents', icon: FileText, label: 'Knowledge Base' },
    { path: '/chat', icon: MessageSquare, label: 'Chat Assistant' },
    { path: '/machines', icon: Hexagon, label: 'Machines' },
    { path: '/maintenance', icon: Calendar, label: 'Maintenance' },
    { path: '/troubleshooting', icon: Wrench, label: 'Troubleshooting' },
    { path: '/analytics', icon: PieChart, label: 'Analytics' },
  ];

  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden">
      {/* Sidebar - Glassmorphism style */}
      <div className="w-72 bg-surface/80 backdrop-blur-xl border-r border-border flex flex-col z-10 shadow-2xl">
        
        {/* Brand */}
        <div className="p-6 flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
            <Hexagon className="text-white w-6 h-6" />
          </div>
          <div className="text-2xl font-bold font-display tracking-tight text-white">
            IndustryGPT
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1">
          {/* New Chat Button */}
          <Link 
            to="/chat"
            className="flex items-center space-x-3 px-4 py-3 mb-6 bg-primary hover:bg-primary-hover text-white rounded-xl transition-all duration-200 shadow-md shadow-primary/20"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">New Chat</span>
          </Link>
          
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-4 mt-6">Overview</div>
          {navItems.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-surface-hover text-white font-medium' 
                    : 'text-text-secondary hover:bg-surface hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary-light' : 'text-text-muted group-hover:text-text-secondary transition-colors'}`} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}

          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-4 mt-8">Operations</div>
          {navItems.slice(4).map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-surface-hover text-white font-medium' 
                    : 'text-text-secondary hover:bg-surface hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary-light' : 'text-text-muted group-hover:text-text-secondary transition-colors'}`} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Sign Out */}
        <div className="p-4 mt-auto">
          <div className="glass-panel rounded-xl p-4 flex flex-col space-y-4">
            <div className="flex items-center space-x-3 overflow-hidden">
              <UserCircle className="w-8 h-8 text-text-muted flex-shrink-0" />
              <div className="flex flex-col truncate">
                <span className="text-sm font-medium text-white truncate">
                  {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Industrial User'}
                </span>
                <span className="text-xs text-text-muted truncate">{user?.email}</span>
              </div>
            </div>
            <button 
              onClick={signOut}
              className="flex items-center justify-center space-x-2 p-2 hover:bg-red-500/10 text-text-secondary hover:text-red-400 rounded-lg transition-colors w-full text-sm font-medium"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden bg-background">
        {/* Subtle background glow */}
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary rounded-full mix-blend-screen filter blur-[200px] opacity-[0.03] pointer-events-none"></div>
        <div className="h-full overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
