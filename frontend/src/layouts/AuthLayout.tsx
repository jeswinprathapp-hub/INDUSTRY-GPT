import { Outlet } from 'react-router-dom';
import { Hexagon, CheckCircle2 } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel: Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface flex-col justify-between p-12 border-r border-border relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-primary rounded-full mix-blend-screen filter blur-[200px] opacity-[0.05] pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-16">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Hexagon className="text-white w-7 h-7" />
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight font-display">
              IndustryGPT
            </h2>
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-6 font-display leading-tight">
            Industrial knowledge.<br/>One conversation away.
          </h1>
          <p className="text-lg text-text-secondary mb-12 max-w-lg">
            Ask questions across manuals, SOPs, maintenance records and technical documentation using AI-powered semantic search.
          </p>

          <div className="space-y-4">
            {[
              'Upload and instantly index technical manuals',
              'Chat naturally to find exact procedures',
              'Track maintenance and operations tasks',
              'Multimodal voice and vision capabilities'
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center text-text-secondary">
                <CheckCircle2 className="w-5 h-5 text-primary mr-3" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm text-text-muted">
          &copy; {new Date().getFullYear()} IndustryGPT. All rights reserved.
        </div>
      </div>

      {/* Right Panel: Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 relative">
        {/* Mobile Header (Only visible on small screens) */}
        <div className="lg:hidden flex items-center space-x-3 mb-12">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Hexagon className="text-white w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight font-display">
            IndustryGPT
          </h2>
        </div>

        <div className="w-full max-w-md animate-fade-in">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
