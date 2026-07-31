import React, { useState } from 'react';
import { useMail } from '../context/MailContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ onComposeOpen, isAdminView, setIsAdminView, adminTab, setAdminTab }) {
  const { activeFolder, setActiveFolder } = useMail();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // ── Shared style tokens (Uniform Dark Zinc Theme for ALL Roles) ────────────
  const sidebarBg   = 'bg-zinc-950';
  const borderColor = 'border-white/5';
  const textMuted   = 'text-zinc-500';
  const labelColor  = 'text-zinc-500';

  const activeItemCls   = 'bg-white/10 text-white font-semibold border border-white/10 shadow-[0_0_15px_rgba(99,102,241,0.15)]';
  const inactiveItemCls = 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200 hover:-translate-y-0.5';
  const activeIconCls   = 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]';
  const inactiveIconCls = 'text-zinc-500';
  const activeDotCls    = 'bg-indigo-400 shadow-sm shadow-indigo-400/70';

  return (
    <>
      {/* ── Mobile hamburger trigger (visible only on small screens) ── */}
      <button
        className="md:hidden fixed top-4 z-50 p-2 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-md text-slate-600 hover:bg-slate-50 active:scale-95 transition-all duration-150"
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
          w-64 flex-shrink-0
          ${sidebarBg} font-sans
          ${isUserAdmin ? `border-r ${borderColor}` : `border-l ${borderColor}`}
          shadow-xl md:shadow-none
          transition-transform duration-200 ease-in-out
          ${mobileOpen ? 'translate-x-0' : (isUserAdmin ? '-translate-x-full md:translate-x-0' : 'translate-x-full md:translate-x-0')}
        `}
      >
        {/* ── Brand Header ── */}
        <div className={`px-5 py-4 border-b ${borderColor} flex-shrink-0`}>
          <div className="flex items-center gap-3">
            {/* Logo mark — glowing ring on dark */}
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
              <span className="absolute inset-0 rounded-xl ring-1 ring-indigo-400/40" />
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-sm leading-none tracking-tight text-white">CSPJ Mail</h1>
              <p className={`text-[10px] leading-none mt-0.5 tracking-widest uppercase ${textMuted}`}>
                {isUserAdmin ? 'Administration' : 'Système interne'}
              </p>
            </div>
            {/* System live status pill — admin only */}
            {isUserAdmin && (
              <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            )}
          </div>
        </div>

        {/* ── Main Navigation ── */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">

          {/* Mail nav — non-admin users */}
          {!isUserAdmin && (
            <>
              <button
                onClick={() => { onComposeOpen(); closeMobile(); }}
                className="w-full mb-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] hover:-translate-y-0.5 transition-all duration-150 shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                رسالة جديدة
              </button>

              <p className={`px-3 text-[10px] font-bold uppercase tracking-widest mb-1.5 ${labelColor}`}>المجلدات</p>

              <nav className="space-y-0.5" dir="rtl">
                {folders.map((folder) => {
                  const isActive = activeFolder === folder.id && !isAdminView;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => {
                        // Synchronous state updates — no deferred wrappers
                        setIsAdminView(false);
                        setActiveFolder(folder.id);
                        closeMobile();
                      }}
                      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                        isActive ? activeItemCls : inactiveItemCls
                      }`}
                    >
                      {/* Active glowing vertical bar indicator */}
                      {isActive && (
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/60" />
                      )}
                      {isActive && (
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeDotCls}`} />
                      )}
                      <span className={isActive ? activeIconCls : inactiveIconCls}>{folder.icon}</span>
                      <span>{folder.label}</span>
                    </button>
                  );
                })}
              </nav>
            </>
          )}

          {/* Admin nav — LTR French */}
          {isUserAdmin && (
            <nav className="space-y-0.5" dir="ltr">
              <p className={`px-3 text-[10px] font-bold uppercase tracking-widest mb-2 ${labelColor}`}>Administration</p>
              {adminNavItems.map((item) => {
                const isActive = adminTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setAdminTab(item.id); closeMobile(); }}
                    className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                      isActive ? activeItemCls : inactiveItemCls
                    }`}
                  >
                    {/* Active glowing vertical bar indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-blue-400 shadow-sm shadow-blue-400/70" />
                    )}
                    {isActive && (
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeDotCls}`} />
                    )}
                    <span className={isActive ? activeIconCls : inactiveIconCls}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* ── Footer / User profile micro-card + Logout ── */}
        <div className={`px-3 py-3 border-t ${borderColor} flex-shrink-0 space-y-2`}>
          {/* Floating user micro-card */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-150 cursor-pointer">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase flex-shrink-0 shadow-sm bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-500/20">
              {user?.prenom ? user.prenom.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate leading-tight text-zinc-200">
                {user ? `${user.prenom} ${user.nom}` : ''}
              </p>
              <p className={`text-[10px] truncate leading-tight mt-0.5 ${textMuted}`}>
                {user?.email || ''}
              </p>
            </div>
            {/* Online status dot */}
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 shadow-sm shadow-emerald-400/50" />
          </div>

          {/* Logout button */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.98] text-zinc-500 hover:text-rose-400 bg-transparent hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20"
            title={isUserAdmin ? 'Déconnexion' : 'تسجيل الخروج من النظام'}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-semibold tracking-wide">
              {isUserAdmin ? 'Déconnexion' : 'تسجيل الخروج'}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}