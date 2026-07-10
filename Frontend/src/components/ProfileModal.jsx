import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfileModal({ onClose }) {
  const { user, updateCurrentUser } = useAuth();

  // États locaux pré-remplis
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState(user?.password || '');
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });

    if (!username.trim() || !password.trim()) {
      setStatusMessage({ type: 'error', text: "L'identifiant et le mot de passe ne peuvent pas être vides." });
      return;
    }

    try {
      if (updateCurrentUser) {
        updateCurrentUser({
          ...user,
          username: username.trim(),
          email: email.trim(),
          password: password.trim()
        });
        setStatusMessage({ type: 'success', text: 'Vos informations ont été mises à jour avec succès.' });
        setTimeout(() => onClose(), 1200);
      } else {
        setStatusMessage({ type: 'error', text: "La fonction de mise à jour n'est pas configurée dans AuthContext." });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || "Une erreur est survenue." });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-md">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden m-4 transition-all transform scale-100">
        
        {/* En-tête du Modal */}
        <div className="relative bg-slate-950 text-white px-6 py-5 flex items-center justify-between overflow-hidden">
          {/* Motif abstrait décoratif en arrière-plan */}
          <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center space-x-2.5 z-10">
            <h3 className="font-bold tracking-wider text-xs uppercase text-slate-300">Mon Profil Personnel</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition outline-none z-10"
          >
            ✕
          </button>
        </div>

        {/* Corps du Modal */}
        <form onSubmit={handleUpdateProfile} className="p-6 space-y-5">
          
          {/* Petite fiche d'identité visuelle de l'utilisateur */}
          <div className="bg-slate-50/80 border border-slate-100 p-4 rounded-xl flex items-center space-x-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-slate-900 to-slate-800 text-white font-bold text-xl flex items-center justify-center shadow-md uppercase">
              {username ? username.charAt(0) : 'U'}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">{username || "Utilisateur"}</h4>
              <p className="text-xs text-slate-500">{email || "Pas d'adresse email configurée"}</p>
              <div className="mt-1 flex items-center">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 shadow-sm">
                  {user?.role || "Membre"}
                </span>
              </div>
            </div>
          </div>

          {statusMessage.text && (
            <div className={`p-3 text-xs font-semibold rounded-lg border flex items-center space-x-2 ${
              statusMessage.type === 'success' 
                ? 'text-emerald-800 bg-emerald-50/50 border-emerald-200' 
                : 'text-rose-800 bg-rose-50/50 border-rose-200'
            }`}>
              <span>{statusMessage.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Rôle Système (Lecture seule) */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider">
              Habilitation / Rôle Système
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                {/* Icône de cadenas */}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type="text"
                disabled
                value={user?.role || 'Utilisateur'}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-100 text-slate-500 font-medium cursor-not-allowed outline-none"
              />
            </div>
          </div>

          {/* Nom d'utilisateur */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider">
              Nom d'utilisateur (Username) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 focus-within:text-blue-500">
                {/* Icône utilisateur */}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition duration-150"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider">
              Adresse Email Professionnelle
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                {/* Icône de boîte aux lettres */}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition duration-150"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider">
              Mot de passe sécurisé *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                {/* Icône de clé */}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m-5 4a5 5 0 11-5-5h7.93l3.06-3.06a1.5 1.5 0 012.12 0l1.41 1.41a1.5 1.5 0 010 2.12L18.42 13H15v3h-3v-3z" />
                </svg>
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition duration-150"
              />
            </div>
          </div>

          {/* Boutons d'Action */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition duration-150 active:scale-[0.98]"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 transition duration-150 active:scale-[0.98]"
            >
              Enregistrer
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}