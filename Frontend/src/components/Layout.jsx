import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user } = useAuth();
  
  const [isAdminView, setIsAdminView] = useState(user?.role === 'Administrateur');

  const isAdmin = user?.role === 'Administrateur';
  const layoutDir = isAdmin ? 'ltr' : 'rtl';

  return (
    <div dir={layoutDir} className="flex h-screen w-full bg-[#f8fafc] overflow-hidden font-sans text-slate-800">
      <Sidebar
        isAdminView={isAdminView}
        setIsAdminView={setIsAdminView}
      />
      {/* The Outlet fills the remaining space and handles its own scrolling */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <Outlet context={{ isAdminView }} />
      </div>
    </div>
  );
}
