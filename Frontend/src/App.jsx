import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MailProvider } from './context/MailContext';
import { LogProvider } from './context/LogContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ComposePage from './pages/ComposePage';
import Groups from './pages/Groups';
import Layout from './components/Layout';
import ManageUsers from './components/ManageUsers';
import ManageInstitutions from './components/ManageInstitutions';
import ManageLogs from './components/ManageLogs';
import ManageGroups from './components/ManageGroups';
import ProfilePage from './pages/ProfilePage';
import CreateUserPage from './pages/CreateUserPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import SupportPage from './pages/SupportPage';
import ManageSupport from './components/ManageSupport';
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
 * Dashboard route: shows admin stats for Administrateur, mail inbox otherwise
 */
function DashboardRoute() {
  const { user } = useAuth();
  return user?.role === 'Administrateur' ? <AdminDashboardPage /> : <Dashboard />;
}

/**
 * Main application routes
 */
function AppRoutes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          user ? <Navigate to="/dashboard" replace /> : <Login onForgotPassword={() => navigate('/forgot-password')} />
        } 
      />
      
      <Route 
        path="/forgot-password" 
        element={
          <AuthRoute>
            <ForgotPassword onBack={() => navigate('/')} />
          </AuthRoute>
        } 
      />
      
      <Route 
        path="/reset-password" 
        element={
          <AuthRoute>
            <ResetPassword
              onBack={() => navigate('/')}
              queryString={window.location.search}
            />
          </AuthRoute>
        } 
      />
      
      <Route element={<ProtectedRoute><MailProvider><Layout /></MailProvider></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/admin/groups" element={<ManageGroups />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/admin/support" element={<ManageSupport />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/users" element={<ManageUsers />} />
        <Route path="/institutions" element={<ManageInstitutions />} />
        <Route path="/audit-logs" element={<ManageLogs />} />
        <Route path="/create-user" element={<CreateUserPage />} />
      </Route>
      
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