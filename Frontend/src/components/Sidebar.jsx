import React from 'react';
import { useMail } from '../context/MailContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ onComposeOpen, isAdminView, setIsAdminView, adminTab, setAdminTab }) {
  const { activeFolder, setActiveFolder } = useMail();
  const { user, logout } = useAuth();

  const folders = [
    { id: 'inbox', label: 'العلبة الواردة' },
    { id: 'sent', label: 'الرسائل المرسلة' },
    { id: 'archived', label: 'الأرشيف' },
  ];

  const isUserAdmin = user?.role === "Administrateur";

  return (
    <div className="w-64 bg-slate-950 text-slate-200 flex flex-col h-full justify-between border-l border-slate-800 font-sans">
      
      {/* القسم العلوي: العنوان + التنقل */}
      <div className="p-4 flex-1">
        {/* عنوان التطبيق */}
        <div className="mb-8 px-2">
          <h1 className="font-bold text-sm tracking-wide text-white font-mono">CSPJ Mail</h1>
          <p className="text-[10px] text-slate-400 font-sans tracking-widest uppercase">النظام الداخلي</p>
        </div>

        {/* زر رسالة جديدة (مخفي للمدير) */}
        {!isUserAdmin && (
          <button
            onClick={onComposeOpen}
            className="w-full py-3 mb-6 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-900/30 active:scale-[0.98] flex items-center justify-center cursor-pointer"
          >
            <span>رسالة جديدة</span>
          </button>
        )}

        {/* قائمة المجلدات (مخفية للمدير) */}
        {!isUserAdmin && (
          <nav className="space-y-1">
            {folders.map((folder) => {
              const isActive = activeFolder === folder.id;
              return (
                <button
                  key={folder.id}
                  onClick={() => {
                    setIsAdminView(false);
                    setActiveFolder(folder.id);
                  }}
                  className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold shadow-inner border-r-4 border-blue-500'
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                  }`}
                >
                  <span>{folder.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* قائمة المدير: لوحة التحكم وإدارة المستخدمين */}
        {isUserAdmin && (
          <nav className="space-y-1 mt-4">
            <div className="px-3 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">الإدارة</span>
            </div>
            
            <button
              onClick={() => setAdminTab('stats')}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${
                adminTab === 'stats'
                  ? 'bg-slate-800 text-white font-semibold shadow-inner border-r-4 border-blue-500'
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
              }`}
            >
              <span>لوحة التحكم</span>
            </button>

            <button
              onClick={() => setAdminTab('manage-users')}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${
                adminTab === 'manage-users'
                  ? 'bg-slate-800 text-white font-semibold shadow-inner border-r-4 border-blue-500'
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
              }`}
            >
              <span>إدارة المستخدمين</span>
            </button>

            <button
              onClick={() => setAdminTab('audit-logs')}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${
                adminTab === 'audit-logs'
                  ? 'bg-slate-800 text-white font-semibold shadow-inner border-r-4 border-blue-500'
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
              }`}
            >
              <span>سجل التدقيق</span>
            </button>

            <button
              onClick={() => setAdminTab('create-user')}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${
                adminTab === 'create-user'
                  ? 'bg-slate-800 text-white font-semibold shadow-inner border-r-4 border-blue-500'
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
              }`}
            >
              <span>إنشاء حساب</span>
            </button>
          </nav>
        )}
      </div>

      {/* القسم السفلي: زر تسجيل الخروج */}
      <div className="p-4 border-t border-slate-900 bg-slate-950">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-rose-450 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 rounded-xl transition cursor-pointer"
          title="تسجيل الخروج من النظام"
        >
          <span className="font-semibold tracking-wide">تسجيل الخروج</span>
        </button>
      </div>

    </div>
  );
}