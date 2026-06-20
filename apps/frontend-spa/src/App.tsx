import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard.tsx';
import Calculator from './pages/Calculator.tsx';
import Goals from './pages/Goals.tsx';
import Recommendations from './pages/Recommendations.tsx';
import Analytics from './pages/Analytics.tsx';

export default function App() {
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    const root = window.document.documentElement;
    if (nextTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-forest-light dark:bg-forest-dark text-slate-800 dark:text-gray-100 transition-colors duration-300 font-body">
      {/* Sidebar Navigation / Mobile Top Bar */}
      <aside className="w-full lg:w-64 h-auto lg:h-full bg-white dark:bg-forest-surface border-b lg:border-b-0 lg:border-r border-emerald-500/10 flex flex-row lg:flex-col justify-between items-center lg:items-stretch p-4 lg:p-5 select-none shrink-0 gap-4">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl" role="img" aria-label="Logo">🌿</span>
          <span className="text-lg sm:text-xl font-headings font-bold text-emerald-500">EcoTrace</span>
        </div>
        
        {/* Navigation list */}
        <nav className="flex flex-row lg:flex-col space-x-1 lg:space-x-0 lg:space-y-2 overflow-x-auto lg:overflow-x-visible py-1 lg:py-0 max-w-[60%] sm:max-w-none scrollbar-none" aria-label="Main Navigation">
          <Link 
            to="/" 
            className={`px-3 py-1.5 lg:p-3 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 lg:gap-3 shrink-0 ${
              isActive('/') ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-500/10'
            }`}
          >
            📊 <span className="hidden sm:inline lg:inline">Dashboard</span><span className="inline sm:hidden">Home</span>
          </Link>
          <Link 
            to="/analytics" 
            className={`px-3 py-1.5 lg:p-3 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 lg:gap-3 shrink-0 ${
              isActive('/analytics') ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-500/10'
            }`}
          >
            📈 Analytics
          </Link>
          <Link 
            to="/calculator" 
            className={`px-3 py-1.5 lg:p-3 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 lg:gap-3 shrink-0 ${
              isActive('/calculator') ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-500/10'
            }`}
          >
            🚗 Log
          </Link>
          <Link 
            to="/goals" 
            className={`px-3 py-1.5 lg:p-3 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 lg:gap-3 shrink-0 ${
              isActive('/goals') ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-500/10'
            }`}
          >
            🎯 Goals
          </Link>
          <Link 
            to="/recommendations" 
            className={`px-3 py-1.5 lg:p-3 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 lg:gap-3 shrink-0 ${
              isActive('/recommendations') ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-500/10'
            }`}
          >
            💡 <span className="hidden sm:inline lg:inline">Recommendations</span><span className="inline sm:hidden">Advice</span>
          </Link>
        </nav>

        {/* Theme button */}
        <button 
          onClick={toggleTheme}
          className="p-1.5 lg:p-3 rounded-xl border border-gray-300 dark:border-emerald-500/20 text-xs sm:text-sm hover:bg-emerald-500/10 transition-colors shrink-0"
          aria-label="Toggle light and dark mode themes"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </aside>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Header toolbar */}
        <header className="hidden lg:flex h-16 border-b border-emerald-500/10 bg-white dark:bg-forest-surface px-8 justify-end items-center">
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="text-gray-400">Auth Token Mock Active</span>
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
          </div>
        </header>

        {/* Dynamic content rendering page component views */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto min-h-0 min-w-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/recommendations" element={<Recommendations />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
