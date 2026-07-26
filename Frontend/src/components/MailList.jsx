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
    <div className="h-full flex flex-col bg-white/90 backdrop-blur-md overflow-hidden">
      {/* ── Panel header ── */}
      <div className="px-4 py-3 border-b border-slate-100/80 bg-gradient-to-b from-slate-50/80 to-white/60 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
            {activeFolder === "inbox"    && "العلبة الواردة"}
            {activeFolder === "sent"     && "الرسائل المرسلة"}
            {activeFolder === "archived" && "المحادثات المؤرشفة"}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-full">
          {messages.length}
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
        ) : messages.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center gap-2 text-slate-400">
            <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m13-4l-5 5-5-5" />
            </svg>
            <p className="text-xs font-medium">لا توجد محادثات.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/80">
            {messages.map((msg) => {
              const isSelected   = selectedMessage?.threadId === msg.threadId;
              const showUnreadDot = msg.aDesMessagesNonLus;
              const isGroup       = msg.estGroupe;

              return (
                <div
                  key={msg.threadId}
                  onClick={() => handleSelectMessage(msg)}
                  className={`
                    relative flex items-start gap-3 py-3 px-4 cursor-pointer
                    transition-all duration-150
                    ${isSelected
                      ? "bg-blue-50/60 border-r-[3px] border-blue-500 shadow-sm"
                      : "hover:bg-slate-100/60 border-r-[3px] border-transparent"
                    }
                  `}
                >
                  {/* Glowing unread dot */}
                  {showUnreadDot && (
                    <span className="absolute top-4 left-3 w-2 h-2 rounded-full bg-blue-600 animate-pulse shadow-sm shadow-blue-500/50 flex-shrink-0" />
                  )}

                  {/* Avatar / Group icon */}
                  <div
                    className={`
                      w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center
                      text-xs font-bold uppercase mt-0.5 shadow-sm
                      ${isGroup
                        ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white border border-violet-300/40"
                        : isSelected
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white border border-blue-300/40"
                        : "bg-slate-200 text-slate-600 border border-slate-200"
                      }
                    `}
                  >
                    {isGroup ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : (
                      msg.dernierExpediteurNom?.charAt(0) ?? "?"
                    )}
                  </div>

                  {/* Preview content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2 mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {isGroup && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 border border-violet-200/80 flex-shrink-0">
                            مجموعة
                          </span>
                        )}
                        <h4 className={`text-sm truncate ${showUnreadDot ? "font-bold text-slate-900" : isSelected ? "font-semibold text-blue-900" : "font-medium text-slate-700"}`}>
                          {isGroup
                            ? msg.titreGroupe || "محادثة جماعية"
                            : msg.dernierExpediteurNom}
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap flex-shrink-0">
                        {new Date(msg.derniereActivite).toLocaleDateString("ar-MA", {
                          month: "short",
                          day:   "numeric",
                        })}
                      </span>
                    </div>

                    {isGroup && msg.nombreParticipants > 0 && (
                      <p className="text-[10px] text-violet-600 font-medium mb-0.5">
                        {msg.nombreParticipants} مشارك
                      </p>
                    )}

                    <p className={`text-xs truncate mb-0.5 ${showUnreadDot ? "font-semibold text-slate-800" : "text-slate-600"}`}>
                      {msg.objet}
                    </p>

                    <p className="text-[11px] text-slate-400 truncate leading-relaxed">
                      {msg.dernierMessageCorps
                        ? msg.dernierMessageCorps.replace(/<[^>]*>?/gm, "")
                        : ""}
                    </p>
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
