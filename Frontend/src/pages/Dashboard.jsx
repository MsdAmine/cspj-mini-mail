import React, { useState } from 'react';
import { useMail } from '../context/MailContext';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import MailList from '../components/MailList';
import ComposeModal from '../components/ComposeModal';
import ProfileModal from '../components/ProfileModal'; 

export default function Dashboard() {
  const { user, registerNewUser } = useAuth();
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
  
  // États pour la création de compte (Admin)
  const [isAdminView, setIsAdminView] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Fonctionnaire'); 
  const [adminMessage, setAdminMessage] = useState({ type: '', text: '' });

  // Fonction utilitaire pour formater joliment les noms d'utilisateurs (ex: admin_general -> Admin General)
  const formatDisplayName = (name) => {
    if (!name) return '';
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleCreateAccount = (e) => {
    e.preventDefault();
    if (!newUsername || !newPassword) {
      setAdminMessage({ type: 'error', text: 'Veuillez remplir l’identifiant et le mot de passe.' });
      return;
    }
    try {
      registerNewUser({
        username: newUsername,
        password: newPassword,
        email: newEmail,
        role: newRole
      });
      setAdminMessage({ type: 'success', text: `Le compte "${formatDisplayName(newUsername)}" a été créé avec succès !` });
      setNewUsername('');
      setNewPassword('');
      setNewEmail('');
      setNewRole('Fonctionnaire'); 
    } catch (err) {
      setAdminMessage({ type: 'error', text: err.message });
    }
  };

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    replyToThread(selectedMessage.id, replyBody);
    setReplyBody('');
  };

  return (
    <div className="flex h-screen w-screen bg-slate-100 overflow-hidden font-sans text-slate-800">
      
      <Sidebar 
        onComposeOpen={() => setIsComposeOpen(true)} 
        isAdminView={isAdminView}
        setIsAdminView={(val) => { setIsAdminView(val); setAdminMessage({ type: '', text: '' }); }}
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
              title="Modifier mes informations personnelles"
            >
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition">
                  {formatDisplayName(user?.username)}
                </p>
                <p className="text-xs text-amber-600 font-mono font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                  {user?.role}
                </p>
              </div>

              {/* Petit avatar de profil circulaire */}
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-semibold text-sm flex items-center justify-center border border-slate-800 shadow-sm group-hover:bg-blue-600 group-hover:border-blue-500 transition duration-150 uppercase">
                {user?.username ? user.username.charAt(0) : 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Contenu alternatif (Gestion Admin ou Messagerie) */}
        {isAdminView ? (
          <div className="flex-1 bg-slate-50 p-8 overflow-y-auto flex justify-center items-start">
            <div className="w-full max-w-xl bg-white p-6 rounded-xl border border-slate-200 shadow-md">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Créer un nouveau compte utilisateur</h2>
              <p className="text-slate-500 text-sm mb-6">Le compte créé sera instantanément actif sur la plateforme.</p>

              {adminMessage.text && (
                <div className={`p-3 rounded-lg text-sm mb-4 font-medium ${adminMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                  {adminMessage.text}
                </div>
              )}

              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Nom d'utilisateur (Username) *</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Ex: aymen_dev"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Adresse Email Professionnelle</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Ex: aymen.l@cspj.ma (Optionnel)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Mot de passe provisoire *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Rôle affecté</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="Fonctionnaire">Fonctionnaire (Interne CSPJ)</option>
                    <option value="Association">Association (Externe)</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition shadow-sm"
                  >
                    ➕ Enregistrer et créer le compte
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 min-h-0 divide-x divide-slate-200">
            <div className="w-80 lg:w-96 bg-white flex-shrink-0">
              <MailList />
            </div>
            
            <div className="flex-1 bg-slate-50">
              {selectedMessage ? (
                <div className="flex flex-col h-full bg-white">
                  <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-800 truncate">{selectedMessage.subject}</h2>
                    <button 
                      onClick={() => toggleArchiveMessage(selectedMessage.id)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm transition"
                    >
                      {selectedMessage.isArchived ? "Désarchiver" : "Archiver la discussion"}
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="font-semibold text-gray-900">{selectedMessage.senderName}</span>
                          <span className="text-xs text-gray-500 block">{selectedMessage.senderEmail}</span>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(selectedMessage.dateEnvoi).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">{selectedMessage.body}</p>
                    </div>

                    {selectedMessage.threads?.map((reply) => (
                      <div key={reply.id} className={`p-5 rounded-lg border shadow-sm ${reply.senderEmail === user?.email ? 'bg-blue-50/40 border-blue-200 ml-10' : 'bg-white border-gray-200 mr-10'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="font-semibold text-gray-900">{reply.senderName}</span>
                            <span className="text-xs text-gray-500 block">{reply.senderEmail}</span>
                          </div>
                          <span className="text-xs text-gray-400">{new Date(reply.dateReponse).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">{reply.body}</p>
                      </div>
                    ))}
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
                  <span className="text-4xl mb-2">📥</span>
                  <p className="text-sm font-medium">Sélectionnez une discussion pour afficher le fil des messages.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isComposeOpen && <ComposeModal onClose={() => setIsComposeOpen(false)} />}
      {isProfileOpen && <ProfileModal onClose={() => setIsProfileOpen(false)} />}
    </div>
  );
}