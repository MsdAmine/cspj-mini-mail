import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function CreateUserPage() {
  const { user } = useAuth();
  
  const [newPrenom, setNewPrenom] = useState('');
  const [newNom, setNewNom] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('Fonctionnaire'); 
  const [newInstitutionId, setNewInstitutionId] = useState('1');
  const [adminMessage, setAdminMessage] = useState({ type: '', text: '' });
  const [institutions, setInstitutions] = useState([]);

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const response = await api.get('/admin/institutions');
        setInstitutions(response.data || []);
        if (response.data && response.data.length > 0) {
          setNewInstitutionId(response.data[0].id.toString());
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des institutions :", err);
      }
    };
    fetchInstitutions();
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setAdminMessage({ type: '', text: '' });

    if (!newPrenom.trim() || !newNom.trim() || !newEmail.trim() || !newPassword) {
      setAdminMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires.' });
      return;
    }

    try {
      await api.post('/admin/users', {
        prenom: newPrenom.trim(),
        nom: newNom.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        role: newRole,
        institutionId: parseInt(newInstitutionId, 10)
      });

      setAdminMessage({ 
        type: 'success', 
        text: `Le compte de ${newPrenom} ${newNom} (${newRole}) a été créé avec succès !` 
      });

      // Enregistrer dans le journal d'audit en backend
      await api.post('/admin/audit-logs', {
        typeAction: 'CREATE_USER',
        utilisateur: user?.email || 'admin',
        description: `Création du compte utilisateur pour ${newPrenom} ${newNom} (${newEmail.trim().toLowerCase()}) avec le rôle ${newRole}.`
      });

      // Réinitialiser le formulaire
      setNewPrenom('');
      setNewNom('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('Fonctionnaire');
      if (institutions.length > 0) {
        setNewInstitutionId(institutions[0].id.toString());
      } else {
        setNewInstitutionId('1');
      }

    } catch (err) {
      const errorMessage = typeof err.response?.data === 'string' 
        ? err.response.data 
        : err.response?.data?.message || err.message || "Erreur lors de la création du compte.";
      setAdminMessage({ type: 'error', text: errorMessage });
    }
  };

  return (
    <div dir="ltr" className="flex-1 bg-[#f8fafc] p-8 overflow-y-auto flex flex-col items-center text-left">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_0_rgb(0_0_0/_0.04),_0_4px_6px_-2px_rgb(0_0_0/_0.04)] hover:shadow-[0_4px_16px_-4px_rgb(0_0_0/_0.1)] transition-shadow duration-300 overflow-hidden animate-fade-in">
        {/* Prismatic accent bar */}
        <div className="h-px w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
        {/* Card header */}
        <div className="px-6 py-5 bg-slate-50/60 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/25 flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900 leading-none">Enregistrer un nouvel utilisateur</h2>
              <p className="text-slate-500 text-xs mt-0.5">Le compte créé sera actif et recevra automatiquement ses accès sécurisés.</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {adminMessage.text && (
            <div className={`p-4 rounded-xl text-xs font-semibold mb-5 flex items-center gap-2 ${
              adminMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {adminMessage.type === 'success' ? (
                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              ) : (
                <svg className="w-4 h-4 text-rose-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              )}
              {adminMessage.text}
            </div>
          )}

          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Prénom *</label>
                <input
                  type="text"
                  required
                  value={newPrenom}
                  onChange={(e) => setNewPrenom(e.target.value)}
                  placeholder="Ex: Sanaa"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition duration-150"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nom *</label>
                <input
                  type="text"
                  required
                  value={newNom}
                  onChange={(e) => setNewNom(e.target.value)}
                  placeholder="Ex: Benjelloun"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition duration-150"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Adresse Email Professionnelle *</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Ex: s.benjelloun@cspj.ma"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition duration-150"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Mot de passe provisoire *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition duration-150"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Rôle affecté</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition duration-150 cursor-pointer"
              >
                <option value="Fonctionnaire">Fonctionnaire</option>
                <option value="Association">Association (جمعية)</option>
                <option value="Administrateur">Administrateur</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Institution / Structure Affectée <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={newInstitutionId}
                onChange={(e) => setNewInstitutionId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition duration-150 cursor-pointer"
              >
                {institutions.length === 0 ? (
                  <option value="" disabled>Chargement des structures...</option>
                ) : (
                  institutions.map(inst => (
                    <option key={inst.id} value={inst.id.toString()}>{inst.nom}</option>
                  ))
                )}
              </select>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl text-sm font-semibold hover:from-slate-700 hover:to-slate-800 active:scale-[0.98] transition-all duration-150 shadow-md shadow-slate-900/20 cursor-pointer focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 outline-none"
              >
                Créer le compte utilisateur
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
