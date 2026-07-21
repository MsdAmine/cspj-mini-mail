import React from "react";
import { useMail } from "../context/MailContext";
import { useAuth } from "../context/AuthContext";

export default function MailList() {
  const { user } = useAuth();
  const {
    messages,
    activeFolder,
    selectedMessage,
    setSelectedMessage,
    loading,
  } = useMail();

  const handleSelectMessage = (msg) => {
    setSelectedMessage(msg);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* En-tête de la liste */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {activeFolder === "inbox" && "Boîte de réception"}
          {activeFolder === "sent" && "Messages envoyés"}
          {activeFolder === "archived" && "Conversations archivées"}
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
            const isGroup = msg.estGroupe;

            return (
              <div
                key={msg.threadId}
                onClick={() => handleSelectMessage(msg)}
                className={`p-4 cursor-pointer transition relative flex items-start space-x-3 ${
                  isSelected
                    ? "bg-blue-50/70 border-l-4 border-blue-600 pl-3"
                    : "hover:bg-slate-50"
                }`}
              >
                {/* Indicateur Non lu */}
                {showUnreadDot && (
                  <span className="absolute top-5 right-4 h-2.5 w-2.5 bg-blue-600 rounded-full" />
                )}

                {/* Avatar / Group Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold uppercase mt-0.5 ${
                    isGroup
                      ? "bg-violet-100 text-violet-700 border border-violet-200"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {isGroup ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    msg.dernierExpediteurNom?.charAt(0) ?? "?"
                  )}
                </div>

                {/* Contenu de l'aperçu */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isGroup && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 border border-violet-200 flex-shrink-0">
                          Groupe
                        </span>
                      )}
                      <h4 className={`text-sm truncate pr-4 ${showUnreadDot ? "font-bold text-slate-900" : "text-slate-700"}`}>
                        {isGroup
                          ? msg.titreGroupe || "Discussion de groupe"
                          : msg.dernierExpediteurNom}
                      </h4>
                    </div>
                    <span className="text-xxs text-slate-400 font-mono whitespace-nowrap flex-shrink-0">
                      {new Date(msg.derniereActivite).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {isGroup && msg.nombreParticipants > 0 && (
                    <p className="text-[10px] text-violet-600 font-medium mb-0.5">
                      {msg.nombreParticipants} participants
                    </p>
                  )}

                  <p className={`text-xs truncate mb-1 ${showUnreadDot ? "font-semibold text-slate-900" : "text-slate-600"}`}>
                    {msg.objet}
                  </p>

                  <p className="text-xs text-slate-400 truncate">
                    {msg.dernierMessageCorps
                      ? msg.dernierMessageCorps.replace(/<[^>]*>?/gm, "")
                      : ""}
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
