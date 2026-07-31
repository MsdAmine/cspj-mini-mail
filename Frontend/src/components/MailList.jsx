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
    searchQuery,
  } = useMail();

  const handleSelectMessage = (msg) => {
    setSelectedMessage(msg);
  };

  const filteredMessages = messages.filter((msg) => {
    if (!searchQuery?.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    
    const subjectMatch = msg.objet?.toLowerCase().includes(q);
    const senderMatch = msg.dernierExpediteurNom?.toLowerCase().includes(q) || msg.titreGroupe?.toLowerCase().includes(q);
    const contentMatch = msg.dernierMessageCorps?.toLowerCase().includes(q);
    
    return subjectMatch || senderMatch || contentMatch;
  });
  return (
    <div className="h-full flex flex-col bg-white/95 backdrop-blur-md overflow-hidden">
      
      {/* ── Communication Hub Header (Association Only) ── */}
      {user?.role === 'Association' && (
        <div className="px-5 py-5 border-b border-slate-100 bg-white shadow-sm flex flex-col gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Hub de Communication</h2>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">{user.institutionNom || 'Espace Association'}</p>
            </div>
          </div>
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                En attente
              </div>
              <span className="text-sm font-bold text-amber-900">{messages.filter(m => m.statutAcheminement === 'En cours').length}</span>
            </div>
            <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Traités
              </div>
              <span className="text-sm font-bold text-emerald-900">{messages.filter(m => m.statutAcheminement === 'Clôturé').length}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Panel header ── */}
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-4 rounded-full bg-gradient-to-b from-indigo-500 to-violet-600" />
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">
            {activeFolder === "inbox"    && "العلبة الواردة"}
            {activeFolder === "sent"     && "الرسائل المرسلة"}
            {activeFolder === "archived" && "المحادثات المؤرشفة"}
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-bold bg-white border border-slate-200 shadow-sm px-2.5 py-0.5 rounded-full">
          {filteredMessages.length}
        </span>
      </div>

      {/* ── Scrollable list ── */}
      <div className="flex-1 overflow-y-auto">
        {loading && messages.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center gap-3 text-slate-400">
            <svg className="animate-spin h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs font-medium">جارٍ التحميل...</span>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center gap-2 text-slate-400 text-center">
            <svg className="w-10 h-10 text-slate-200 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m13-4l-5 5-5-5" />
            </svg>
            <p className="text-xs font-medium">
              {searchQuery ? "لا توجد نتائج تطابق بحثك" : "لا توجد محادثات."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/80">
            {filteredMessages.map((msg) => {
              const isSelected    = selectedMessage?.threadId === msg.threadId;
              const showUnreadDot = msg.aDesMessagesNonLus;
              const isGroup       = msg.estGroupe;

              return (
                <div
                  key={msg.threadId}
                  onClick={() => handleSelectMessage(msg)}
                  className={`
                    relative flex items-start gap-4 py-4 px-5 cursor-pointer
                    transition-all duration-200 border-b border-slate-100/80 last:border-0
                    ${isSelected
                      ? "bg-indigo-50/40 border-r-[3px] border-r-indigo-500 shadow-inner"
                      : "hover:bg-slate-50/80 border-r-[3px] border-r-transparent"
                    }
                  `}
                >
                  {/* Glowing unread dot */}
                  {showUnreadDot && (
                    <span className="absolute top-5 left-3 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] flex-shrink-0" />
                  )}

                  {/* Avatar / Group icon */}
                  <div
                    className={`
                      w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center
                      text-sm font-bold uppercase mt-0.5 shadow-sm
                      ${isGroup
                        ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white border border-violet-300/40"
                        : isSelected
                        ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white border border-indigo-300/40"
                        : "bg-slate-100 text-slate-700 border border-slate-200/60"
                      }
                    `}
                  >
                    {isGroup ? (
                      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : (
                      msg.dernierExpediteurNom?.charAt(0) ?? "?"
                    )}
                  </div>

                  {/* Preview content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {isGroup && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 border border-violet-200/80 flex-shrink-0">
                            مجموعة
                          </span>
                        )}
                        <h4 className={`text-sm truncate ${showUnreadDot ? "font-bold text-slate-900" : isSelected ? "font-bold text-indigo-900" : "font-semibold text-slate-800"}`}>
                          {isGroup
                            ? msg.titreGroupe || "محادثة جماعية"
                            : msg.dernierExpediteurNom}
                        </h4>
                      </div>
                      <span className={`text-[10px] font-mono whitespace-nowrap flex-shrink-0 ${showUnreadDot ? "font-bold text-indigo-600" : "font-medium text-slate-400"}`}>
                        {new Date(msg.derniereActivite).toLocaleDateString("ar-MA", {
                          month: "short",
                          day:   "numeric",
                        })}
                      </span>
                    </div>

                    {isGroup && msg.nombreParticipants > 0 && (
                      <p className="text-[10px] font-semibold text-violet-600 mb-1">
                        {msg.nombreParticipants} مشارك
                      </p>
                    )}

                    <p className={`text-xs truncate mb-1 ${showUnreadDot ? "font-bold text-slate-800" : "font-medium text-slate-600"}`}>
                      {msg.objet}
                    </p>

                    <div className="flex items-center justify-between gap-3 mt-1.5">
                      <p className="text-[11px] text-slate-400 truncate leading-relaxed flex-1">
                        {msg.dernierMessageCorps
                          ? msg.dernierMessageCorps.replace(/<[^>]*>?/gm, "")
                          : ""}
                      </p>
                      
                      {/* Status Badges */}
                      {msg.statutAcheminement && msg.statutAcheminement !== 'N/A' && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border flex-shrink-0 ${
                          msg.statutAcheminement === 'En cours' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200/80' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${msg.statutAcheminement === 'En cours' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          {msg.statutAcheminement === 'En cours' ? 'En cours' : 'Traité'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
