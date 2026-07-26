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
import Groups from './Groups';
import { Send } from 'lucide-react';

// ── Role → Arabic label helper (used in message thread view) ─────────────────
const getRoleArabicLabel = (role) => {
  if (!role) return '';
  const lower = role.toString().toLowerCase();
  if (lower === 'fonctionnaire') return 'موظف';
  if (lower === 'association')   return 'جمعية';
  if (lower === 'admin' || lower === 'administrateur') return 'مدير النظام';
  return role;
};

// ── Role → French label helper (used in admin header badge) ──────────────────
const getRoleFrenchLabel = (role) => {
  if (!role) return '';
  const lower = role.toString().toLowerCase();
  if (lower === 'fonctionnaire') return 'Fonctionnaire';
  if (lower === 'association')   return 'Association';
  if (lower === 'admin' || lower === 'administrateur') return 'Administrateur';
  return role;
};

export default function Dashboard() {
  const { user, adminCreateUser } = useAuth();
  const { addLog } = useLogs();
  const { 
    searchQuery, 
    setSearchQuery, 
    selectedMessage, 
    replyToThread, 
    toggleArchiveMessage,
    activeFolder
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
  const [recentLogs, setRecentLogs] = useState(null); // null = loading, [] = empty

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

  const fetchRecentLogs = async () => {
    try {
      const response = await api.get('/admin/audit-logs');
      const all = response.data || [];
      // Show the 5 most recent entries
      setRecentLogs(all.slice(0, 5));
    } catch (err) {
      console.error("Erreur lors de la récupération des activités récentes :", err);
      setRecentLogs([]);
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
      fetchRecentLogs();
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

  const isAdmin = user?.role === 'Administrateur';
  const layoutDir = isAdmin ? 'ltr' : 'rtl';

  if (isProfileOpen) {
    return (
      <div dir={layoutDir} className="flex h-screen w-full bg-gradient-to-br from-slate-50 via-slate-100/50 to-slate-50 overflow-hidden font-sans text-slate-800">
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
    <div dir={layoutDir} className="flex h-screen w-full bg-gradient-to-br from-slate-50 via-slate-100/50 to-slate-50 overflow-hidden font-sans text-slate-800">
      
      <Sidebar 
        onComposeOpen={() => setIsComposeOpen(true)} 
        isAdminView={isAdminView}
        setIsAdminView={(val) => { setIsAdminView(val); setAdminMessage({ type: '', text: '' }); }}
        adminTab={adminTab}
        setAdminTab={setAdminTab}
      />

      <div className="flex flex-col flex-1 min-w-0">
        
        {/* En-tête épuré avec barre de recherche et profil utilisateur */}
        <header dir="ltr" className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 md:px-6 shadow-sm flex-shrink-0">
          <div className="flex-1 max-w-xs md:max-w-sm">
            {!isAdminView && (
              <input
                type="text"
                placeholder="البحث عن رسالة أو موضوع..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-slate-100 border border-transparent rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
            )}
          </div>
          
          <div className="flex items-center">
            {/* Zone profil cliquable avec avatar */}
            <div 
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-transparent hover:border-slate-200/80 transition-all duration-150 group"
              title="عرض معلوماتي الشخصية"
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition">
                  {user ? `${user.prenom} ${user.nom}` : ''}
                </p>
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  user?.role === 'Administrateur' || user?.role?.toLowerCase() === 'admin'
                    ? 'bg-blue-50 text-blue-700 border-blue-200/60'
                    : user?.role === 'Association'
                    ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    user?.role === 'Administrateur' || user?.role?.toLowerCase() === 'admin' ? 'bg-blue-500' :
                    user?.role === 'Association' ? 'bg-amber-500' : 'bg-slate-400'
                  }`} />
                  {/* Show French label in Admin interface, Arabic otherwise */}
                  {isAdmin ? getRoleFrenchLabel(user?.role) : getRoleArabicLabel(user?.role)}
                </span>
              </div>

              {/* Avatar de profil circulaire */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white font-semibold text-sm flex items-center justify-center border border-slate-700/50 shadow-md shadow-slate-900/20 group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:border-blue-400/50 transition-all duration-200 uppercase font-mono">
                {user?.prenom ? user.prenom.charAt(0) : 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Contenu alternatif (Gestion Admin ou Messagerie) */}
        {isAdminView ? (
          <div dir="ltr" className="flex-1 bg-gradient-to-br from-slate-50 via-slate-100/40 to-slate-50 p-8 overflow-y-auto flex flex-col items-center text-left">
            {adminTab === 'stats' ? (
              <div className="w-full max-w-4xl space-y-8 animate-fade-in">
                {/* En-tête du tableau de bord */}
                <div className="border-b border-slate-200/80 pb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
                    <h2 className="text-lg font-bold tracking-tight text-slate-900">Tableau de bord administratif</h2>
                  </div>
                  <p className="text-slate-500 text-xs mt-1 ml-3">Données analytiques et statistiques globales d'activité sur le serveur de messagerie.</p>
                </div>

                {/* Grille des indicateurs de statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Carte : Utilisateurs */}
                  <div className="bg-white/90 backdrop-blur-md rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                    <div className="p-5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Comptes Utilisateurs</p>
                      <p className="text-3xl font-bold tracking-tight text-slate-900 mt-2 tabular-nums">{stats.totalUsers}</p>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">Profils enregistrés et habilités sur le réseau interne.</p>
                    </div>
                  </div>

                  {/* Carte : Discussions */}
                  <div className="bg-white/90 backdrop-blur-md rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-purple-500" />
                    <div className="p-5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Discussions Initiées</p>
                      <p className="text-3xl font-bold tracking-tight text-slate-900 mt-2 tabular-nums">{stats.totalThreads}</p>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">Fils de discussion distincts créés par les utilisateurs.</p>
                    </div>
                  </div>

                  {/* Carte : Messages */}
                  <div className="bg-white/90 backdrop-blur-md rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                    <div className="p-5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Messages Acheminés</p>
                      <p className="text-3xl font-bold tracking-tight text-slate-900 mt-2 tabular-nums">{stats.totalMessagesSent}</p>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">Volume total de messages transmis de bout en bout.</p>
                    </div>
                  </div>
                </div>

                {/* Tableau de suivi des discussions */}
                <div className="bg-white/90 backdrop-blur-md rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
                  <div className="space-y-4 p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-slate-900">Suivi des Discussions / Échanges</h3>
                      <p className="text-slate-500 text-[11px] mt-0.5">Dernières conversations surveillées sur la plateforme (Juillet 2026).</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Rechercher sujet, expéditeur..."
                        value={threadSearch}
                        onChange={(e) => setThreadSearch(e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 w-48 md:w-56 transition"
                      />
                      <select
                        value={threadStatusFilter}
                        onChange={(e) => setThreadStatusFilter(e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white cursor-pointer w-32 focus:border-blue-500 transition"
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
                          <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 uppercase font-bold tracking-widest text-[10px]">
                            <th className="px-4 py-3">Sujet / Objet</th>
                            <th className="px-4 py-3">Expéditeur</th>
                            <th className="px-4 py-3">Destinataire</th>
                            <th className="px-4 py-3 text-center">Pièce Jointe</th>
                            <th className="px-4 py-3 text-center">Lecture</th>
                            <th className="px-4 py-3 text-center">Acheminement</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                          {filteredThreads.map((t, idx) => (
                            <tr key={t.id} className={`hover:bg-blue-50/30 transition-colors duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                              <td className="px-4 py-3.5 font-semibold text-slate-800 max-w-xs truncate" title={t.objet}>
                                {t.objet}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="font-medium text-slate-800">{t.expediteur}</div>
                                <div className="text-[10px] text-slate-400 font-mono" dir="ltr">{t.expediteurEmail}</div>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="font-medium text-slate-800">{t.destinataire}</div>
                                <div className="text-[10px] text-slate-400 font-mono" dir="ltr">{t.destinataireEmail}</div>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                {t.hasAttachment ? (
                                  <span className="inline-flex items-center text-slate-500">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.586 6.586a6 6 0 108.486 8.486L20 13" /></svg>
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                  t.statutLecture === 'Lu' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${t.statutLecture === 'Lu' ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
                                  {t.statutLecture}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wider font-mono ${
                                  t.statutAcheminement === 'En cours'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${t.statutAcheminement === 'En cours' ? 'bg-blue-400' : 'bg-slate-400'}`} />
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
                </div>

                {/* ── Dernières Activités Systèmes ── */}
                <div className="bg-white/90 backdrop-blur-md rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  <div className="h-0.5 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500" />
                  <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dernières Activités Systèmes</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Aperçu des 5 dernières entrées du journal d'audit.</p>
                    </div>
                    <button
                      onClick={() => setAdminTab('audit-logs')}
                      className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 hover:underline transition cursor-pointer flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Journal d'audit
                    </button>
                  </div>

                  {/* Loading skeleton */}
                  {recentLogs === null ? (
                    <div className="p-8 flex items-center justify-center gap-3 text-slate-400">
                      <svg className="animate-spin h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-xs font-medium">Chargement des activités...</span>
                    </div>

                  ) : recentLogs.length === 0 ? (
                    /* Empty state */
                    <div className="p-10 flex flex-col items-center justify-center text-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-600">Aucune activité enregistrée</p>
                        <p className="text-xs text-slate-400 mt-0.5">Les événements système apparaîtront ici dès qu'ils seront produits.</p>
                      </div>
                      <button
                        onClick={() => setAdminTab('audit-logs')}
                        className="mt-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition cursor-pointer"
                      >
                        Ouvrir le Journal d'audit →
                      </button>
                    </div>

                  ) : (
                    /* Activity table */
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 uppercase font-bold tracking-widest text-[10px]">
                            <th className="px-4 py-3 w-44">Date / Heure</th>
                            <th className="px-4 py-3 w-44">Action</th>
                            <th className="px-4 py-3">Acteur</th>
                            <th className="px-4 py-3">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                          {recentLogs.map((log, idx) => {
                            // Resolve badge colour + French label for each action type
                            const actionMeta = {
                              CREATE_USER:        { label: 'Création',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
                              SEND_MESSAGE:       { label: 'Envoi',       cls: 'bg-blue-50    text-blue-700    border-blue-200',    dot: 'bg-blue-500'    },
                              LOGIN:              { label: 'Connexion',   cls: 'bg-indigo-50  text-indigo-700  border-indigo-200',  dot: 'bg-indigo-500'  },
                              TOGGLE_USER_STATUS: { label: 'Statut',      cls: 'bg-amber-50   text-amber-700   border-amber-200',   dot: 'bg-amber-500'   },
                              DELETE_USER:        { label: 'Suppression', cls: 'bg-rose-50    text-rose-700    border-rose-200',    dot: 'bg-rose-500'    },
                              UPLOAD_ATTACHMENT:  { label: 'Pièce jointe',cls: 'bg-teal-50    text-teal-700    border-teal-200',    dot: 'bg-teal-500'    },
                              ARCHIVE_DISCUSSION: { label: 'Archivage',   cls: 'bg-slate-100  text-slate-600   border-slate-300',   dot: 'bg-slate-400'   },
                            };
                            const meta = actionMeta[log.typeAction] || { label: log.typeAction, cls: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' };

                            const ts = (() => {
                              try {
                                return new Date(log.dateHeure).toLocaleString('fr-FR', {
                                  day: '2-digit', month: '2-digit', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                });
                              } catch { return log.dateHeure; }
                            })();

                            return (
                              <tr key={log.id} className={`hover:bg-blue-50/30 transition-colors duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                                <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">{ts}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider font-mono ${meta.cls}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                                    {meta.label}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{log.utilisateur}</td>
                                <td className="px-4 py-3 text-slate-500 leading-relaxed max-w-xs truncate" title={log.description}>{log.description}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : adminTab === 'manage-users' ? (
              <ManageUsers />
            ) : adminTab === 'audit-logs' ? (
              <ManageLogs />
            ) : (
              <div className="w-full max-w-xl bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden animate-fade-in">
                {/* Accent top bar */}
                <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
                {/* En-tête de la fiche de création */}
                <div className="px-6 py-5 bg-slate-50/60 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
                    <h2 className="text-base font-bold tracking-tight text-slate-900">Enregistrer un nouvel utilisateur</h2>
                  </div>
                  <p className="text-slate-500 text-xs mt-1 ml-3">Le compte créé sera actif et recevra automatiquement ses accès sécurisés.</p>
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Rôle affecté</label>
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition duration-150 cursor-pointer"
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
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition duration-150 cursor-pointer"
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
                        className="w-full py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl text-sm font-semibold hover:from-slate-700 hover:to-slate-800 active:scale-[0.98] transition-all duration-150 shadow-md shadow-slate-900/20 cursor-pointer focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 outline-none"
                      >
                        Créer le compte utilisateur
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : activeFolder === 'groups' ? (
          <Groups />
        ) : (
          <div className="flex flex-1 min-h-0 overflow-hidden" dir="rtl">
            {/* ── Mail List column ── */}
            <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col border-l border-slate-200/80 ${
              selectedMessage ? 'hidden md:flex' : 'flex'
            }`}>
              <MailList />
            </div>

            {/* ── Thread detail / empty state ── */}
            <div className="flex-1 min-w-0 bg-gradient-to-br from-slate-50 via-slate-100/30 to-slate-50">
              {selectedMessage ? (
                <div className="flex flex-col h-full min-w-0 animate-fade-in text-right">

                  {/* ── Thread Header ── */}
                  <div className="px-6 py-4 border-b border-slate-200/80 bg-white/90 backdrop-blur-md flex-shrink-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">

                        {/* Group thread header */}
                        {selectedMessage.estGroupe ? (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 border border-violet-200/80">
                                مجموعة
                              </span>
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 truncate mb-1">
                              {selectedMessage.titreGroupe || selectedMessage.objet}
                            </h2>
                            {(() => {
                              const all = selectedMessage.tousLesParticipants || selectedMessage.destinataires || [];
                              const maxShow = 3;
                              const shown = all.slice(0, maxShow).map(p => p.nomComplet).join(', ');
                              const remaining = all.length - maxShow;
                              return (
                                <p className="text-xs text-slate-500">
                                  <span className="font-semibold text-slate-600">المشاركون:</span>{' '}
                                  {shown}{remaining > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-500 font-mono">+{remaining}</span>
                                  )}
                                </p>
                              );
                            })()}
                          </>
                        ) : (
                          /* Individual thread header */
                          <>
                            <h2 className="text-lg font-bold text-slate-900 truncate mb-1.5">{selectedMessage.objet}</h2>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                              <span className="font-semibold text-slate-500">من:</span>
                              <span className="font-medium text-slate-800">
                                {selectedMessage.messages?.[0]?.expediteurNomComplet || 'Inconnu'}
                              </span>
                              {/* Sender role badge */}
                              {selectedMessage.messages?.[0]?.expediteurRole && (() => {
                                const role = selectedMessage.messages[0].expediteurRole;
                                const cls = role === 'Administrateur'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200/60'
                                  : role === 'Association'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200/60'
                                  : 'bg-slate-100 text-slate-700 border-slate-200';
                                const dot = role === 'Administrateur' ? 'bg-blue-500' : role === 'Association' ? 'bg-amber-500' : 'bg-slate-400';
                                return (
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                                    {getRoleArabicLabel(role)}
                                  </span>
                                );
                              })()}
                              <span className="text-slate-300">•</span>
                              <span className="font-semibold text-slate-500">إلى:</span>
                              <span className="font-medium text-slate-800 truncate">
                                {selectedMessage.destinataires?.map(d => d.nomComplet).join(', ') || 'Destinataires'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Archive action button */}
                      <button
                        onClick={() => toggleArchiveMessage(selectedMessage.threadId)}
                        className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white/90 border border-slate-200/80 rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-sm active:scale-95 transition-all duration-150 flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        {selectedMessage.estArchive ? "إلغاء الأرشفة" : "أرشفة"}
                      </button>
                    </div>
                  </div>

                  {/* ── Message thread (bubble-style) ── */}
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    {selectedMessage.messages?.map((msg, index) => {
                      const isOwnMessage = msg.expediteurId === user?.id;
                      const initials = msg.expediteurNomComplet
                        ?.split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || '??';

                      const roleClass = msg.expediteurRole === 'Administrateur'
                        ? 'bg-blue-50 text-blue-800 border-blue-200/60'
                        : msg.expediteurRole === 'Association'
                        ? 'bg-amber-50 text-amber-800 border-amber-200/60'
                        : 'bg-slate-100 text-slate-700 border-slate-200';
                      const roleDot = msg.expediteurRole === 'Administrateur' ? 'bg-blue-500'
                        : msg.expediteurRole === 'Association' ? 'bg-amber-500' : 'bg-slate-400';

                      return (
                        <div
                          key={msg.messageId}
                          className={`flex flex-col ${ isOwnMessage ? 'items-end' : 'items-start' }`}
                        >
                          {/* Sender meta row */}
                          <div className={`flex items-center gap-2 mb-1.5 ${ isOwnMessage ? 'flex-row-reverse' : 'flex-row' }`}>
                            {/* Avatar */}
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold uppercase shadow-sm flex-shrink-0 ${
                              isOwnMessage
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              {isOwnMessage
                                ? (user?.prenom?.charAt(0) ?? '') + (user?.nom?.charAt(0) ?? '')
                                : initials}
                            </div>
                            <span className="font-semibold text-slate-800 text-xs">
                              {isOwnMessage ? 'أنا' : msg.expediteurNomComplet}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleClass}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${roleDot}`} />
                              {getRoleArabicLabel(msg.expediteurRole)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                              {new Date(msg.dateEnvoi).toLocaleString('ar-MA', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {/* Bubble card */}
                          <div className={`
                            max-w-[85%] rounded-2xl shadow-sm border px-4 py-3
                            ${ isOwnMessage
                              ? 'bg-white/95 border-blue-100 rounded-tr-sm'
                              : 'bg-white/90 backdrop-blur-sm border-slate-100/80 rounded-tl-sm'
                            }
                          `}>
                            <div
                              className="text-slate-700 text-sm leading-relaxed prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: msg.corps }}
                            />

                            {/* Attachments */}
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
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 active:scale-95 transition-all duration-150 group cursor-pointer"
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
                      );
                    })}
                  </div>

                  {/* ── Reply box ── */}
                  <div className="px-4 py-3 border-t border-slate-200/80 bg-white/90 backdrop-blur-md flex-shrink-0">
                    <form onSubmit={handleReplySubmit} className="space-y-2.5">
                      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all duration-150">
                        <TiptapEditor
                          content={replyBody}
                          onChange={setReplyBody}
                          placeholder="اكتب ردك هنا..."
                        />
                      </div>
                      <div className="flex justify-start">
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-slate-900/20 active:scale-95 transition-all duration-150 flex items-center gap-2 cursor-pointer"
                        >
                          <Send size={15} />
                          الرد على المحادثة
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                /* Empty state */
                <div className="hidden md:flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                  <div className="w-16 h-16 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm flex items-center justify-center">
                    <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m13-4l-5 5-5-5" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-500">اختر محادثة لعرض سلسلة الرسائل.</p>
                  <p className="text-xs text-slate-400">حدد محادثة من القائمة لفتحها هنا.</p>
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