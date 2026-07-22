import React, { useState, useEffect } from 'react';
import { useMail } from '../context/MailContext';
import { useAuth } from '../context/AuthContext';
import { useLogs } from '../context/LogContext';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import MailList from '../components/MailList';
import ComposeModal from '../components/ComposeModal';
import ProfilePage from './ProfilePage';
import ManageUsers from '../components/ManageUsers';
import ManageLogs from '../components/ManageLogs';
import TiptapEditor from '../components/TiptapEditor';
import { Send } from 'lucide-react';


export default function Dashboard() {
  const { user, adminCreateUser } = useAuth();
  const { addLog } = useLogs();
  const { 
    searchQuery, 
    setSearchQuery, 
    selectedMessage, 
    replyToThread, 
    toggleArchiveMessage 
  } = useMail();
  
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false); 
  const [replyBody, setReplyBody] = useState('');
  
  // Navigation Admin
  const [adminTab, setAdminTab] = useState('stats'); // 'stats' | 'create-user'
  
  // États pour la création de compte (Admin)
  const [isAdminView, setIsAdminView] = useState(user?.role === 'Administrateur');
  const [newPrenom, setNewPrenom] = useState('');
  const [newNom, setNewNom] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('Fonctionnaire'); 
  const [newEntrepriseId, setNewEntrepriseId] = useState('1'); // Par défaut 1 (CSPJ Conseil)
  const [adminMessage, setAdminMessage] = useState({ type: '', text: '' });

  // Suivi des discussions (Mock Data)
  const [threadSearch, setThreadSearch] = useState('');
  const [threadStatusFilter, setThreadStatusFilter] = useState('ALL');

  // Statistiques Administrateur
  const [stats, setStats] = useState({ totalUsers: 0, totalThreads: 0, totalMessagesSent: 0 });
  const [threads, setThreads] = useState([]);
  const [entreprises, setEntreprises] = useState([]);

  const fetchEntreprises = async () => {
    try {
      const response = await api.get('/admin/entreprises');
      setEntreprises(response.data || []);
      if (response.data && response.data.length > 0) {
        setNewEntrepriseId(response.data[0].id.toString());
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des entreprises :", err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      const data = response.data || {};
      setStats({
        totalUsers: data.totalUsers || 0,
        totalThreads: data.totalThreads || 0,
        totalMessagesSent: data.totalMessagesSent || 0
      });
    } catch (err) {
      console.error("Erreur lors de la récupération des statistiques :", err);
      setStats({
        totalUsers: 0,
        totalThreads: 0,
        totalMessagesSent: 0
      });
    }
  };

  const fetchThreads = async () => {
    try {
      const response = await api.get('/admin/threads');
      setThreads(response.data || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des discussions :", err);
      setThreads([]);
    }
  };

  useEffect(() => {
    if (user?.role === 'Administrateur') {
      setIsAdminView(true);
    } else {
      setIsAdminView(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAdminView && user?.role === 'Administrateur') {
      fetchStats();
      fetchThreads();
      fetchEntreprises();
    }
  }, [isAdminView, user]);

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
        entrepriseId: parseInt(newEntrepriseId, 10)
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
      setNewEntrepriseId('1');

      // Recharger les statistiques
      fetchStats();
    } catch (err) {
      const errorMessage = typeof err.response?.data === 'string' 
        ? err.response.data 
        : err.response?.data?.message || err.message || "Erreur lors de la création du compte.";
      setAdminMessage({ type: 'error', text: errorMessage });
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    // FIX 1-B: await the async call so body only clears on SUCCESS
    // Previously this was fire-and-forget — a network error would silently
    // discard the user's typed reply.
    await replyToThread(selectedMessage.threadId, replyBody);
    setReplyBody('');
  };

  const filteredThreads = threads.filter(t => {
    const query = threadSearch.toLowerCase().trim();
    const matchesQuery = !query || 
      t.objet.toLowerCase().includes(query) ||
      t.expediteur.toLowerCase().includes(query) ||
      t.destinataire.toLowerCase().includes(query) ||
      t.expediteurEmail.toLowerCase().includes(query) ||
      t.destinataireEmail.toLowerCase().includes(query);

    let matchesStatus = true;
    if (threadStatusFilter === 'EN_COURS') matchesStatus = t.statutAcheminement === 'En cours';
    else if (threadStatusFilter === 'CLOTURE') matchesStatus = t.statutAcheminement === 'Clôturé';

    return matchesQuery && matchesStatus;
  });

  if (isProfileOpen) {
    return (
      <div className="flex h-screen w-screen bg-slate-100 overflow-hidden font-sans text-slate-800">
        <Sidebar 
          onComposeOpen={() => setIsComposeOpen(true)} 
          isAdminView={isAdminView}
          setIsAdminView={(val) => { setIsAdminView(val); setAdminMessage({ type: '', text: '' }); }}
          adminTab={adminTab}
          setAdminTab={setAdminTab}
        />
        <ProfilePage onBack={() => setIsProfileOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-100 overflow-hidden font-sans text-slate-800">
      
      <Sidebar 
        onComposeOpen={() => setIsComposeOpen(true)} 
        isAdminView={isAdminView}
        setIsAdminView={(val) => { setIsAdminView(val); setAdminMessage({ type: '', text: '' }); }}
        adminTab={adminTab}
        setAdminTab={setAdminTab}
      />

      <div className="flex flex-col flex-1 min-w-0">
        
        {/* En-tête épuré avec barre de recherche et profil utilisateur */}
        <header dir="ltr" className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
          <div className="w-96">
            {!isAdminView && (
              <input
                type="text"
                placeholder="البحث عن رسالة أو موضوع..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-slate-100 border border-transparent rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
            )}
          </div>
          
          <div className="flex items-center">
            {/* Zone profil cliquable avec avatar */}
            <div 
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-transparent hover:border-slate-200 transition duration-150 group"
              title="عرض معلوماتي الشخصية"
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition">
                  {user ? `${user.prenom} ${user.nom}` : ''}
                </p>
                <p className="text-[10px] text-amber-600 font-mono font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                  {user?.role}
                </p>
              </div>

              {/* Avatar de profil circulaire */}
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-semibold text-sm flex items-center justify-center border border-slate-800 shadow-sm group-hover:bg-blue-600 group-hover:border-blue-500 transition duration-150 uppercase font-mono">
                {user?.prenom ? user.prenom.charAt(0) : 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Contenu alternatif (Gestion Admin ou Messagerie) */}
        {isAdminView ? (
          <div dir="ltr" className="flex-1 bg-slate-50 p-8 overflow-y-auto flex flex-col items-center text-left">
            {adminTab === 'stats' ? (
              <div className="w-full max-w-4xl space-y-8 animate-fade-in">
                {/* En-tête du tableau de bord */}
                <div className="border-b border-slate-200 pb-5">
                  <h2 className="text-lg font-bold text-slate-900">Tableau de bord administratif</h2>
                  <p className="text-slate-500 text-xs mt-1">Données analytiques et statistiques globales d'activité sur le serveur de messagerie.</p>
                </div>

                {/* Grille des indicateurs de statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Carte : Utilisateurs */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-blue-600 transition hover:shadow-md">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Comptes Utilisateurs</p>
                    <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.totalUsers}</p>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">Profils enregistrés et habilités sur le réseau interne.</p>
                  </div>

                  {/* Carte : Discussions */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-indigo-600 transition hover:shadow-md">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Discussions Initiées</p>
                    <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.totalThreads}</p>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">Fils de discussion distincts créés par les utilisateurs.</p>
                  </div>

                  {/* Carte : Messages */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-slate-600 transition hover:shadow-md">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Messages Acheminés</p>
                    <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.totalMessagesSent}</p>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">Volume total de messages transmis de bout en bout.</p>
                  </div>
                </div>

                {/* Tableau de suivi des discussions */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Suivi des Discussions / Échanges</h3>
                      <p className="text-slate-500 text-[11px] mt-0.5">Dernières conversations surveillées sur la plateforme (Juillet 2026).</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Rechercher sujet, expéditeur..."
                        value={threadSearch}
                        onChange={(e) => setThreadSearch(e.target.value)}
                        className="px-3 py-1.5 border border-slate-250 rounded-lg text-xs outline-none focus:border-blue-600 w-48 md:w-56"
                      />
                      <select
                        value={threadStatusFilter}
                        onChange={(e) => setThreadStatusFilter(e.target.value)}
                        className="px-3 py-1.5 border border-slate-250 rounded-lg text-xs outline-none bg-white cursor-pointer w-32"
                      >
                        <option value="ALL">Tous les statuts</option>
                        <option value="EN_COURS">En cours</option>
                        <option value="CLOTURE">Clôturés</option>
                      </select>
                    </div>
                  </div>

                  {filteredThreads.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      Aucune discussion ne correspond aux critères de recherche.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 uppercase font-bold tracking-wider">
                            <th className="px-4 py-3">Sujet / Objet</th>
                            <th className="px-4 py-3">Expéditeur</th>
                            <th className="px-4 py-3">Destinataire</th>
                            <th className="px-4 py-3 text-center">Pièce Jointe</th>
                            <th className="px-4 py-3 text-center">Lecture</th>
                            <th className="px-4 py-3 text-center">Acheminement</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                          {filteredThreads.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition">
                              <td className="px-4 py-3.5 font-semibold text-slate-800 max-w-xs truncate" title={t.objet}>
                                {t.objet}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="font-medium text-slate-850">{t.expediteur}</div>
                                <div className="text-[10px] text-slate-400 font-mono" dir="ltr">{t.expediteurEmail}</div>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="font-medium text-slate-850">{t.destinataire}</div>
                                <div className="text-[10px] text-slate-400 font-mono" dir="ltr">{t.destinataireEmail}</div>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                {t.hasAttachment ? (
                                  <span className="inline-flex items-center text-slate-600">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.586 6.586a6 6 0 108.486 8.486L20 13" /></svg>
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                  t.statutLecture === 'Lu' 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse'
                                }`}>
                                  {t.statutLecture}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-lg border uppercase tracking-wider font-mono ${
                                  t.statutAcheminement === 'En cours'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-300'
                                }`}>
                                  {t.statutAcheminement}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Tableau des habilitations système */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/65">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Matrice des habilitations d'accès</h3>
                  </div>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200/60 text-slate-450 uppercase font-semibold">
                        <th className="px-6 py-3">Rôle Système</th>
                        <th className="px-6 py-3">Périmètre Applicatif</th>
                        <th className="px-6 py-3">Statut Réseau</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      <tr>
                        <td className="px-6 py-3.5 font-semibold text-slate-800">Administrateur</td>
                        <td className="px-6 py-3.5">Création et audit des comptes utilisateurs, consultation des statistiques de trafic.</td>
                        <td className="px-6 py-3.5 text-emerald-600 font-medium">Actif</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-3.5 font-semibold text-slate-800">Fonctionnaire</td>
                        <td className="px-6 py-3.5">Messagerie professionnelle interne, communication sécurisée inter-services.</td>
                        <td className="px-6 py-3.5 text-emerald-600 font-medium">Actif</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-3.5 font-semibold text-slate-800">Association</td>
                        <td className="px-6 py-3.5">Accès externe restreint, envoi et réception de messages avec les services habilités.</td>
                        <td className="px-6 py-3.5 text-emerald-600 font-medium">Actif</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : adminTab === 'manage-users' ? (
              <ManageUsers />
            ) : adminTab === 'audit-logs' ? (
              <ManageLogs />
            ) : (
              <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden animate-fade-in">
                {/* En-tête de la fiche de création */}
                <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-200/60">
                  <h2 className="text-base font-bold text-slate-900">Enregistrer un nouvel utilisateur</h2>
                  <p className="text-slate-500 text-xs mt-1">Le compte créé sera actif et recevra automatiquement ses accès sécurisés.</p>
                </div>

                <div className="p-6">
                  {adminMessage.text && (
                    <div className={`p-4 rounded-xl text-xs font-semibold mb-5 ${
                      adminMessage.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
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
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/30 hover:border-slate-350 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition duration-150"
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
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/30 hover:border-slate-350 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition duration-150"
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
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/30 hover:border-slate-350 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition duration-150"
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
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/30 hover:border-slate-350 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition duration-150"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Rôle affecté</label>
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition duration-150 cursor-pointer"
                        >
                          <option value="Fonctionnaire">Fonctionnaire</option>
                          <option value="Association">Association</option>
                          <option value="Administrateur">Administrateur</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Structure de rattachement</label>
                        <select
                          value={newEntrepriseId}
                          onChange={(e) => setNewEntrepriseId(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition duration-150 cursor-pointer"
                        >
                          {entreprises.map(e => (
                            <option key={e.id} value={e.id.toString()}>{e.nom}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 active:scale-[0.99] transition duration-150 shadow-sm cursor-pointer"
                      >
                        Créer le compte utilisateur
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-1 min-h-0 divide-x divide-slate-200" dir="rtl">
            <div className="w-80 lg:w-96 bg-white flex-shrink-0">
              <MailList />
            </div>
            
            <div className="flex-1 bg-slate-50">
              {selectedMessage ? (
                <div className="flex flex-col h-full bg-white animate-fade-in text-right">
                  {/* Header principal - Objet et participants */}
                  <div className="px-6 py-5 border-b border-slate-200 bg-white">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">

                        {/* Group header */}
                        {selectedMessage.estGroupe ? (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 border border-violet-200">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                مجموعة
                              </span>
                            </div>
                            <h2 className="text-xl font-semibold text-slate-800 truncate mb-1">
                              {selectedMessage.titreGroupe || selectedMessage.objet}
                            </h2>
                            {/* Participant summary */}
                            {(() => {
                              const all = selectedMessage.tousLesParticipants || selectedMessage.destinataires || [];
                              const maxShow = 3;
                              const shown = all.slice(0, maxShow).map(p => p.nomComplet).join(', ');
                              const remaining = all.length - maxShow;
                              return (
                                <p className="text-xs text-slate-500">
                                  <span className="font-medium text-slate-600">المشاركون:</span>{' '}
                                  {shown}{remaining > 0 && ` +${remaining} آخر`}
                                </p>
                              );
                            })()}
                          </>
                        ) : (
                          /* Individual thread header */
                          <>
                            <h2 className="text-xl font-semibold text-slate-800 truncate mb-2">{selectedMessage.objet}</h2>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <span className="font-medium">من:</span>
                              <span className="text-slate-700">
                                {selectedMessage.messages?.[0]?.expediteurNomComplet || 'Inconnu'}
                                <span className="text-xs font-mono text-slate-500 ml-1">({selectedMessage.messages?.[0]?.expediteurRole || ''})</span>
                              </span>
                              <span className="text-slate-400">إلى</span>
                              <span className="text-slate-700">
                                {selectedMessage.destinataires?.map(d => d.nomComplet).join(', ') || 'Destinataires'}
                              </span>
                            </div>
                          </>
                        )}

                      </div>
                      <button
                        onClick={() => toggleArchiveMessage(selectedMessage.threadId)}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 shadow-sm transition flex items-center gap-2 flex-shrink-0"
                      >
                        {selectedMessage.estArchive ? "إلغاء الأرشفة" : "أرشفة المحادثة"}
                      </button>
                    </div>
                  </div>

                  {/* Fil de discussion - Style Outlook */}
                  <div className="flex-1 overflow-y-auto bg-white">
                    {selectedMessage.messages?.map((msg, index) => {
                      const isOwnMessage = msg.expediteurId === user?.id;
                      const initials = msg.expediteurNomComplet
                        ?.split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || '??';
                      
                      return (
                        <div 
                          key={msg.messageId} 
                          className={`border-b border-slate-200 ${index === 0 ? 'border-t' : ''}`}
                        >
                          <div className="px-6 py-4">
                            {/* En-tête du message */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                {/* Avatar/Initiales */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold uppercase font-mono ${
                                  isOwnMessage 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {isOwnMessage ? user?.prenom?.charAt(0) + user?.nom?.charAt(0) : initials}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-900 text-sm">
                                      {isOwnMessage ? "أنا" : msg.expediteurNomComplet}
                                    </span>
                                    {/* Badge rôle */}
                                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                                      msg.expediteurRole === 'Administrateur' 
                                        ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                                        : msg.expediteurRole === 'Fonctionnaire'
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}>
                                      {msg.expediteurRole}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs text-slate-500 font-mono" dir="ltr">
                                {new Date(msg.dateEnvoi).toLocaleString('ar-MA', { 
                                  day: '2-digit', 
                                  month: '2-digit', 
                                  year: 'numeric',
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                            {/* Corps du message - Support HTML */}
                            <div className="pr-11">
                              <div 
                                className="text-slate-700 text-sm leading-relaxed prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: msg.corps }}
                              />

                              {/* Pièces jointes */}
                              {msg.piecesJointes && msg.piecesJointes.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    المرفقات ({msg.piecesJointes.length})
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {msg.piecesJointes.map((file) => {
                                      const sizeKb = (file.tailleOctets / 1024).toFixed(1);
                                      const sizeMb = (file.tailleOctets / (1024 * 1024)).toFixed(2);
                                      const displaySize = file.tailleOctets >= 1024 * 1024
                                        ? `${sizeMb} Mo`
                                        : `${sizeKb} Ko`;

                                      const handleDownload = async (e) => {
                                        e.preventDefault();
                                        try {
                                          // FIX 1-A: Use the centralized api service instead of a hardcoded
                                          // localhost URL. This picks up the correct base URL in every
                                          // environment and automatically attaches the JWT Bearer token.
                                          const response = await api.get(
                                            `/messages/attachments/download/${file.id}`,
                                            { responseType: 'blob' }
                                          );
                                          const blob = response.data;
                                          const url = URL.createObjectURL(blob);
                                          const a = document.createElement('a');
                                          a.href = url;
                                          a.download = file.nomFichier;
                                          document.body.appendChild(a);
                                          a.click();
                                          a.remove();
                                          URL.revokeObjectURL(url);
                                        } catch {
                                          alert('تعذّر تنزيل الملف.');
                                        }
                                      };

                                      return (
                                        <button
                                          key={file.id}
                                          type="button"
                                          onClick={handleDownload}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition duration-150 group cursor-pointer"
                                          title={`تنزيل ${file.nomFichier}`}
                                        >
                                          <span className="text-slate-400 group-hover:text-blue-500 transition">📎</span>
                                          <span className="max-w-[180px] truncate">{file.nomFichier}</span>
                                          <span className="text-slate-400 text-[10px] font-mono">{displaySize}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Zone de réponse - Mini éditeur de mail */}
                  <div className="p-4 border-t border-slate-200 bg-slate-50">
                    <form onSubmit={handleReplySubmit} className="space-y-3">
                      {/* Éditeur de texte riche */}
                      <TiptapEditor 
                        content={replyBody} 
                        onChange={setReplyBody} 
                        placeholder="اكتب ردك هنا..."
                      />
                      {/* Bouton d'envoi */}
                      <div className="flex justify-start">
                        <button 
                          type="submit" 
                          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
                        >
                          <Send size={16} />
                          الرد على المحادثة
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <p className="text-sm font-medium">اختر محادثة لعرض سلسلة الرسائل.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isComposeOpen && <ComposeModal onClose={() => setIsComposeOpen(false)} />}
    </div>
  );
}