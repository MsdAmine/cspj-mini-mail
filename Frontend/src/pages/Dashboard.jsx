import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { useNavigate } from 'react-router-dom';
import { useMail } from '../context/MailContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import MailList from '../components/MailList';
import TiptapEditor from '../components/TiptapEditor';
import DraftsView from '../components/DraftsView';
import { Send, AlertTriangle, Trash2 } from 'lucide-react';

// ── Role → Arabic label helper ──────────────────────────────────────────────

const getRoleArabicLabel = (role) => {
  if (!role) return '';
  const lower = role.toString().toLowerCase();
  if (lower === 'fonctionnaire') return 'موظف';
  if (lower === 'association')   return 'جمعية';
  if (lower === 'admin' || lower === 'administrateur') return 'مدير النظام';
  return role;
};

// ── Role → French label helper ───────────────────────────────────────────────
const getRoleFrenchLabel = (role) => {
  if (!role) return '';
  const lower = role.toString().toLowerCase();
  if (lower === 'fonctionnaire') return 'Fonctionnaire';
  if (lower === 'association')   return 'Association';
  if (lower === 'admin' || lower === 'administrateur') return 'Administrateur';
  return role;
};

// ── Toast component ──────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onClose }) {
  const bgClass = type === 'success'
    ? 'bg-emerald-600 border-emerald-500'
    : 'bg-slate-800 border-slate-700';

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl shadow-black/30 text-white text-sm font-semibold backdrop-blur-sm animate-slide-up ${bgClass}`}
      dir="rtl"
    >
      {type === 'success' ? (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
      )}
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-auto w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors mr-2 cursor-pointer"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    selectedMessage, 
    replyToThread, 
    toggleArchiveMessage,
    deleteThread,
    activeFolder,
  } = useMail();
  
  const [replyBody, setReplyBody] = useState('');
  const [toast, setToast] = useState(null);

  const isAdmin = user?.role === 'Administrateur';

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    await replyToThread(selectedMessage.threadId, replyBody);
    setReplyBody('');
  };

  const handleDeleteThread = async (threadId) => {
    try {
      await deleteThread(threadId);
      setToast({ message: 'تم حذف المحادثة بنجاح.', type: 'success' });
      setTimeout(() => setToast(null), 3500);
    } catch {
      setToast({ message: 'تعذّر حذف المحادثة. يرجى المحاولة مجدداً.', type: 'error' });
      setTimeout(() => setToast(null), 3500);
    }
  };

  // ── Admin dashboard redirect ─────────────────────────────────────────────
  // Admin users who land on /dashboard are shown a redirect to /dashboard (stats)
  // which is now a dedicated page. Keep them on /dashboard which now renders
  // AdminDashboardPage via the route. But since Dashboard is re-used in Layout,
  // admins visiting /dashboard see this component. The admin content is served
  // by their dedicated routes (/users, /institutions etc). So here we show a
  // minimal redirect notice for admins who shouldn't be on this component.
  // (Non-admin = mail view)

  // Mail inbox view for non-admin users
  return (
    <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
      
      {/* ── Top header bar ── */}
      <header dir="ltr" className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-end px-4 md:px-6 shadow-sm flex-shrink-0">
        <div className="flex items-center">
          {/* Profile avatar / link */}
          <div 
            onClick={() => navigate('/profile')}
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
                {isAdmin ? getRoleFrenchLabel(user?.role) : getRoleArabicLabel(user?.role)}
              </span>
            </div>

            {/* Circular profile avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white font-semibold text-sm flex items-center justify-center border border-slate-700/50 shadow-md shadow-slate-900/20 group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:border-blue-400/50 transition-all duration-200 uppercase font-mono">
              {user?.prenom ? user.prenom.charAt(0) : 'U'}
            </div>
          </div>
        </div>
      </header>

      {/* ── Drafts view ── */}
      {activeFolder === 'drafts' ? (
        <DraftsView />
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

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Archive button */}
                      <button
                        onClick={() => toggleArchiveMessage(selectedMessage.threadId)}
                        className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white/90 border border-slate-200/80 rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-sm active:scale-95 transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        {selectedMessage.estArchive ? "إلغاء الأرشفة" : "أرشفة"}
                      </button>

                      {/* Delete button */}
                      <button
                        id="btn-delete-thread"
                        onClick={() => handleDeleteThread(selectedMessage.threadId)}
                        className="px-3.5 py-2 text-xs font-semibold text-red-600 bg-white/90 border border-red-200/80 rounded-xl hover:bg-red-50 hover:border-red-300 shadow-sm active:scale-95 transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
                        title="حذف هذه المحادثة من صندوقك"
                      >
                        <Trash2 size={13} className="flex-shrink-0" />
                        حذف
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Message thread (document-style) ── */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-slate-50/50">
                  {selectedMessage.messages?.map((msg) => {
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
                          
                          {/* Official Seal for Admins */}
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
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.corps, { USE_PROFILES: { html: true } }) }}
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
                                const displaySize = file.tailleOctets >= 1024 * 1024 ? `${sizeMb} Mo` : `${sizeKb} Ko`;

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

                {/* ── Reply box ── */}
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
              <div className="hidden md:flex flex-col items-center justify-center h-full gap-5 text-slate-400 bg-slate-50/50">
                <div className="w-24 h-24 rounded-full bg-indigo-50/50 border border-indigo-100/50 flex items-center justify-center text-indigo-300 shadow-inner">
                  <svg className="w-12 h-12 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <div className="text-center max-w-sm">
                  <p className="text-base font-bold text-slate-700 tracking-tight">لا توجد محادثة محددة</p>
                  <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">يرجى تحديد محادثة من القائمة الجانبية لقراءة سلسلة الرسائل والرد عليها.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}



      {/* ── Toast Notification ── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}