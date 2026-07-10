import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage({ onBack }) {
  const { user, logout } = useAuth();

  const getEntrepriseName = (id) => {
    if (id === 1) return 'CSPJ — Conseil Supérieur du Pouvoir Judiciaire';
    if (id === 2) return 'Association des Magistrats Marocains';
    return 'Structure externe';
  };

  const getRoleLabel = (role) => {
    if (role === 'Administrateur') return 'Administrateur Système';
    if (role === 'Fonctionnaire') return 'Fonctionnaire — Interne CSPJ';
    if (role === 'Association') return 'Association — Partenaire Externe';
    return role;
  };

  const getRoleBadge = (role) => {
    if (role === 'Administrateur') return 'bg-blue-600 text-white';
    if (role === 'Fonctionnaire') return 'bg-amber-500 text-white';
    if (role === 'Association') return 'bg-emerald-600 text-white';
    return 'bg-slate-600 text-white';
  };

  const fullName = user ? `${user.prenom} ${user.nom}` : 'Utilisateur';
  const initials = user
    ? `${user.prenom?.charAt(0) ?? ''}${user.nom?.charAt(0) ?? ''}`
    : 'U';

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ background: '#f4f6f9' }}>

      {/* Top nav bar */}
      <header className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-8 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 transition group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>

        <nav className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
          <span>CSPJ Mail</span>
          <span className="mx-1.5 text-slate-300">/</span>
          <span className="text-slate-700 font-semibold">Mon Profil</span>
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-4 py-1.5 hover:border-slate-300 hover:bg-slate-50 transition duration-150"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
          </svg>
          Déconnexion
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex justify-center px-6 py-10">
        <div className="w-full max-w-3xl space-y-5">

          {/* === Hero card === */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Dark gradient banner */}
            <div
              className="h-36 w-full relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1e3a5f 100%)' }}
            >
              {/* Decorative circles */}
              <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full opacity-10 bg-blue-400 blur-2xl" />
              <div className="absolute bottom-0 left-1/3 w-64 h-20 rounded-full opacity-5 bg-indigo-300 blur-2xl" />

              {/* CSPJ label watermark */}
              <span className="absolute top-5 right-6 text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500 select-none">
                CSPJ Mail — Espace Sécurisé
              </span>
            </div>

            {/* Avatar + identity below banner */}
            <div className="px-8 pb-7 flex items-end gap-6 -mt-12 relative">
              {/* Avatar circle */}
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-2xl font-bold uppercase border-4 border-white shadow-lg shrink-0 select-none"
                style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}
              >
                {initials}
              </div>

              {/* Name / email / badge */}
              <div className="pt-14 flex-1 flex items-end justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 leading-tight">{fullName}</h1>
                  <p className="text-sm text-slate-500 font-mono mt-0.5">{user?.email}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg ${getRoleBadge(user?.role)}`}>
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          {/* === Account details — full width === */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Informations du compte</h2>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-300">Lecture seule</span>
            </div>

            <div className="divide-y divide-slate-50">
              {[
                { label: 'Prénom', value: user?.prenom },
                { label: 'Nom', value: user?.nom },
                { label: 'Adresse e-mail', value: user?.email },
                { label: 'Rôle système', value: getRoleLabel(user?.role) },
                { label: 'Structure', value: getEntrepriseName(user?.entrepriseId) },
              ].map((field) => (
                <div key={field.label} className="px-6 py-4 grid grid-cols-3 items-center">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{field.label}</span>
                  <span className="col-span-2 text-sm font-semibold text-slate-800">{field.value || '—'}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
