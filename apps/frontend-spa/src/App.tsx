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
    <div className="flex min-h-screen bg-forest-light dark:bg-forest-dark text-slate-800 dark:text-gray-100 transition-colors duration-300 font-body">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white dark:bg-forest-surface border-r border-emerald-500/10 flex flex-col justify-between p-6">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label="Logo">🌿</span>
            <span className="text-xl font-headings font-bold text-emerald-500">EcoTrace</span>
          </div>
          
          <nav className="flex flex-col space-y-2" aria-label="Main Navigation">
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

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col">
        {/* Header toolbar */}
        <header className="h-16 border-b border-emerald-500/10 bg-white dark:bg-forest-surface px-8 flex justify-end items-center">
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="text-gray-400">Auth Token Mock Active</span>
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
          </div>
        </header>

        {/* Dynamic content rendering page component views */}
        <main className="flex-1 p-8 overflow-y-auto">
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
