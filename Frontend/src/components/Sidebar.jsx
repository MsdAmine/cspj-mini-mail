import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMail } from '../context/MailContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isAdminView, setIsAdminView, adminTab, setAdminTab }) {
  const navigate = useNavigate();
  const { activeFolder, setActiveFolder } = useMail();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const folders = [
    { id: 'inbox',    label: 'العلبة الواردة',    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m13-4l-5 5-5-5" />
      </svg>
    )},
    { id: 'sent',     label: 'الرسائل المرسلة', icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    )},
    { id: 'groups',   label: 'المجموعات',        icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
    { id: 'archived', label: 'الأرشيف',          icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    )},
  ];

  const adminNavItems = [
    {
      id: 'stats',
      label: 'Tableau de bord',
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'manage-users',
      label: 'Utilisateurs',
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      id: 'institutions',
      label: 'Institutions',
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      id: 'audit-logs',
      label: "Journal d'audit",
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      id: 'create-user',
      label: 'Créer un compte',
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
  ];

  const isUserAdmin = user?.role === 'Administrateur';

  // Close mobile sidebar (called separately from state updates so there is
  // no closure overhead blocking the synchronous highlight switch).
  const closeMobile = () => setMobileOpen(false);

  // ── Shared style tokens (Formal Institutional Theme) ────────────
  const sidebarBg   = 'bg-[#0F172A]';
  const borderColor = 'border-slate-800';
  const textMuted   = 'text-slate-400';
  const labelColor  = 'text-slate-500';

  const activeItemCls   = 'bg-slate-800 text-white font-medium rounded-lg border-s-4 border-slate-200 shadow-sm';
  const inactiveItemCls = 'text-slate-400 hover:bg-slate-800/60 hover:text-white rounded-lg border-s-4 border-transparent transition-colors';
  const activeIconCls   = 'text-slate-200';
  const inactiveIconCls = 'text-slate-500';

  return (
    <>
      {/* ── Mobile hamburger trigger (visible only on small screens) ── */}
      <button
        className="md:hidden fixed top-4 z-50 p-2 bg-white/90 backdrop-blur-md border border-slate-200 rounded-lg shadow-sm text-slate-600 hover:bg-slate-50 active:scale-95 transition-all duration-150"
        style={{ [isUserAdmin ? 'left' : 'right']: '1rem' }}
        onClick={() => setMobileOpen(v => !v)}
        aria-label="Toggle sidebar"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {mobileOpen
            ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          }
        </svg>
      </button>

      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar panel ── */}
      <div
        className={`
          fixed md:relative z-40 md:z-auto
          flex flex-col h-full
          ${isCollapsed ? 'w-20' : 'w-64'} flex-shrink-0
          ${sidebarBg} font-sans
          ${isUserAdmin ? `border-r ${borderColor}` : `border-l ${borderColor}`}
          shadow-xl md:shadow-none
          transition-all duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : (isUserAdmin ? '-translate-x-full md:translate-x-0' : 'translate-x-full md:translate-x-0')}
        `}
      >
        {/* ── Brand Header ── */}
        <div className={`px-4 py-4 border-b ${borderColor} flex-shrink-0 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3 overflow-hidden">
              {/* Logo mark */}
              <div className="relative w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-800 border border-slate-700">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              
              <div className="w-auto opacity-100">
                <h1 className="font-bold text-sm leading-none tracking-tight text-white whitespace-nowrap">CSPJ Mail</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className={`text-[10px] leading-none tracking-widest uppercase whitespace-nowrap ${textMuted}`}>
                    {isUserAdmin ? 'Administration' : 'Système interne'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className={`p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0 ${isCollapsed ? '' : 'hidden md:block'}`}
            title={isCollapsed ? "Développer" : "Réduire"}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {isUserAdmin ? (
                isCollapsed ? <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              ) : (
                isCollapsed ? <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              )}
            </svg>
          </button>
        </div>

        {/* ── Main Navigation ── */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">

          {/* Mail nav — non-admin users */}
          {!isUserAdmin && (
            <>
              <button
                onClick={() => { navigate('/compose'); closeMobile(); }}
                title={isCollapsed ? "رسالة جديدة" : undefined}
                className="w-full mb-4 py-2.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center px-3 cursor-pointer"
              >
                <div className="w-10 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className={`truncate transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 ms-0' : 'w-auto opacity-100 ms-1'}`}>
                  رسالة جديدة
                </span>
              </button>

              <p className={`px-3 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${labelColor} ${isCollapsed ? 'h-0 opacity-0 mb-0 overflow-hidden' : 'h-auto opacity-100 mb-2'}`}>
                المجلدات
              </p>

              <nav className="space-y-1" dir="rtl">
                {folders.map((folder) => {
                  const isActive = activeFolder === folder.id && !isAdminView;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => {
                        setIsAdminView(false);
                        setActiveFolder(folder.id);
                        closeMobile();
                      }}
                      title={isCollapsed ? folder.label : undefined}
                      className={`relative w-full flex items-center px-2 py-2.5 text-sm transition-all duration-150 cursor-pointer group ${
                        isActive ? activeItemCls : inactiveItemCls
                      }`}
                    >
                      <div className={`w-10 flex-shrink-0 flex items-center justify-center ${isActive ? activeIconCls : inactiveIconCls}`}>
                        {folder.icon}
                      </div>
                      <span className={`truncate transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 ms-0' : 'w-auto opacity-100 ms-2'}`}>
                        {folder.label}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </>
          )}

          {/* Admin nav — LTR French */}
          {isUserAdmin && (
            <nav className="space-y-1" dir="ltr">
              <p className={`px-3 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${labelColor} ${isCollapsed ? 'h-0 opacity-0 mb-0 overflow-hidden' : 'h-auto opacity-100 mb-2'}`}>
                Administration
              </p>
              {adminNavItems.map((item) => {
                const isActive = adminTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setAdminTab(item.id); closeMobile(); }}
                    title={isCollapsed ? item.label : undefined}
                    className={`relative w-full flex items-center px-2 py-2.5 text-sm transition-all duration-150 cursor-pointer group ${
                      isActive ? activeItemCls : inactiveItemCls
                    }`}
                  >
                    <div className={`w-10 flex-shrink-0 flex items-center justify-center ${isActive ? activeIconCls : inactiveIconCls}`}>
                      {item.icon}
                    </div>
                    <span className={`truncate transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 ms-0' : 'w-auto opacity-100 ms-2'}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* ── Footer / Logout ── */}
        <div className={`px-2 py-3 border-t ${borderColor} flex-shrink-0`}>

          {/* Logout button */}
          <button
            onClick={logout}
            className={`w-full flex items-center px-3 py-2.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer text-slate-400 hover:text-rose-400 bg-transparent hover:bg-rose-500/10 border border-transparent`}
            title={isUserAdmin ? 'Déconnexion' : 'تسجيل الخروج من النظام'}
          >
            <div className="w-10 flex-shrink-0 flex items-center justify-center">
              <svg className={`w-4 h-4 ${!isUserAdmin ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            
            <span className={`truncate transition-all duration-300 font-semibold tracking-wide ${isCollapsed ? 'w-0 opacity-0 ms-0' : 'w-auto opacity-100 ms-1'}`}>
              {isUserAdmin ? 'Déconnexion' : 'تسجيل الخروج'}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}