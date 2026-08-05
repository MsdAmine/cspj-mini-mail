import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MailProvider } from './context/MailContext';
import { LogProvider } from './context/LogContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ComposePage from './pages/ComposePage';

/**
 * Protected Route wrapper
 */
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

/**
 * Auth Route wrapper (redirects to dashboard if already logged in)
 */
function AuthRoute({ children }) {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

/**
 * Main application routes
 */
function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          user ? <Navigate to="/dashboard" replace /> : <Login onForgotPassword={() => {}} />
        } 
      />
      
      <Route 
        path="/forgot-password" 
        element={
          <AuthRoute>
            <ForgotPassword onBack={() => {}} />
          </AuthRoute>
        } 
      />
      
      <Route 
        path="/reset-password" 
        element={
          <AuthRoute>
            <ResetPassword
              onBack={() => { window.location.href = '/'; }}
              queryString={window.location.search}
            />
          </AuthRoute>
        } 
      />
      
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <MailProvider>
              <Dashboard />
            </MailProvider>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/compose" 
        element={
          <ProtectedRoute>
            <MailProvider>
              <ComposePage />
            </MailProvider>
          </ProtectedRoute>
        } 
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LogProvider>
          <AppRoutes />
        </LogProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}