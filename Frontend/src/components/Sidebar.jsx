import React from 'react';
import { useMail } from '../context/MailContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ onComposeOpen, isAdminView, setIsAdminView }) {
  const { activeFolder, setActiveFolder } = useMail();
  const { user, logout } = useAuth();

  const folders = [
    { id: 'inbox', label: 'Boîte de réception' },
    { id: 'sent', label: 'Messages envoyés' },
    { id: 'archived', label: 'Archives' },
  ];

  return (
    <div className="w-64 bg-slate-950 text-slate-200 flex flex-col h-full justify-between border-r border-slate-800">
      
      {/* Partie Haute : Titre + Navigation */}
      <div className="p-4 flex-1">
        {/* Titre de l'application sans le logo de la balance */}
        <div className="mb-8 px-2">
          <h1 className="font-bold text-sm tracking-wide text-white font-mono">CSPJ Mail</h1>
          <p className="text-[10px] text-slate-400 font-sans tracking-widest uppercase">Internal System</p>
        </div>

        {/* Bouton Nouveau Message */}
        <button
          onClick={onComposeOpen}
          className="w-full py-3 mb-6 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-900/30 active:scale-[0.98] flex items-center justify-center"
        >
          <span>Nouveau message</span>
        </button>

        {/* Menu des dossiers */}
        <nav className="space-y-1">
          {folders.map((folder) => {
            const isActive = !isAdminView && activeFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => {
                  setIsAdminView(false);
                  setActiveFolder(folder.id);
                }}
                className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold shadow-inner border-l-4 border-blue-500'
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                }`}
              >
                <span>{folder.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bouton de Gestion des Comptes (Uniquement pour l'Admin) */}
        {user?.role === "Administrateur" && (
          <div className="mt-6 pt-6 border-t border-slate-900">
            <button
              onClick={() => setIsAdminView(!isAdminView)}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md active:scale-[0.98] flex items-center justify-center ${
                isAdminView
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-600'
              }`}
            >
              {isAdminView ? "Voir la Messagerie" : "Gestion des Comptes"}
            </button>
          </div>
        )}
      </div>

      {/* Partie Basse : Bouton Déconnexion */}
      <div className="p-4 border-t border-slate-900 bg-slate-950">
        <button
          onClick={logout}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 rounded-xl transition group"
          title="Se déconnecter du système"
        >
          <div className="flex items-center">
            <span className="font-semibold tracking-wide">Déconnexion</span>
          </div>
          <span className="text-xs text-rose-500/50 group-hover:text-rose-400 transition transform group-hover:translate-x-0.5 duration-200">➔</span>
        </button>
      </div>

    </div>
  );
}