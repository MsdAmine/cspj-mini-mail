import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfileModal({ onClose }) {
  const { user } = useAuth();

  const getEntrepriseName = (id) => {
    if (id === 1) return "CSPJ (Conseil)";
    if (id === 2) return "Association des Magistrats Marocains";
    return "Structure externe";
  };

  const getRoleLabel = (role) => {
    if (role === 'Administrateur') return 'Administrateur (CSPJ)';
    if (role === 'Fonctionnaire') return 'Fonctionnaire (Interne CSPJ)';
    if (role === 'Association') return 'Association (Partenaire Externe)';
    return role;
  };

  const fullName = user ? `${user.prenom} ${user.nom}` : 'Utilisateur';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-md">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden m-4">
        
        {/* En-tête du Modal */}
        <div className="relative bg-slate-950 text-white px-6 py-5 flex items-center justify-between overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center space-x-2.5 z-10">
            <h3 className="font-bold tracking-wider text-xs uppercase text-slate-300">Profil Utilisateur</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition outline-none z-10"
          >
            ✕
          </button>
        </div>

        {/* Corps du Modal */}
        <div className="p-6 space-y-5">
          
          {/* Fiche d'identité visuelle */}
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center space-x-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-slate-900 to-slate-850 text-white font-bold text-xl flex items-center justify-center shadow-md uppercase">
              {user?.prenom ? user.prenom.charAt(0) : 'U'}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">{fullName}</h4>
              <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
              <div className="mt-1 flex items-center">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Note d'information sécuritaire */}
          <div className="p-3 text-xs text-blue-800 bg-blue-50/50 border border-blue-200 rounded-lg flex items-start gap-2">
            <span>
              Les informations de profil et habilitations sont définies et sécurisées par le pôle d'administration CSPJ. Pour toute modification, veuillez contacter l'administrateur système.
            </span>
          </div>

          {/* Détails du compte */}
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                Prénom
              </label>
              <input
                type="text"
                disabled
                value={user?.prenom || ''}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-600 outline-none font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                Nom de famille
              </label>
              <input
                type="text"
                disabled
                value={user?.nom || ''}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-600 outline-none font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                Structure / Entreprise
              </label>
              <input
                type="text"
                disabled
                value={getEntrepriseName(user?.entrepriseId)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-600 outline-none font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                Type de Rôle
              </label>
              <input
                type="text"
                disabled
                value={getRoleLabel(user?.role)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-600 outline-none font-medium cursor-not-allowed"
              />
            </div>
          </div>

          {/* Bouton de fermeture */}
          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition duration-150 active:scale-[0.98]"
            >
              Fermer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}