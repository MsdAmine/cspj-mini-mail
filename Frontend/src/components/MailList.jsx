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
    loading
  } = useMail();

  const handleSelectMessage = (msg) => {
    setSelectedMessage(msg);
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
          {messages.length} discussion(s)
        </span>
      </div>

      {/* Liste défilante */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {loading && messages.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            <svg className="animate-spin h-5 w-5 text-blue-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Chargement...
          </div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            Aucune discussion trouvée.
          </div>
        ) : (
          messages.map((msg) => {
            const isSelected = selectedMessage?.threadId === msg.threadId;
            const showUnreadDot = msg.aDesMessagesNonLus;

            return (
              <div
                key={msg.threadId}
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
                      {msg.dernierExpediteurNom}
                    </h4>
                    <span className="text-xxs text-slate-400 font-mono whitespace-nowrap">
                      {new Date(msg.derniereActivite).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  
                  <p className={`text-xs truncate mb-1 ${showUnreadDot ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                    {msg.objet}
                  </p>
                  
                  <p className="text-xs text-slate-400 truncate">
                    {msg.dernierMessageCorps}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}