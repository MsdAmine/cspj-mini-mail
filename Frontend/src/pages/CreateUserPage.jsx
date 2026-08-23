import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  UserPlus, Users, ArrowLeft, Check, AlertTriangle, 
  Building2, Mail, Lock, Shield, RefreshCw 
} from 'lucide-react';

export default function CreateUserPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [newPrenom, setNewPrenom] = useState('');
  const [newNom, setNewNom] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('Fonctionnaire'); 
  const [newInstitutionId, setNewInstitutionId] = useState('1');
  const [adminMessage, setAdminMessage] = useState({ type: '', text: '' });
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [fonctionnaires, setFonctionnaires] = useState([]);
  const [selectedFonctionnaireIds, setSelectedFonctionnaireIds] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [instRes, usersRes] = await Promise.all([
          api.get('/admin/institutions'),
          api.get('/admin/users')
        ]);
        
        setInstitutions(instRes.data || []);
        if (instRes.data && instRes.data.length > 0) {
          setNewInstitutionId(instRes.data[0].id.toString());
        }

        const foncs = (usersRes.data || []).filter(
          u => u.role?.toLowerCase() === 'fonctionnaire' && u.actif
        );
        setFonctionnaires(foncs);
      } catch (err) {
        console.error("Erreur lors de la récupération des données :", err);
      }
    };
    fetchData();
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setAdminMessage({ type: '', text: '' });

    if (!newPrenom.trim() || !newNom.trim() || !newEmail.trim() || !newPassword) {
      setAdminMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires.' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        prenom: newPrenom.trim(),
        nom: newNom.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        role: newRole,
        institutionId: parseInt(newInstitutionId, 10)
      };

      if (newRole === 'Association' && selectedFonctionnaireIds.length > 0) {
        payload.fonctionnaireIds = selectedFonctionnaireIds;
      }

      await api.post('/admin/users', payload);

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
      setSelectedFonctionnaireIds([]);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="ltr" className="flex-1 flex flex-col h-full bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">
      
      {/* ── Top Header ── */}
      <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-6 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Créer un Compte</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wider">
                Nouvel Utilisateur
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Enregistrement et attribution des accès sur le réseau CSPJ Mail
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/users')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            <span>Liste des utilisateurs</span>
          </button>
        </div>
      </header>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-3xl mx-auto">
          
          {/* Card Form */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-tight text-slate-900">Formulaire d'enregistrement</h3>
                <p className="text-xs text-slate-500 mt-0.5">Remplissez les informations du compte à créer</p>
              </div>
            </div>

            <div className="p-6">
              {adminMessage.text && (
                <div className={`p-4 rounded-xl text-xs font-semibold mb-6 flex items-center gap-2.5 ${
                  adminMessage.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {adminMessage.type === 'success' ? (
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  )}
                  <span>{adminMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Prénom <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newPrenom}
                      onChange={(e) => setNewPrenom(e.target.value)}
                      placeholder="Ex: Sanaa"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none transition duration-150 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nom <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newNom}
                      onChange={(e) => setNewNom(e.target.value)}
                      placeholder="Ex: Benjelloun"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none transition duration-150 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adresse Email Professionnelle <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Ex: s.benjelloun@cspj.ma"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none transition duration-150 text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mot de passe initial <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none transition duration-150 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Rôle utilisateur <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none transition duration-150 text-slate-800 cursor-pointer"
                    >
                      <option value="Fonctionnaire">Fonctionnaire</option>
                      <option value="Association">Association (جمعية)</option>
                      <option value="Administrateur">Administrateur</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Structure / Institution <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={newInstitutionId}
                      onChange={(e) => setNewInstitutionId(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none transition duration-150 text-slate-800 cursor-pointer"
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
                </div>

                {newRole === 'Association' && (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Fonctionnaires assignés / الموظفون المكلفون
                    </label>
                    <div className="border border-slate-200 rounded-xl bg-slate-50/50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {fonctionnaires.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">Aucun fonctionnaire actif disponible.</div>
                      ) : (
                        fonctionnaires.map(f => {
                          const checked = selectedFonctionnaireIds.includes(f.id);
                          return (
                            <label key={f.id} className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors ${checked ? 'bg-blue-50/70' : 'hover:bg-slate-50'}`}>
                              <input 
                                type="checkbox" 
                                checked={checked}
                                onChange={() => {
                                  setSelectedFonctionnaireIds(prev => 
                                    prev.includes(f.id) ? prev.filter(x => x !== f.id) : [...prev, f.id]
                                  );
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate">{f.prenom} {f.nom}</p>
                                <p className="text-[11px] text-slate-400 font-mono truncate">{f.email} {f.institutionNom ? `• ${f.institutionNom}` : ''}</p>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                    {selectedFonctionnaireIds.length > 0 && (
                      <p className="text-[11px] text-blue-600 font-medium mt-1.5">{selectedFonctionnaireIds.length} fonctionnaire(s) sélectionné(s)</p>
                    )}
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-xl text-xs font-semibold shadow-sm transition-all duration-150 active:scale-98 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    <span>Créer le compte</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
