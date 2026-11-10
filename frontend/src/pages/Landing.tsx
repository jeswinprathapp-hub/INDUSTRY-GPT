import { Link } from 'react-router-dom';
import { Hexagon, ArrowRight, Database, Search, Cpu, FileText } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-text-primary overflow-hidden font-sans">
      {/* Navbar */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center relative z-20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Hexagon className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold font-display tracking-tight text-white">IndustryGPT</span>
        </div>
        <div className="flex items-center space-x-6">
          <Link to="/login" className="text-text-secondary hover:text-white font-medium transition-colors">Sign In</Link>
          <Link to="/register" className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors shadow-lg shadow-primary/25">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-20 pb-32">
        {/* Background Gradients */}
        <div className="absolute top-[10%] left-[50%] translate-x-[-50%] w-[800px] h-[800px] bg-primary rounded-full mix-blend-screen filter blur-[150px] opacity-[0.07] pointer-events-none"></div>
        <div className="absolute top-[40%] right-[0%] w-[600px] h-[600px] bg-secondary rounded-full mix-blend-screen filter blur-[150px] opacity-[0.05] pointer-events-none"></div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 bg-surface/50 border border-border px-4 py-2 rounded-full mb-8 backdrop-blur-sm animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
            <span className="text-sm font-medium text-text-secondary">IndustryGPT v2.0 is now live</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 font-display tracking-tight leading-tight animate-slide-in">
            Industrial knowledge.<br />One conversation away.
          </h1>
          
          <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Ask questions across manuals, SOPs, maintenance records and technical documentation using AI-powered semantic search.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium text-lg transition-all shadow-xl shadow-primary/20 flex items-center justify-center group">
              Start with IndustryGPT
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto px-8 py-4 bg-surface hover:bg-surface-hover border border-border text-white rounded-xl font-medium text-lg transition-colors flex items-center justify-center">
              Explore how it works
            </a>
          </div>
        </div>
      </div>

      {/* RAG Workflow Section */}
      <div id="how-it-works" className="py-24 bg-surface/30 border-y border-border relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-display">Intelligent RAG Pipeline</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">How IndustryGPT turns your static PDF and DOCX files into an interactive, context-aware AI assistant.</p>
          </div>

          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-8 md:space-y-0">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center max-w-[200px] animate-fade-in">
              <div className="w-20 h-20 bg-surface border border-border rounded-2xl flex items-center justify-center mb-6 shadow-lg relative group">
                <FileText className="w-10 h-10 text-text-secondary group-hover:text-primary transition-colors" />
                <div className="absolute -bottom-2 -right-2 bg-primary text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm">1</div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Documents</h3>
              <p className="text-sm text-text-muted">Upload manuals, SOPs, and technical sheets.</p>
            </div>

            <ArrowRight className="hidden md:block w-8 h-8 text-text-muted animate-pulse-soft" />

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center max-w-[200px] animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="w-20 h-20 bg-surface border border-border rounded-2xl flex items-center justify-center mb-6 shadow-lg relative group">
                <Database className="w-10 h-10 text-text-secondary group-hover:text-primary transition-colors" />
                <div className="absolute -bottom-2 -right-2 bg-primary text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm">2</div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Knowledge Processing</h3>
              <p className="text-sm text-text-muted">Chunking, embedding, and vector storage.</p>
            </div>

            <ArrowRight className="hidden md:block w-8 h-8 text-text-muted animate-pulse-soft" />

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center max-w-[200px] animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-20 h-20 bg-surface border border-border rounded-2xl flex items-center justify-center mb-6 shadow-lg relative group">
                <Search className="w-10 h-10 text-text-secondary group-hover:text-primary transition-colors" />
                <div className="absolute -bottom-2 -right-2 bg-primary text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm">3</div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Semantic Search</h3>
              <p className="text-sm text-text-muted">Retrieve exact paragraphs answering the query.</p>
            </div>

            <ArrowRight className="hidden md:block w-8 h-8 text-text-muted animate-pulse-soft" />

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center max-w-[200px] animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="w-20 h-20 bg-primary/20 border border-primary/30 rounded-2xl flex items-center justify-center mb-6 shadow-lg relative group shadow-primary/20">
                <Cpu className="w-10 h-10 text-primary group-hover:scale-110 transition-transform" />
                <div className="absolute -bottom-2 -right-2 bg-primary text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm">4</div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Reasoning</h3>
              <p className="text-sm text-text-muted">Gemini formulates a grounded, accurate answer.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6 text-center text-text-muted">
          <p>&copy; {new Date().getFullYear()} IndustryGPT. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
