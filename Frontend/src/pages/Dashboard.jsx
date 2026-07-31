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
import ManageInstitutions from '../components/ManageInstitutions';
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
  const [newInstitutionId, setNewInstitutionId] = useState('1'); // Par défaut 1 (CSPJ Conseil)
  const [adminMessage, setAdminMessage] = useState({ type: '', text: '' });

  // Suivi des discussions (Mock Data)
  const [threadSearch, setThreadSearch] = useState('');
  const [threadStatusFilter, setThreadStatusFilter] = useState('ALL');

  // Statistiques Administrateur
  const [stats, setStats] = useState({ totalUsers: 0, totalThreads: 0, totalMessagesSent: 0 });
  const [threads, setThreads] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [recentLogs, setRecentLogs] = useState(null); // null = loading, [] = empty

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
      fetchInstitutions();
      fetchRecentLogs();
    }
  }, [isAdminView, user]);

  // Re-fetch institutions every time the admin switches to the "create-user" tab,
  // so the dropdown always reflects any institutions added from the Institutions tab
  // without needing a manual page reload.
  useEffect(() => {
    if (adminTab === 'create-user' && isAdminView) {
      fetchInstitutions();
    }
  }, [adminTab]);

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
      setNewInstitutionId('1');

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
      <div dir={layoutDir} className="flex h-screen w-full bg-[#f8fafc] overflow-hidden font-sans text-slate-800">
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
    <div dir={layoutDir} className="flex h-screen w-full bg-[#f8fafc] overflow-hidden font-sans text-slate-800">
      
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
              <div className="relative flex items-center w-full">
                <input
                  type="text"
                  placeholder="البحث عن رسالة أو موضوع..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
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
          <div dir="ltr" className="flex-1 bg-[#f8fafc] p-8 overflow-y-auto flex flex-col items-center text-left">
            {adminTab === 'stats' ? (
              <div className="w-full max-w-5xl space-y-8 animate-fade-in">

                {/* ── Hero greeting header ── */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Tableau de bord</h2>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Système Actif
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm">Données analytiques et statistiques globales d'activité sur le serveur de messagerie.</p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-white border border-slate-200/60 rounded-xl px-3 py-2 shadow-sm">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>

                {/* ── Stat cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Card: Users */}
                  <div className="group bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_0_rgb(0_0_0/_0.04),_0_1px_2px_-1px_rgb(0_0_0/_0.04)] hover:shadow-[0_8px_24px_-4px_rgb(59_130_246/_0.15)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                    <div className="h-px w-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:bg-blue-500 group-hover:border-blue-500 group-hover:shadow-md group-hover:shadow-blue-500/25 transition-all duration-300">
                          <svg className="w-4.5 h-4.5 text-blue-500 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Comptes Utilisateurs</p>
                      <p className="text-3xl font-bold tracking-tight text-slate-900 mt-1.5 tabular-nums">{stats.totalUsers}</p>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">Profils enregistrés et habilités sur le réseau interne.</p>
                    </div>
                  </div>

                  {/* Card: Discussions */}
                  <div className="group bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_0_rgb(0_0_0/_0.04),_0_1px_2px_-1px_rgb(0_0_0/_0.04)] hover:shadow-[0_8px_24px_-4px_rgb(139_92_246/_0.15)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                    <div className="h-px w-full bg-gradient-to-r from-violet-500 to-purple-500" />
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center group-hover:bg-violet-500 group-hover:border-violet-500 group-hover:shadow-md group-hover:shadow-violet-500/25 transition-all duration-300">
                          <svg className="w-4.5 h-4.5 text-violet-500 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Discussions Initiées</p>
                      <p className="text-3xl font-bold tracking-tight text-slate-900 mt-1.5 tabular-nums">{stats.totalThreads}</p>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">Fils de discussion distincts créés par les utilisateurs.</p>
                    </div>
                  </div>

                  {/* Card: Messages */}
                  <div className="group bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_0_rgb(0_0_0/_0.04),_0_1px_2px_-1px_rgb(0_0_0/_0.04)] hover:shadow-[0_8px_24px_-4px_rgb(16_185_129/_0.15)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                    <div className="h-px w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-500 group-hover:shadow-md group-hover:shadow-emerald-500/25 transition-all duration-300">
                          <svg className="w-4.5 h-4.5 text-emerald-500 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Messages Acheminés</p>
                      <p className="text-3xl font-bold tracking-tight text-slate-900 mt-1.5 tabular-nums">{stats.totalMessagesSent}</p>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">Volume total de messages transmis de bout en bout.</p>
                    </div>
                  </div>
                </div>

                {/* ── Threads surveillance table ── */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_0_rgb(0_0_0/_0.04),_0_4px_6px_-2px_rgb(0_0_0/_0.04)] hover:shadow-[0_4px_12px_-2px_rgb(0_0_0/_0.08)] transition-shadow duration-300 overflow-hidden">
                  <div className="h-px w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
                  <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-slate-900">Suivi des Discussions / Échanges</h3>
                      <p className="text-slate-500 text-[11px] mt-0.5">Dernières conversations surveillées sur la plateforme.</p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Rechercher sujet, expéditeur..."
                        value={threadSearch}
                        onChange={(e) => setThreadSearch(e.target.value)}
                        className="px-3 py-1.5 border border-slate-200/60 rounded-xl text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 w-48 md:w-56 transition bg-white"
                      />
                      <select
                        value={threadStatusFilter}
                        onChange={(e) => setThreadStatusFilter(e.target.value)}
                        className="px-3 py-1.5 border border-slate-200/60 rounded-xl text-xs outline-none bg-white cursor-pointer w-36 focus:border-blue-400 transition"
                      >
                        <option value="ALL">Tous les statuts</option>
                        <option value="EN_COURS">En cours</option>
                        <option value="CLOTURE">Clôturés</option>
                      </select>
                    </div>
                  </div>

                  {filteredThreads.length === 0 ? (
                    <div className="py-12 flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center">
                        <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-slate-400 text-xs">Aucune discussion ne correspond aux critères de recherche.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-100/80 text-slate-400 uppercase font-bold tracking-widest text-[10px]">
                            <th className="px-5 py-3.5">Sujet / Objet</th>
                            <th className="px-5 py-3.5">Expéditeur</th>
                            <th className="px-5 py-3.5">Destinataire</th>
                            <th className="px-5 py-3.5 text-center">Pièce Jointe</th>
                            <th className="px-5 py-3.5 text-center">Lecture</th>
                            <th className="px-5 py-3.5 text-center">Acheminement</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/80 text-slate-600">
                          {filteredThreads.map((t, idx) => (
                            <tr key={t.id} className="hover:bg-blue-50/25 transition-colors duration-150">
                              <td className="px-5 py-4 font-semibold text-slate-800 max-w-xs truncate" title={t.objet}>
                                {t.objet}
                              </td>
                              <td className="px-5 py-4">
                                <div className="font-medium text-slate-800">{t.expediteur}</div>
                                <div className="text-[10px] text-slate-400 font-mono" dir="ltr">{t.expediteurEmail}</div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="font-medium text-slate-800">{t.destinataire}</div>
                                <div className="text-[10px] text-slate-400 font-mono" dir="ltr">{t.destinataireEmail}</div>
                              </td>
                              <td className="px-5 py-4 text-center">
                                {t.hasAttachment ? (
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-500">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.586 6.586a6 6 0 108.486 8.486L20 13" /></svg>
                                  </span>
                                ) : <span className="text-slate-300">—</span>}
                              </td>
                              <td className="px-5 py-4 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold rounded-full border ${
                                  t.statutLecture === 'Lu' 
                                    ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/80' 
                                    : 'bg-indigo-50/80 text-indigo-700 border-indigo-200/80'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${t.statutLecture === 'Lu' ? 'bg-emerald-400' : 'bg-indigo-400 animate-pulse'}`} />
                                  {t.statutLecture}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold rounded-full border ${
                                  t.statutAcheminement === 'En cours'
                                    ? 'bg-blue-50/80 text-blue-700 border-blue-200/80'
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

                {/* ── Dernières Activités Systèmes ── */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_0_rgb(0_0_0/_0.04),_0_4px_6px_-2px_rgb(0_0_0/_0.04)] hover:shadow-[0_4px_12px_-2px_rgb(0_0_0/_0.08)] transition-shadow duration-300 overflow-hidden">
                  <div className="h-px w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500" />
                  <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-slate-900">Dernières Activités Système</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Aperçu des 5 dernières entrées du journal d'audit.</p>
                    </div>
                    <button
                      onClick={() => setAdminTab('audit-logs')}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-all duration-150 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Voir tout le journal
                    </button>
                  </div>

                  {/* Loading skeleton */}
                  {recentLogs === null ? (
                    <div className="p-10 flex items-center justify-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin" />
                      <span className="text-xs font-medium text-slate-400">Chargement des activités...</span>
                    </div>

                  ) : recentLogs.length === 0 ? (
                    /* Empty state */
                    <div className="p-12 flex flex-col items-center justify-center text-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center">
                        <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    /* Activity event feed */
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-100/80 text-slate-400 uppercase font-bold tracking-widest text-[10px]">
                            <th className="px-5 py-3.5 w-44">Date / Heure</th>
                            <th className="px-5 py-3.5 w-36">Action</th>
                            <th className="px-5 py-3.5">Acteur</th>
                            <th className="px-5 py-3.5">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/80 text-slate-600">
                          {recentLogs.map((log, idx) => {
                            // Resolve badge colour + French label for each action type
                            const actionMeta = {
                              CREATE_USER:        { label: 'Création',     cls: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' },
                              SEND_MESSAGE:       { label: 'Envoi',        cls: 'bg-blue-50/80 text-blue-700 border-blue-200/80',         dot: 'bg-blue-500'    },
                              LOGIN:              { label: 'Connexion',    cls: 'bg-indigo-50/80 text-indigo-700 border-indigo-200/80',   dot: 'bg-indigo-500'  },
                              TOGGLE_USER_STATUS: { label: 'Statut',       cls: 'bg-amber-50/80 text-amber-700 border-amber-200/80',      dot: 'bg-amber-500'   },
                              DELETE_USER:        { label: 'Suppression',  cls: 'bg-rose-50/80 text-rose-700 border-rose-200/80',         dot: 'bg-rose-500'    },
                              UPLOAD_ATTACHMENT:  { label: 'Pièce jointe',cls: 'bg-teal-50/80 text-teal-700 border-teal-200/80',         dot: 'bg-teal-500'    },
                              ARCHIVE_DISCUSSION: { label: 'Archivage',    cls: 'bg-slate-100 text-slate-600 border-slate-200',           dot: 'bg-slate-400'   },
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
                              <tr key={log.id} className="hover:bg-violet-50/20 transition-colors duration-150">
                                <td className="px-5 py-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">{ts}</td>
                                <td className="px-5 py-4">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold border ${meta.cls}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 shadow-sm ${meta.dot}`} />
                                    {meta.label}
                                  </span>
                                </td>
                                <td className="px-5 py-4 font-medium text-slate-700 whitespace-nowrap font-mono text-[11px]">{log.utilisateur}</td>
                                <td className="px-5 py-4 text-slate-500 leading-relaxed max-w-xs truncate" title={log.description}>{log.description}</td>
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
            ) : adminTab === 'institutions' ? (
              <ManageInstitutions />
            ) : adminTab === 'audit-logs' ? (
              <ManageLogs />
            ) : (
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

                  {/* ── Message thread (document-style) ── */}
                  <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-slate-50/50">
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
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200/60';
                      const roleDot = msg.expediteurRole === 'Administrateur' ? 'bg-blue-500'
                        : msg.expediteurRole === 'Association' ? 'bg-amber-500' : 'bg-indigo-400';

                      return (
                        <div
                          key={msg.messageId}
                          className="w-full bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 hover:shadow-md transition-shadow duration-300"
                        >
                          {/* Sender meta row */}
                          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                              {/* Avatar */}
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold uppercase shadow-sm flex-shrink-0 ${
                                isOwnMessage
                                  ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200/60'
                              }`}>
                                {isOwnMessage
                                  ? (user?.prenom?.charAt(0) ?? '') + (user?.nom?.charAt(0) ?? '')
                                  : initials}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-sm">
                                    {isOwnMessage ? 'أنا' : msg.expediteurNomComplet}
                                  </span>
                                  {/* Verified / Official Badge */}
                                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${roleClass}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${roleDot}`} />
                                    {getRoleArabicLabel(msg.expediteurRole)}
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-400 font-medium font-mono" dir="ltr">
                                  {new Date(msg.dateEnvoi).toLocaleString('ar-MA', {
                                    day: '2-digit', month: 'short', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                            
                            {/* Official Seal / Marker for specific roles */}
                            {!isOwnMessage && msg.expediteurRole === 'Administrateur' && (
                              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/60 rounded-lg text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                                <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                مراسلة رسمية
                              </div>
                            )}
                          </div>

                          {/* Body content */}
                          <div
                            className="text-slate-700 text-sm leading-relaxed prose prose-slate max-w-none prose-p:my-2 prose-a:text-indigo-600 hover:prose-a:text-indigo-700"
                            dangerouslySetInnerHTML={{ __html: msg.corps }}
                          />

                          {/* Attachments */}
                          {msg.piecesJointes && msg.piecesJointes.length > 0 && (
                            <div className="mt-5 pt-4 border-t border-slate-100/80">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.586 6.586a6 6 0 108.486 8.486L20 13" /></svg>
                                المرفقات ({msg.piecesJointes.length})
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {msg.piecesJointes.map((file) => {
                                  const sizeKb = (file.tailleOctets / 1024).toFixed(1);
                                  const sizeMb = (file.tailleOctets / (1024 * 1024)).toFixed(2);
                                  const displaySize = file.tailleOctets >= 1024 * 1024
                                    ? `${sizeMb} Mo`
                                    : `${sizeKb} Ko`;

                                  const handleDownload = async (e) => {
                                    e.preventDefault();
                                    try {
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
                                      className="flex items-center gap-3 p-3 bg-slate-50/50 hover:bg-white border border-slate-200/80 hover:border-indigo-300 rounded-xl text-right active:scale-95 transition-all duration-200 group cursor-pointer shadow-sm hover:shadow-md hover:shadow-indigo-500/5"
                                      title={`تنزيل ${file.nomFichier}`}
                                    >
                                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-200 flex-shrink-0">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-slate-700 group-hover:text-indigo-700 truncate transition-colors">{file.nomFichier}</p>
                                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{displaySize}</p>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Reply box (Deep Slate / Zinc Action styling) ── */}
                  <div className="px-6 py-4 border-t border-slate-200/80 bg-white/90 backdrop-blur-md flex-shrink-0">
                    <form onSubmit={handleReplySubmit} className="space-y-3">
                      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all duration-150">
                        <TiptapEditor
                          content={replyBody}
                          onChange={setReplyBody}
                          placeholder="اكتب ردك هنا..."
                        />
                      </div>
                      <div className="flex justify-start">
                        <button
                          type="submit"
                          className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-semibold shadow-md shadow-zinc-900/20 active:scale-95 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 cursor-pointer"
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
                <div className="hidden md:flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                  <div className="w-20 h-20 rounded-3xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center text-slate-200">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m13-4l-5 5-5-5" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-600">اختر محادثة لعرض سلسلة الرسائل.</p>
                    <p className="text-xs text-slate-400 mt-1">حدد محادثة من القائمة لفتحها هنا في وضع القراءة.</p>
                  </div>
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