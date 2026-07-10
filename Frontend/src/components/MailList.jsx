import React from 'react';
import { useMail } from '../context/MailContext';
import { useAuth } from '../context/AuthContext';

export default function MailList() {
  const { user } = useAuth();
  const { 
    messages, 
    activeFolder, 
    selectedMessage, 
    setSelectedMessage, 
    searchQuery,
    markAsReadMessage
  } = useMail();

  // 1. Filtrage selon le dossier sélectionné dans la Sidebar
  const folderFilteredMessages = messages.filter(msg => {
    if (activeFolder === 'archived') return msg.isArchived;
    if (msg.isArchived) return false; // Ne pas afficher les archives dans Inbox/Sent

    if (activeFolder === 'sent') {
      return msg.senderEmail === user?.email;
    }
    // Par défaut: Inbox (Reçus par l'utilisateur ou adressés de manière globale)
    return msg.senderEmail !== user?.email;
  });

  // 2. Filtrage selon la barre de recherche (Recherche par objet ou par nom)
  const filteredMessages = folderFilteredMessages.filter(msg => {
    const search = searchQuery.toLowerCase();
    return (
      msg.subject.toLowerCase().includes(search) ||
      msg.senderName.toLowerCase().includes(search) ||
      msg.body.toLowerCase().includes(search)
    );
  });

  const handleSelectMessage = (msg) => {
    setSelectedMessage(msg);
    markAsReadMessage(msg.id);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* En-tête de la liste */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {activeFolder === 'inbox' && 'Boîte de réception'}
          {activeFolder === 'sent' && 'Messages envoyés'}
          {activeFolder === 'archived' && 'Conversations archivées'}
        </span>
        <span className="text-xs text-slate-400 font-mono">
          {filteredMessages.length} message(s)
        </span>
      </div>

      {/* Liste défilante */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredMessages.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            Aucun message trouvé.
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isSelected = selectedMessage?.id === msg.id;
            const showUnreadDot = !msg.isRead && msg.senderEmail !== user?.email;

            return (
              <div
                key={msg.id}
                onClick={() => handleSelectMessage(msg)}
                className={`p-4 cursor-pointer transition relative flex items-start space-x-3 ${
                  isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600 pl-3' : 'hover:bg-slate-50'
                }`}
              >
                {/* Indicateur Non lu */}
                {showUnreadDot && (
                  <span className="absolute top-5 right-4 h-2.5 w-2.5 bg-blue-600 rounded-full" />
                )}

                {/* Contenu de l'aperçu */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className={`text-sm truncate pr-4 ${showUnreadDot ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                      {msg.senderEmail === user?.email ? `À: ${msg.receiverName}` : msg.senderName}
                    </h4>
                    <span className="text-xxs text-slate-400 font-mono whitespace-nowrap">
                      {new Date(msg.dateEnvoi).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  
                  <p className={`text-xs truncate mb-1 ${showUnreadDot ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                    {msg.subject}
                  </p>
                  
                  <p className="text-xs text-slate-400 truncate">
                    {msg.body}
                  </p>

                  {/* Badges Fils de discussion & Pièces jointes */}
                  <div className="flex items-center space-x-2 mt-2">
                    {msg.threads?.length > 0 && (
                      <span className="inline-flex items-center text-xxs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                        💬 {msg.threads.length + 1}
                      </span>
                    )}
                    {msg.piecesJointes?.length > 0 && (
                      <span className="inline-flex items-center text-xxs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                        📎 {msg.piecesJointes.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}