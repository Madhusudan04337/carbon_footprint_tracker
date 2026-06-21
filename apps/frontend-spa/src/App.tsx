import { useState, Suspense, lazy } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.tsx';

// Lazy loading the pages
const Dashboard = lazy(() => import('./pages/Dashboard.tsx'));
const Calculator = lazy(() => import('./pages/Calculator.tsx'));
const Goals = lazy(() => import('./pages/Goals.tsx'));
const Recommendations = lazy(() => import('./pages/Recommendations.tsx'));
const Analytics = lazy(() => import('./pages/Analytics.tsx'));
const AuthPage = lazy(() => import('./pages/AuthPage.tsx'));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center h-full">
    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { isAuthenticated, login, logout } = useAuth();

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

  // Show auth page if not logged in
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <AuthPage />
      </Suspense>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-forest-light dark:bg-forest-dark text-slate-800 dark:text-gray-100 transition-colors duration-300 font-body relative">
      
      {/* 1. Desktop Sidebar Navigation */}
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
                isActive('/') ? 'bg-emerald-700 text-white' : 'hover:bg-emerald-500/10'
              }`}
            >
              📊 Dashboard
            </Link>
            <Link 
              to="/analytics" 
              className={`p-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
                isActive('/analytics') ? 'bg-emerald-700 text-white' : 'hover:bg-emerald-500/10'
              }`}
            >
              📈 Analytics
            </Link>
            <Link 
              to="/calculator" 
              className={`p-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
                isActive('/calculator') ? 'bg-emerald-700 text-white' : 'hover:bg-emerald-500/10'
              }`}
            >
              🚗 Calculator
            </Link>
            <Link 
              to="/goals" 
              className={`p-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
                isActive('/goals') ? 'bg-emerald-700 text-white' : 'hover:bg-emerald-500/10'
              }`}
            >
              🎯 Goals
            </Link>
            <Link 
              to="/recommendations" 
              className={`p-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
                isActive('/recommendations') ? 'bg-emerald-700 text-white' : 'hover:bg-emerald-500/10'
              }`}
            >
              💡 Recommendations
            </Link>
          </nav>
        </div>

        <div className="space-y-2">
          <button 
            onClick={toggleTheme}
            className="w-full p-3 rounded-xl border border-gray-300 dark:border-emerald-500/20 text-sm hover:bg-emerald-500/10 transition-colors"
          >
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
          <button
            onClick={logout}
            className="w-full p-3 rounded-xl border border-red-500/20 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* 2. Mobile Header Bar */}
      <header className="flex lg:hidden h-16 bg-white dark:bg-forest-surface border-b border-emerald-500/10 justify-between items-center px-4 shrink-0 relative z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl" role="img" aria-label="Logo">🌿</span>
          <span className="text-lg font-headings font-bold text-emerald-500">EcoTrace</span>
        </div>

        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-gray-500 hover:bg-emerald-500/10 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* 3. Mobile Expandable Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-white dark:bg-forest-surface border-b border-emerald-500/10 shadow-lg p-5 flex flex-col space-y-3 z-40 lg:hidden">
          <nav className="flex flex-col space-y-1" aria-label="Mobile Navigation">
            {[
              { to: '/', label: '📊 Dashboard' },
              { to: '/analytics', label: '📈 Analytics' },
              { to: '/calculator', label: '🚗 Calculator' },
              { to: '/goals', label: '🎯 Goals' },
              { to: '/recommendations', label: '💡 Recommendations' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={`p-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
                  isActive(to) ? 'bg-emerald-700 text-white' : 'hover:bg-emerald-500/10'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex gap-2">
            <button
              onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
              className="flex-1 p-3 rounded-xl border border-gray-300 dark:border-emerald-500/20 text-sm hover:bg-emerald-500/10 transition-colors"
            >
              {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </button>
            <button
              onClick={() => { logout(); setMobileMenuOpen(false); }}
              className="flex-1 p-3 rounded-xl border border-red-500/20 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Header toolbar */}
        <header className="hidden lg:flex h-16 border-b border-emerald-500/10 bg-white dark:bg-forest-surface px-8 justify-end items-center">
          <div className="flex items-center gap-3 text-sm font-medium">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-emerald-600 dark:text-emerald-400">Authenticated</span>
          </div>
        </header>

        {/* Dynamic page content */}
        <main tabIndex={0} aria-label="Main Content Area" className="flex-1 p-4 sm:p-8 overflow-y-auto min-h-0 min-w-0 focus-visible:outline-none">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/calculator" element={<Calculator />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/recommendations" element={<Recommendations />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
