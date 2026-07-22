import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage({ onBack }) {
  const { user, logout, updateProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editPrenom, setEditPrenom] = useState('');
  const [editNom, setEditNom] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ── Role detection ──────────────────────────────────────────────────────────
  const isAdmin = user?.role === 'Administrateur';
  const isRTL   = !isAdmin; // Fonctionnaire + Association → Arabic RTL

  // ── Helper functions ────────────────────────────────────────────────────────
  const getEntrepriseName = (id) => {
    if (isAdmin) {
      if (id === 1) return 'CSPJ — Conseil Supérieur du Pouvoir Judiciaire';
      if (id === 2) return 'Association des Magistrats Marocains';
      return 'Structure externe';
    }
    // Arabic names for RTL users
    if (id === 1) return 'المجلس الأعلى للسلطة القضائية — CSPJ';
    if (id === 2) return 'جمعية القضاة المغاربة';
    return 'هيكل خارجي';
  };

  const getRoleLabel = (role) => {
    if (isAdmin) {
      if (role === 'Administrateur') return 'Administrateur Système';
      if (role === 'Fonctionnaire')  return 'Fonctionnaire — Interne CSPJ';
      if (role === 'Association')    return 'Association — Partenaire Externe';
      return role;
    }
    // Arabic labels for RTL users
    if (role === 'Fonctionnaire') return 'موظف — داخلي CSPJ';
    if (role === 'Association')   return 'جمعية — شريك خارجي';
    return role;
  };

  const getRoleBadge = (role) => {
    if (role === 'Administrateur') return 'bg-blue-600 text-white';
    if (role === 'Fonctionnaire')  return 'bg-amber-500 text-white';
    if (role === 'Association')    return 'bg-emerald-600 text-white';
    return 'bg-slate-600 text-white';
  };

  const getRoleBadgeLabel = (role) => {
    if (isAdmin) return role; // keep French for Admin
    if (role === 'Fonctionnaire') return 'موظف';
    if (role === 'Association')   return 'جمعية';
    return role;
  };

  const fullName = user ? `${user.prenom} ${user.nom}` : (isAdmin ? 'Utilisateur' : 'المستخدم');
  const initials = user
    ? `${user.prenom?.charAt(0) ?? ''}${user.nom?.charAt(0) ?? ''}`
    : 'U';

  // ── Edit handlers ───────────────────────────────────────────────────────────
  const handleEditStart = () => {
    setEditPrenom(user?.prenom ?? '');
    setEditNom(user?.nom ?? '');
    setEditEmail(user?.email ?? '');
    setMessage({ type: '', text: '' });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setMessage({ type: '', text: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editPrenom.trim() || !editNom.trim() || !editEmail.trim()) {
      setMessage({
        type: 'error',
        text: isRTL ? 'جميع الحقول إلزامية.' : 'Tous les champs sont obligatoires.',
      });
      return;
    }
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await updateProfile({ prenom: editPrenom, nom: editNom, email: editEmail });
      setMessage({
        type: 'success',
        text: isRTL ? 'تم تحديث الملف الشخصي بنجاح.' : 'Profil mis à jour avec succès.',
      });
      setIsEditing(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Fields config ───────────────────────────────────────────────────────────
  const fields = isAdmin
    ? [
        { label: 'Prénom',         value: user?.prenom,                          editable: true,  key: 'prenom' },
        { label: 'Nom',            value: user?.nom,                             editable: true,  key: 'nom' },
        { label: 'Adresse e-mail', value: user?.email,                           editable: true,  key: 'email' },
        { label: 'Rôle système',   value: getRoleLabel(user?.role),              editable: false, key: 'role' },
        { label: 'Structure',      value: getEntrepriseName(user?.entrepriseId),  editable: false, key: 'structure' },
      ]
    : [
        { label: 'الاسم الشخصي',      value: user?.prenom,                          editable: true,  key: 'prenom' },
        { label: 'الاسم العائلي',      value: user?.nom,                             editable: true,  key: 'nom' },
        { label: 'البريد الإلكتروني',  value: user?.email,                           editable: true,  key: 'email' },
        { label: 'الدور في النظام',    value: getRoleLabel(user?.role),              editable: false, key: 'role' },
        { label: 'المؤسسة / الهيكل',  value: getEntrepriseName(user?.entrepriseId),  editable: false, key: 'structure' },
      ];

  const getEditValue = (key) => {
    if (key === 'prenom') return editPrenom;
    if (key === 'nom')    return editNom;
    if (key === 'email')  return editEmail;
    return '';
  };

  const handleEditChange = (key, val) => {
    if (key === 'prenom') setEditPrenom(val);
    if (key === 'nom')    setEditNom(val);
    if (key === 'email')  setEditEmail(val);
  };

  // ── UI strings (Admin = French, Others = Arabic) ────────────────────────────
  const ui = isAdmin
    ? {
        backLabel:    'Retour',
        breadcrumb:   'Mon Profil',
        logoutLabel:  'Déconnexion',
        heroBadge:    'CSPJ Mail — Espace Sécurisé',
        sectionTitle: 'Informations du compte',
        editBtn:      'Modifier',
        cancelBtn:    'Annuler',
        savingBtn:    'Enregistrement...',
        saveBtn:      'Enregistrer',
      }
    : {
        backLabel:    'رجوع',
        breadcrumb:   'ملفي الشخصي',
        logoutLabel:  'تسجيل الخروج',
        heroBadge:    'CSPJ Mail — مساحة آمنة',
        sectionTitle: 'معلومات الحساب',
        editBtn:      'تعديل',
        cancelBtn:    'إلغاء',
        savingBtn:    'جارٍ الحفظ...',
        saveBtn:      'حفظ التغييرات',
      };

  // Back-button chevron: chevron-right for RTL ("go back" = forward arrow in RTL)
  const ChevronBack = () => (
    <svg
      className={`w-4 h-4 transition-transform ${isRTL ? 'group-hover:translate-x-0.5' : 'group-hover:-translate-x-0.5'}`}
      fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
    >
      {isRTL
        ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        : <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      }
    </svg>
  );

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="flex flex-col flex-1 min-h-0 overflow-y-auto"
      style={{ background: '#f4f6f9' }}
    >
      {/* ── Top nav bar ─────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-8 shrink-0">

        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 transition group"
        >
          <ChevronBack />
          {ui.backLabel}
        </button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
          <span>CSPJ Mail</span>
          <span className="mx-1.5 text-slate-300">/</span>
          <span className="text-slate-700 font-semibold">{ui.breadcrumb}</span>
        </nav>

        {/* Logout button */}
        <button
          onClick={logout}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-4 py-1.5 hover:border-slate-300 hover:bg-slate-50 transition duration-150"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
          </svg>
          {ui.logoutLabel}
        </button>
      </header>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex justify-center px-6 py-10">
        <div className="w-full max-w-2xl space-y-5">

          {/* === Hero card === */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div
              className="h-36 w-full relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1e3a5f 100%)' }}
            >
              <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full opacity-10 bg-blue-400 blur-2xl" />
              <div className="absolute bottom-0 left-1/3 w-64 h-20 rounded-full opacity-5 bg-indigo-300 blur-2xl" />
              {/* Badge: top-right in LTR, top-left in RTL */}
              <span className={`absolute top-5 ${isRTL ? 'left-6' : 'right-6'} text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500 select-none`}>
                {ui.heroBadge}
              </span>
            </div>

            {/* Avatar row — reversed in RTL */}
            <div className={`px-8 pb-7 flex items-end gap-6 -mt-12 relative ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-2xl font-bold uppercase border-4 border-white shadow-lg shrink-0 select-none"
                style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}
              >
                {initials}
              </div>

              <div className={`pt-14 flex-1 flex items-end justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                  <h1 className="text-xl font-bold text-slate-900 leading-tight">{fullName}</h1>
                  <p className="text-sm text-slate-500 font-mono mt-0.5">{user?.email}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg ${getRoleBadge(user?.role)}`}>
                  {getRoleBadgeLabel(user?.role)}
                </span>
              </div>
            </div>
          </div>

          {/* === Feedback message === */}
          {message.text && (
            <div className={`px-5 py-3.5 rounded-xl text-xs font-semibold border ${isRTL ? 'text-right' : ''} ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* === Account details card === */}
          <form onSubmit={handleSave}>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

              {/* Card header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {ui.sectionTitle}
                </h2>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={handleEditStart}
                    className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 transition"
                  >
                    {ui.editBtn}
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition"
                    >
                      {ui.cancelBtn}
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="text-[10px] font-bold uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition disabled:opacity-60"
                    >
                      {isSaving ? ui.savingBtn : ui.saveBtn}
                    </button>
                  </div>
                )}
              </div>

              {/* Fields */}
              <div className="divide-y divide-slate-50">
                {fields.map((field) => (
                  <div
                    key={field.key}
                    className={`px-6 py-4 grid grid-cols-3 items-center gap-4 ${isRTL ? 'text-right' : ''}`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      {field.label}
                      {field.editable && (
                        <span className={`${isRTL ? 'mr-1' : 'ml-1'} text-blue-400`}>•</span>
                      )}
                    </span>

                    {isEditing && field.editable ? (
                      <input
                        type={field.key === 'email' ? 'email' : 'text'}
                        required
                        dir={isRTL ? 'rtl' : 'ltr'}
                        value={getEditValue(field.key)}
                        onChange={(e) => handleEditChange(field.key, e.target.value)}
                        className={`col-span-2 px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition duration-150 ${isRTL ? 'text-right' : 'text-left'}`}
                      />
                    ) : (
                      <span
                        className={`col-span-2 text-sm font-semibold text-slate-800 ${field.key === 'email' ? 'font-mono' : ''}`}
                      >
                        {field.value || '—'}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Read-only notice */}
              <div className={`px-6 py-3 bg-slate-50 border-t border-slate-100 ${isRTL ? 'text-right' : ''}`}>
                <p className="text-[9px] text-slate-400 leading-relaxed">
                  {isRTL ? (
                    <>
                      يتم تحديد الدور والمؤسسة من طرف إدارة CSPJ ولا يمكن تعديلهما هنا.
                      {' '}الحقول المعلّمة بـ{' '}
                      <span className="text-blue-400 font-bold">•</span>
                      {' '}قابلة للتعديل.
                    </>
                  ) : (
                    <>
                      Le rôle et la structure sont définis par l'administration CSPJ et ne peuvent pas être modifiés ici.
                      {' '}Les champs marqués <span className="text-blue-400 font-bold">•</span> sont modifiables.
                    </>
                  )}
                </p>
              </div>
            </div>
          </form>

        </div>
      </main>
    </div>
  );
}
