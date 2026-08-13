import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HeartPulse, ArrowLeft, Home, Search, Stethoscope, Activity, ShieldAlert, Sparkles, Compass, Pill } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const popularRoutes = [
    { label: 'Patient Dashboard', path: '/app', icon: Home, color: 'from-blue-500 to-cyan-400' },
    { label: 'AI Symptom Triage', path: '/app/ai-symptom', icon: Stethoscope, color: 'from-emerald-500 to-teal-400' },
    { label: 'Smart Trackers', path: '/app/trackers', icon: Activity, color: 'from-indigo-500 to-blue-400' },
    { label: 'Medication Manager', path: '/app/medicine', icon: Pill, color: 'from-purple-500 to-pink-400' },
    { label: 'Emergency SOS', path: '/app/emergency', icon: ShieldAlert, color: 'from-red-500 to-rose-400' },
  ];

  const filteredRoutes = popularRoutes.filter(r => 
    r.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const match = popularRoutes.find(r => r.label.toLowerCase().includes(searchQuery.toLowerCase()));
    if (match) {
      navigate(match.path);
    } else {
      navigate('/app');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-x-hidden select-none">
      {/* Background ambient lighting glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 left-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full px-6 py-5 flex items-center justify-between z-10 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-3 text-white text-lg font-extrabold tracking-tight">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <HeartPulse className="w-5 h-5 text-white animate-pulse" />
          </div>
          <span>LifeSphere<span className="text-blue-400">AI</span></span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          <Link
            to="/app"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Main Full-Bleed Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 z-10 max-w-4xl mx-auto text-center">
        {/* Glowing 404 Visual Indicator */}
        <div className="relative mb-6">
          <h1 className="text-[120px] sm:text-[160px] md:text-[180px] font-black leading-none bg-clip-text text-transparent bg-gradient-to-b from-slate-200 via-slate-500 to-slate-800 tracking-tighter opacity-90 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="px-5 py-2.5 bg-blue-500/10 border border-blue-500/30 backdrop-blur-xl rounded-full flex items-center gap-3 shadow-2xl">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-widest text-blue-300">
                Route Not Found
              </span>
            </div>
          </div>
        </div>

        {/* Diagnostic Path Info */}
        <div className="mb-6 px-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl inline-flex items-center gap-2 text-xs font-mono text-slate-400 max-w-md truncate">
          <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-slate-500">Path:</span>
          <span className="text-cyan-300 font-semibold truncate">{location.pathname}</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
          Destination Unreachable
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-lg mb-8 leading-relaxed">
          The health record, medical feature, or URL you requested does not exist or has been relocated within our system.
        </p>

        {/* Live Search Input Box */}
        <form onSubmit={handleSearchSubmit} className="w-full max-w-md mb-8 relative">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search features (e.g. trackers, symptoms, medicine)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 focus:border-blue-500 rounded-2xl py-3.5 pl-12 pr-24 text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              Go
            </button>
          </div>
        </form>

        {/* Popular Destination Shortcuts */}
        <div className="w-full max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            Suggested Destinations
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredRoutes.map((route, idx) => {
              const Icon = route.icon;
              return (
                <Link
                  key={idx}
                  to={route.path}
                  className="p-4 bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-2xl text-left transition-all duration-200 group flex items-center gap-3 hover:-translate-y-0.5 shadow-md"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${route.color} flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-200 group-hover:text-white transition-colors">
                      {route.label}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {route.path}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="w-full px-6 py-4 border-t border-slate-900 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 z-10 bg-slate-950/80">
        <div>
          © {new Date().getFullYear()} LifeSphere AI. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
          <Link to="/app/emergency" className="text-red-400 hover:text-red-300 font-semibold transition-colors flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Emergency SOS
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default NotFound;
