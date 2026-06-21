import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const ensureAuthenticated = async () => {
  if (typeof window === 'undefined') return;

  // If a token is already stored and not expired, skip re-auth
  const existingToken = localStorage.getItem('token');
  if (existingToken) {
    console.log('[EcoTrace] Found existing auth token, skipping re-auth.');
    return;
  }

  const defaultCreds = {
    email: 'eco_guardian@ecotrace.org',
    password: 'securepassword123'
  };

  try {
    let res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defaultCreds)
    });

    if (!res.ok) {
      // User doesn't exist yet — register them first
      const regRes = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...defaultCreds,
          first_name: 'Eco',
          last_name: 'Guardian',
          country: 'US',
          postal_code: '90210'
        })
      });

      if (!regRes.ok) throw new Error('Auto-registration failed');

      res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultCreds)
      });
    }

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      console.log('[EcoTrace] Auto-authenticated default user.');
    } else {
      localStorage.removeItem('token');
      console.warn(`[EcoTrace] Auth failed (HTTP ${res.status}). API: ${API_BASE}`);
    }
  } catch (e) {
    console.warn(`[EcoTrace] Auto-authentication failed. API: ${API_BASE}`, e);
  }
};

const init = async () => {
  await ensureAuthenticated();
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

init();
