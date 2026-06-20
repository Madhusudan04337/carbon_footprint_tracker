import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents excessive triggers
      retry: 1
    }
  }
});

const ensureAuthenticated = async () => {
  if (typeof window === 'undefined') return;

  const defaultCreds = {
    email: 'eco_guardian@ecotrace.org',
    password: 'securepassword123'
  };

  try {
    let res = await fetch('http://127.0.0.1:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defaultCreds)
    });

    if (!res.ok) {
      // User doesn't exist yet, register them first
      const regRes = await fetch('http://127.0.0.1:8000/api/auth/register', {
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

      res = await fetch('http://127.0.0.1:8000/api/auth/login', {
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
    }
  } catch (e) {
    console.warn('[EcoTrace] Auto-authentication bypassed. Ensure Python backend is running on http://127.0.0.1:8000.');
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
