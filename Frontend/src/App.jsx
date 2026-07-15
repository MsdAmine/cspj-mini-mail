import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MailProvider } from './context/MailContext';
import { LogProvider } from './context/LogContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

/**
 * Lightweight client-side "router" — no react-router needed.
 * Supported views: 'login' | 'forgot-password' | 'reset-password'
 */
function RootApp() {
  const { user } = useAuth();
  const [view, setView] = useState('login');

  // On mount, check if the URL path indicates a reset-password deep link
  useEffect(() => {
    if (window.location.pathname === '/reset-password') {
      setView('reset-password');
    }
  }, []);

  if (user) {
    return (
      <MailProvider>
        <Dashboard />
      </MailProvider>
    );
  }

  if (view === 'forgot-password') {
    return <ForgotPassword onBack={() => setView('login')} />;
  }

  if (view === 'reset-password') {
    return (
      <ResetPassword
        onBack={() => {
          // Force a full page reload to the root login page
          window.location.href = '/';
        }}
        queryString={window.location.search}
      />
    );
  }

  return <Login onForgotPassword={() => setView('forgot-password')} />;
}

export default function App() {
  return (
    <AuthProvider>
      <LogProvider>
        <RootApp />
      </LogProvider>
    </AuthProvider>
  );
}