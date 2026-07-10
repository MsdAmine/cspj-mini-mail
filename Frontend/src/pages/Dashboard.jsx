import React, { useState, useEffect } from 'react';
import { useMail } from '../context/MailContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import MailList from '../components/MailList';
import ComposeModal from '../components/ComposeModal';
import ProfilePage from './ProfilePage';

export default function Dashboard() {
  const { user, adminCreateUser } = useAuth();
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

  // Statistiques Administrateur
  const [stats, setStats] = useState({ totalUsers: 0, totalThreads: 0, totalMessagesSent: 0 });

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des statistiques :", err);
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
      await adminCreateUser({
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
      setAdminMessage({ type: 'error', text: err.message });
    }
  };

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    replyToThread(selectedMessage.threadId, replyBody);
    setReplyBody('');
  };

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
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
          <div className="w-96">
            {!isAdminView && (
              <input
                type="text"
                placeholder="Rechercher un message ou un sujet..."
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
              title="Afficher mes informations personnelles"
            >
              <div className="text-right">
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
          <div className="flex-1 bg-slate-50 p-8 overflow-y-auto flex flex-col items-center">
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
                          <option value="1">CSPJ (Conseil)</option>
                          <option value="2">Association des Magistrats</option>
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
          <div className="flex flex-1 min-h-0 divide-x divide-slate-200">
            <div className="w-80 lg:w-96 bg-white flex-shrink-0">
              <MailList />
            </div>
            
            <div className="flex-1 bg-slate-50">
              {selectedMessage ? (
                <div className="flex flex-col h-full bg-white animate-fade-in">
                  <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-800 truncate">{selectedMessage.objet}</h2>
                    <button 
                      onClick={() => toggleArchiveMessage(selectedMessage.threadId)}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm transition"
                    >
                      {selectedMessage.estArchive ? "Désarchiver" : "Archiver la discussion"}
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                    {selectedMessage.messages?.map((msg) => {
                      const isOwnMessage = msg.expediteurId === user?.id;
                      
                      return (
                        <div 
                          key={msg.messageId} 
                          className={`p-5 rounded-xl border shadow-sm max-w-[85%] ${
                            isOwnMessage 
                              ? 'bg-blue-50/50 border-blue-200 ml-auto' 
                              : 'bg-white border-gray-200 mr-auto'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2 gap-4">
                            <div>
                              <span className="font-semibold text-gray-900 text-sm">
                                {isOwnMessage ? "Moi" : msg.expediteurNomComplet}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 block">
                                {msg.expediteurRole}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {new Date(msg.dateEnvoi).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          <p className="text-gray-750 whitespace-pre-line text-sm leading-relaxed">{msg.corps}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 border-t border-gray-200 bg-white">
                    <form onSubmit={handleReplySubmit} className="space-y-3">
                      <textarea
                        rows="3"
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder="Répondre à cette conversation..."
                        className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none outline-none"
                      />
                      <div className="flex justify-end">
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition shadow-sm">
                          Répondre au fil
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <p className="text-sm font-medium">Sélectionnez une discussion pour afficher le fil des messages.</p>
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