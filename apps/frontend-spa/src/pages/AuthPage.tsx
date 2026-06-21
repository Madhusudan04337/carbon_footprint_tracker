import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

interface AuthPageProps {
  onAuthenticated: () => void;
}

export default function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    country: 'IN',
    postal_code: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        const regRes = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            first_name: form.first_name,
            last_name: form.last_name,
            country: form.country,
            postal_code: form.postal_code
          })
        });
        if (!regRes.ok) {
          const data = await regRes.json().catch(() => ({}));
          throw new Error(data.detail || 'Registration failed. Please try again.');
        }
      }

      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      });

      if (!loginRes.ok) {
        const data = await loginRes.json().catch(() => ({}));
        throw new Error(data.detail || 'Invalid email or password.');
      }

      const data = await loginRes.json();
      localStorage.setItem('token', data.access_token);
      onAuthenticated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-forest-dark flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 mb-4">
            <span className="text-3xl">🌿</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">EcoTrace</h1>
          <p className="text-gray-300 mt-1 text-sm">Carbon Footprint Awareness Platform</p>
        </div>

        {/* Card */}
        <div className="bg-forest-surface border border-emerald-500/15 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          {/* Tab switcher */}
          <div className="flex bg-forest-dark rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Register-only fields */}
            {mode === 'register' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="first_name" className="block text-xs font-medium text-gray-400 mb-1.5">First Name</label>
                    <input
                      id="first_name"
                      type="text"
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                      required
                      placeholder="Eco"
                      className="w-full px-4 py-2.5 rounded-xl bg-forest-dark border border-emerald-500/20 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="last_name" className="block text-xs font-medium text-gray-400 mb-1.5">Last Name</label>
                    <input
                      id="last_name"
                      type="text"
                      name="last_name"
                      value={form.last_name}
                      onChange={handleChange}
                      required
                      placeholder="Guardian"
                      className="w-full px-4 py-2.5 rounded-xl bg-forest-dark border border-emerald-500/20 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="country" className="block text-xs font-medium text-gray-400 mb-1.5">Country</label>
                    <select
                      id="country"
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl bg-forest-dark border border-emerald-500/20 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    >
                      <option value="IN">🇮🇳 India</option>
                      <option value="US">🇺🇸 USA</option>
                      <option value="GB">🇬🇧 UK</option>
                      <option value="DE">🇩🇪 Germany</option>
                      <option value="AU">🇦🇺 Australia</option>
                      <option value="CA">🇨🇦 Canada</option>
                      <option value="FR">🇫🇷 France</option>
                      <option value="JP">🇯🇵 Japan</option>
                      <option value="CN">🇨🇳 China</option>
                      <option value="BR">🇧🇷 Brazil</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="postal_code" className="block text-xs font-medium text-gray-400 mb-1.5">Postal Code</label>
                    <input
                      id="postal_code"
                      type="text"
                      name="postal_code"
                      value={form.postal_code}
                      onChange={handleChange}
                      placeholder="560001"
                      className="w-full px-4 py-2.5 rounded-xl bg-forest-dark border border-emerald-500/20 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl bg-forest-dark border border-emerald-500/20 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-forest-dark border border-emerald-500/20 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-emerald-500/25 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </span>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account & Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-300 mt-5">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          🌱 Track your carbon footprint. Help the planet.
        </p>
      </div>
    </div>
  );
}
