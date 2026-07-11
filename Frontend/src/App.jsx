import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MailProvider } from './context/MailContext';
import { LogProvider } from './context/LogContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Composant de routage interne
function RootApp() {
  const { user } = useAuth();

  // Si l'utilisateur est connecté, on le bascule sur l'application de messagerie,
  // sinon on affiche l'écran de connexion.
  return user ? (
    <MailProvider>
      <Dashboard />
    </MailProvider>
  ) : (
    <Login />
  );
}

// Le point d'entrée enveloppé dans les fournisseurs globaux
export default function App() {
  return (
    <AuthProvider>
      <LogProvider>
        <RootApp />
      </LogProvider>
    </AuthProvider>
  );
}