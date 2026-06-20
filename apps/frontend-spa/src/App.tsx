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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-forest-light dark:bg-forest-dark text-slate-800 dark:text-gray-100 transition-colors duration-300 font-body relative">
      
      {/* 1. Desktop Sidebar Navigation (Visible on screen >= lg) */}
      <aside className="hidden lg:flex w-64 h-full bg-white dark:bg-forest-surface border-r border-emerald-500/10 flex-col justify-between p-6 select-none shrink-0">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label="Logo">🌿</span>
            <span className="text-xl font-headings font-bold text-emerald-500">EcoTrace</span>
          </div>
          
          <nav className="flex flex-col space-y-2" aria-label="Desktop Navigation">
            <Link 
              to="/" 
              className={`p-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
                isActive('/') ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-500/10'
              }`}
            >
              📊 Dashboard
            </Link>
            <Link 
              to="/analytics" 
              className={`p-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
                isActive('/analytics') ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-500/10'
              }`}
            >
              📈 Analytics
            </Link>
            <Link 
              to="/calculator" 
              className={`p-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
                isActive('/calculator') ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-500/10'
              }`}
            >
              🚗 Calculator
            </Link>
            <Link 
              to="/goals" 
              className={`p-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
                isActive('/goals') ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-500/10'
              }`}
            >
              🎯 Goals
            </Link>
            <Link 
              to="/recommendations" 
              className={`p-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
                isActive('/recommendations') ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-500/10'
              }`}
            >
              💡 Recommendations
            </Link>
          </nav>
        </div>

        <button 
          onClick={toggleTheme}
          className="w-full p-3 rounded-xl border border-gray-300 dark:border-emerald-500/20 text-sm hover:bg-emerald-500/10 transition-colors"
        >
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
      </aside>

      {/* 2. Mobile Header Bar (Visible on screen < lg) */}
      <header className="flex lg:hidden h-16 bg-white dark:bg-forest-surface border-b border-emerald-500/10 justify-between items-center px-4 shrink-0 relative z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl" role="img" aria-label="Logo">🌿</span>
          <span className="text-lg font-headings font-bold text-emerald-500">EcoTrace</span>
        </div>

        {/* Hamburger Icon Menu Button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-gray-500 hover:bg-emerald-500/10 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* 3. Mobile Expandable Menu Overlay */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-white dark:bg-forest-surface border-b border-emerald-500/10 shadow-lg p-5 flex flex-col space-y-3 z-40 lg:hidden">
          <nav className="flex flex-col space-y-1" aria-label="Mobile Navigation">
            <Link 
              to="/" 
              onClick={() => setMobileMenuOpen(false)}
              className={`p-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
                isActive('/') ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-500/10'
              }`}
            >
              📊 Dashboard
            </Link>
            <Link 
              to="/analytics" 
              onClick={() => setMobileMenuOpen(false)}
              className={`p-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
                isActive('/analytics') ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-500/10'
              }`}
            >
              📈 Analytics
            </Link>
            <Link 
              to="/calculator" 
              onClick={() => setMobileMenuOpen(false)}
              className={`p-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
                isActive('/calculator') ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-500/10'
              }`}
            >
              🚗 Calculator
            </Link>
            <Link 
              to="/goals" 
              onClick={() => setMobileMenuOpen(false)}
              className={`p-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
                isActive('/goals') ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-500/10'
              }`}
            >
              🎯 Goals
            </Link>
            <Link 
              to="/recommendations" 
              onClick={() => setMobileMenuOpen(false)}
              className={`p-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
                isActive('/recommendations') ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-500/10'
              }`}
            >
              💡 Recommendations
            </Link>
          </nav>

          <button 
            onClick={() => {
              toggleTheme();
              setMobileMenuOpen(false);
            }}
            className="w-full p-3 rounded-xl border border-gray-300 dark:border-emerald-500/20 text-sm hover:bg-emerald-500/10 transition-colors"
          >
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
        </div>
      )}

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
