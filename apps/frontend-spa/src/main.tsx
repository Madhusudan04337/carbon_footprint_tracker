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

// Configure simple mock auth credentials dynamically for demonstration testing
if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
  // Sets a mock fallback token so that React Query fetches mock data smoothly out-of-the-box
  localStorage.setItem('token', 'mock_jwt_access_token');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
