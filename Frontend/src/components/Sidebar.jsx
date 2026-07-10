import React from 'react';
import { useMail } from '../context/MailContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ onComposeOpen, isAdminView, setIsAdminView, adminTab, setAdminTab }) {
  const { activeFolder, setActiveFolder } = useMail();
  const { user, logout } = useAuth();

  const folders = [
    { id: 'inbox', label: 'Boîte de réception' },
    { id: 'sent', label: 'Messages envoyés' },
    { id: 'archived', label: 'Archives' },
  ];

  const isUserAdmin = user?.role === "Administrateur";

  return (
    <div className="w-64 bg-slate-950 text-slate-200 flex flex-col h-full justify-between border-r border-slate-800 font-sans">
      
      {/* Partie Haute : Titre + Navigation */}
      <div className="p-4 flex-1">
        {/* Titre de l'application */}
        <div className="mb-8 px-2">
          <h1 className="font-bold text-sm tracking-wide text-white font-mono">CSPJ Mail</h1>
          <p className="text-[10px] text-slate-400 font-sans tracking-widest uppercase">Internal System</p>
        </div>

        {/* Bouton Nouveau Message (Masqué pour l'Administrateur) */}
        {!isUserAdmin && (
          <button
            onClick={onComposeOpen}
            className="w-full py-3 mb-6 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-900/30 active:scale-[0.98] flex items-center justify-center cursor-pointer"
          >
            <span>Nouveau message</span>
          </button>
        )}

        {/* Menu des dossiers (Masqué pour l'Administrateur) */}
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
                      ? 'bg-slate-800 text-white font-semibold shadow-inner border-l-4 border-blue-500'
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                  }`}
                >
                  <span>{folder.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Menu de l'Administrateur : Tableau de bord & Créer un compte */}
        {isUserAdmin && (
          <nav className="space-y-1 mt-4">
            <div className="px-3 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Administration</span>
            </div>
            
            <button
              onClick={() => setAdminTab('stats')}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${
                adminTab === 'stats'
                  ? 'bg-slate-800 text-white font-semibold shadow-inner border-l-4 border-blue-500'
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
              }`}
            >
              <span>Tableau de bord</span>
            </button>

            <button
              onClick={() => setAdminTab('create-user')}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${
                adminTab === 'create-user'
                  ? 'bg-slate-800 text-white font-semibold shadow-inner border-l-4 border-blue-500'
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
              }`}
            >
              <span>Créer un compte</span>
            </button>
          </nav>
        )}
      </div>

      {/* Partie Basse : Bouton Déconnexion */}
      <div className="p-4 border-t border-slate-900 bg-slate-950">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-rose-450 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 rounded-xl transition cursor-pointer"
          title="Se déconnecter du système"
        >
          <span className="font-semibold tracking-wide">Déconnexion</span>
        </button>
      </div>

    </div>
  );
}