import React from 'react';
import { useMail } from '../context/MailContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ onComposeOpen, isAdminView, setIsAdminView, adminTab, setAdminTab }) {
  const { activeFolder, setActiveFolder } = useMail();
  const { user, logout } = useAuth();

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

  return (
    <div
      className={`w-64 bg-white flex flex-col h-full justify-between font-sans ${
        isUserAdmin ? 'border-r border-slate-200' : 'border-l border-slate-200'
      }`}
    >
      {/* ── Brand Header ── */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          {/* Logo mark */}
          <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-900 leading-none tracking-tight">CSPJ Mail</h1>
            <p className="text-[10px] text-slate-400 leading-none mt-0.5 tracking-widest uppercase">
              {isUserAdmin ? 'Administration' : 'Système interne'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Navigation ── */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">

        {/* Mail nav — non-admin users */}
        {!isUserAdmin && (
          <>
            <button
              onClick={onComposeOpen}
              className="w-full mb-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              رسالة جديدة
            </button>

            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">المجلدات</p>

            <nav className="space-y-0.5" dir="rtl">
              {folders.map((folder) => {
                const isActive = activeFolder === folder.id && !isAdminView;
                return (
                  <button
                    key={folder.id}
                    onClick={() => {
                      setIsAdminView(false);
                      setActiveFolder(folder.id);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-slate-100 text-blue-600 font-semibold border-r-2 border-blue-500'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <span className={isActive ? 'text-blue-500' : 'text-slate-400'}>{folder.icon}</span>
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
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Administration</p>
            {adminNavItems.map((item) => {
              const isActive = adminTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setAdminTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-slate-100 text-blue-600 font-semibold border-l-2 border-blue-500'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className={isActive ? 'text-blue-500' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* ── Footer / Logout ── */}
      <div className="px-3 py-3 border-t border-slate-100">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-rose-600 bg-transparent hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-all duration-150 cursor-pointer"
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
  );
}