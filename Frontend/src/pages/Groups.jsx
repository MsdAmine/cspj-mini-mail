import React, { useState, useEffect, useRef } from 'react';
import { useMail } from '../context/MailContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Send, Users, Plus, X, Search, ChevronRight } from 'lucide-react';

// ── Role → Arabic label + badge colour ───────────────────────────────────────
const getRoleLabel = (role) => {
  if (!role) return { label: '', cls: '', dot: '' };
  const lower = role.toLowerCase();
  if (lower === 'fonctionnaire') return { label: 'موظف',   cls: 'bg-slate-100 text-slate-700 border-slate-200',        dot: 'bg-slate-400' };
  if (lower === 'association')   return { label: 'جمعية',  cls: 'bg-amber-50 text-amber-800 border-amber-200/60',      dot: 'bg-amber-500' };
  if (lower === 'administrateur' || lower === 'admin')
                                 return { label: 'مدير النظام', cls: 'bg-blue-50 text-blue-800 border-blue-200/60', dot: 'bg-blue-500'  };
  return { label: role, cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
};

// ── Participant avatar initials ───────────────────────────────────────────────
const initials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

// ── Create Group Modal ────────────────────────────────────────────────────────
function CreateGroupModal({ contacts, onClose, onCreate }) {
  const [groupTitle,    setGroupTitle]    = useState('');
  const [corps,         setCorps]         = useState('');
  const [selectedIds,   setSelectedIds]   = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [error,         setError]         = useState('');
  const [loading,       setLoading]       = useState(false);

  const filtered = contacts.filter(c =>
    `${c.nomComplet} ${c.email} ${c.entrepriseNom}`
      .toLowerCase()
      .includes(contactSearch.toLowerCase())
  );

  const toggle = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!groupTitle.trim())     return setError('يرجى إدخال اسم المجموعة.');
    if (selectedIds.length < 1) return setError('يرجى اختيار مشارك واحد على الأقل.');
    if (!corps.trim())          return setError('يرجى كتابة رسالة أولية.');

    setLoading(true);
    try {
      await onCreate({ groupTitle, corps, participantIds: selectedIds });
      onClose();
    } catch (err) {
      setError(err.message || 'حدث خطأ غير متوقع.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh] m-4">

        {/* Header */}
        <div className="bg-gradient-to-r from-violet-700 to-indigo-700 text-white px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-inner">
              <Users size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-wide">إنشاء مجموعة جديدة</h3>
              <p className="text-violet-200 text-[11px] mt-0.5">مجموعة نقاش مشترك — يرى الجميع المحادثة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white active:scale-95 transition-all duration-150 outline-none cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1" dir="rtl">

          {error && (
            <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Group name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              اسم المجموعة *
            </label>
            <input
              type="text"
              required
              value={groupTitle}
              onChange={e => setGroupTitle(e.target.value)}
              placeholder="مثال: فريق الموارد البشرية، مشروع الشراكة..."
              className="w-full px-4 py-2.5 border border-slate-200/80 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all duration-150"
              disabled={loading}
            />
          </div>

          {/* Participant multi-select */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                المشاركون *
                <span className="normal-case font-normal text-slate-400 mr-1">(اختر على الأقل 1)</span>
              </label>
              {selectedIds.length > 0 && (
                <span className="text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200/80 px-2.5 py-0.5 rounded-full">
                  {selectedIds.length} محدد
                </span>
              )}
            </div>

            {/* Selected badges */}
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedIds.map(id => {
                  const c = contacts.find(x => x.id === id);
                  if (!c) return null;
                  const { label } = getRoleLabel(c.role);
                  return (
                    <span key={id} className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 bg-violet-600 text-white text-xs font-medium rounded-full shadow-sm">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/20">{label}</span>
                      {c.nomComplet}
                      <button
                        type="button"
                        onClick={() => toggle(id)}
                        className="hover:text-violet-200 active:scale-90 transition-all duration-100 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Search */}
            <div className="relative mb-2">
              <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="البحث عن جهة اتصال..."
                value={contactSearch}
                onChange={e => setContactSearch(e.target.value)}
                className="w-full pr-8 pl-4 py-2 border border-slate-200/80 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all duration-150"
                disabled={loading}
              />
            </div>

            {/* Contact list */}
            <div className="border border-slate-200/80 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-white/90">
              {filtered.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">لا توجد جهات اتصال.</div>
              ) : (
                filtered.map(contact => {
                  const isSelected = selectedIds.includes(contact.id);
                  const { label, cls } = getRoleLabel(contact.role);
                  return (
                    <label
                      key={contact.id}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all duration-150 select-none border-b border-slate-100/80 last:border-0 ${isSelected ? 'bg-violet-50/80' : 'hover:bg-slate-50/80'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(contact.id)}
                        className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer accent-violet-600"
                        disabled={loading}
                      />
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold uppercase flex-shrink-0 shadow-sm ${isSelected ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {initials(contact.nomComplet)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{contact.nomComplet}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${cls}`}>{label}</span>
                          <span className="text-[10px] text-slate-400 truncate">{contact.entrepriseNom}</span>
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Initial message */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              الرسالة الأولى *
            </label>
            <textarea
              required
              value={corps}
              onChange={e => setCorps(e.target.value)}
              rows={3}
              placeholder="اكتب رسالة افتتاحية للمجموعة..."
              className="w-full px-4 py-3 border border-slate-200/80 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all duration-150 resize-none"
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100/80">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl active:scale-95 transition-all duration-150 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-md shadow-violet-500/25 active:scale-95 transition-all duration-150 flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  جارٍ الإنشاء...
                </>
              ) : (
                <>
                  <Users size={15} />
                  إنشاء المجموعة
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Groups Page ──────────────────────────────────────────────────────────
export default function Groups() {
  const { user } = useAuth();
  const {
    messages: groupThreads,
    loading,
    contacts,
    createGroupThread,
    replyToThread,
    toggleArchiveMessage,
  } = useMail();

  const [selectedThread,  setSelectedThread]  = useState(null);
  const [isModalOpen,     setIsModalOpen]      = useState(false);
  const [replyBody,       setReplyBody]        = useState('');
  const [isReplying,      setIsReplying]       = useState(false);
  const [search,          setSearch]           = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when a thread is selected or new messages arrive
  useEffect(() => {
    if (selectedThread && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedThread]);

  // Fetch full thread details when a summary is clicked
  const handleSelectThread = async (thread) => {
    try {
      const res = await api.get(`/messages/thread/${thread.threadId}`);
      setSelectedThread(res.data);
      setReplyBody('');
    } catch (err) {
      console.error('Erreur chargement groupe :', err);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyBody.trim() || !selectedThread) return;
    setIsReplying(true);
    try {
      await replyToThread(selectedThread.threadId, replyBody);
      // Re-fetch updated thread
      const res = await api.get(`/messages/thread/${selectedThread.threadId}`);
      setSelectedThread(res.data);
      setReplyBody('');
    } finally {
      setIsReplying(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedThread) return;
    await toggleArchiveMessage(selectedThread.threadId);
    setSelectedThread(null);
  };

  const filtered = groupThreads.filter(t =>
    (t.titreGroupe || t.objet || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden" dir="rtl">

      {/* ── Left panel: group list ────────────────────────────────────────── */}
      <div className={`w-full md:w-80 lg:w-96 bg-white/90 backdrop-blur-md border-l border-slate-200/80 flex flex-col flex-shrink-0 ${
        selectedThread ? 'hidden md:flex' : 'flex'
      }`}>

        {/* Panel header */}
        <div className="px-4 py-4 border-b border-slate-100/80 bg-gradient-to-b from-slate-50/80 to-white/60 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <Users size={13} className="text-white" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600">المجموعات</span>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-full">
                {filtered.length}
              </span>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              id="create-group-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-violet-500/25 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              <Plus size={12} />
              إنشاء مجموعة
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="البحث في المجموعات..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pr-8 pl-4 py-2 border border-slate-200/80 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all duration-150"
            />
          </div>
        </div>

        {/* Group thread list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-10 flex flex-col items-center justify-center gap-3 text-slate-400">
              <svg className="animate-spin h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs font-medium">جارٍ التحميل...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center px-6 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center border border-violet-200/80 shadow-inner">
                <Users size={22} className="text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-0.5">لا توجد مجموعات بعد</p>
                <p className="text-xs text-slate-400">أنشئ مجموعتك الأولى للبدء</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 transition-all duration-150 cursor-pointer"
              >
                <Plus size={12} />
                إنشاء مجموعة
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100/80">
              {filtered.map(thread => {
                const isSelected = selectedThread?.threadId === thread.threadId;
                const hasUnread  = thread.aDesMessagesNonLus;
                return (
                  <div
                    key={thread.threadId}
                    id={`group-thread-${thread.threadId}`}
                    onClick={() => handleSelectThread(thread)}
                    className={`
                      relative p-4 cursor-pointer transition-all duration-150
                      ${isSelected
                        ? 'bg-violet-50/70 border-r-[3px] border-violet-500 shadow-sm'
                        : 'hover:bg-slate-100/60 border-r-[3px] border-transparent'
                      }
                    `}
                  >
                    {/* Glowing unread dot */}
                    {hasUnread && (
                      <span className="absolute top-4 left-3 w-2 h-2 rounded-full bg-violet-600 animate-pulse shadow-sm shadow-violet-500/50" />
                    )}

                    <div className="flex items-start gap-3">
                      {/* Group avatar */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                        <Users size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-0.5 gap-2">
                          <h4 className={`text-sm truncate ${hasUnread ? 'font-bold text-slate-900' : isSelected ? 'font-semibold text-violet-900' : 'font-medium text-slate-700'}`}>
                            {thread.titreGroupe || 'مجموعة بلا اسم'}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                            {new Date(thread.derniereActivite).toLocaleDateString('ar-MA', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        {/* Member count badge */}
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-100 text-violet-700 border border-violet-200/80">
                            <Users size={8} />
                            {thread.nombreParticipants} مشارك
                          </span>
                        </div>
                        <p className={`text-xs truncate ${hasUnread ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                          <span className="text-slate-400 font-normal">{thread.dernierExpediteurNom}: </span>
                          {(thread.dernierMessageCorps || '').replace(/<[^>]*>?/gm, '')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel: thread detail ────────────────────────────────────── */}
      <div className="flex-1 min-w-0 bg-gradient-to-br from-slate-50 via-slate-100/30 to-slate-50 flex flex-col min-h-0">
        {selectedThread ? (
          <div className="flex flex-col h-full">

            {/* Thread header */}
            <div className="px-6 py-4 border-b border-slate-200/80 bg-white/90 backdrop-blur-md flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Group badge row */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                      <Users size={14} />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 border border-violet-200/80">
                      مجموعة
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 truncate mb-2">
                    {selectedThread.titreGroupe || selectedThread.objet}
                  </h2>

                  {/* Participant badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-500">المشاركون:</span>
                    {(selectedThread.tousLesParticipants || []).map(p => {
                      const { label, cls, dot } = getRoleLabel(p.role);
                      return (
                        <span
                          key={p.id}
                          title={`${p.nomComplet} — ${p.entrepriseNom}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200/80 text-xs font-medium text-slate-700 hover:bg-violet-50 hover:border-violet-200 shadow-sm transition-all duration-150"
                        >
                          <span className="w-5 h-5 rounded-full bg-slate-700 text-white text-[9px] font-bold flex items-center justify-center uppercase">
                            {initials(p.nomComplet)}
                          </span>
                          {p.nomComplet}
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${cls}`}>
                            <span className={`w-1 h-1 rounded-full ${dot}`} />
                            {label}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleArchive}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white/90 border border-slate-200/80 rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-sm active:scale-95 transition-all duration-150 flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  {selectedThread.estArchive ? 'إلغاء الأرشفة' : 'أرشفة'}
                </button>
              </div>
            </div>

            {/* Messages (bubble-style) */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {(selectedThread.messages || []).map((msg, index) => {
                const isOwn = msg.expediteurId === user?.id;
                const { label, cls, dot } = getRoleLabel(msg.expediteurRole);
                return (
                  <div
                    key={msg.messageId}
                    className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                  >
                    {/* Sender meta row */}
                    <div className={`flex items-center gap-2 mb-1.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold uppercase shadow-sm flex-shrink-0 ${
                        isOwn
                          ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isOwn
                          ? `${user?.prenom?.charAt(0) ?? ''}${user?.nom?.charAt(0) ?? ''}`
                          : initials(msg.expediteurNomComplet)}
                      </div>
                      <span className="font-semibold text-slate-800 text-xs">
                        {isOwn ? 'أنا' : msg.expediteurNomComplet}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                        {label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex-shrink-0" dir="ltr">
                        {new Date(msg.dateEnvoi).toLocaleString('ar-MA', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* Bubble card */}
                    <div className={`
                      max-w-[85%] rounded-2xl shadow-sm border px-4 py-3
                      ${isOwn
                        ? 'bg-white/95 border-violet-100 rounded-tr-sm'
                        : 'bg-white/90 backdrop-blur-sm border-slate-100/80 rounded-tl-sm'
                      }
                    `}>
                      <div
                        className="text-slate-700 text-sm leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: msg.corps }}
                      />

                      {/* Attachments */}
                      {msg.piecesJointes?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                            المرفقات ({msg.piecesJointes.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {msg.piecesJointes.map(file => {
                              const sizeKb = (file.tailleOctets / 1024).toFixed(1);
                              const sizeMb = (file.tailleOctets / (1024 * 1024)).toFixed(2);
                              const displaySize = file.tailleOctets >= 1024 * 1024 ? `${sizeMb} Mo` : `${sizeKb} Ko`;
                              const handleDownload = async (ev) => {
                                ev.preventDefault();
                                try {
                                  const res = await api.get(`/messages/attachments/download/${file.id}`, { responseType: 'blob' });
                                  const url = URL.createObjectURL(res.data);
                                  const a = document.createElement('a');
                                  a.href = url; a.download = file.nomFichier;
                                  document.body.appendChild(a); a.click(); a.remove();
                                  URL.revokeObjectURL(url);
                                } catch { alert('تعذّر تنزيل الملف.'); }
                              };
                              return (
                                <button key={file.id} type="button" onClick={handleDownload}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-700 font-medium hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 active:scale-95 transition-all duration-150 cursor-pointer"
                                >
                                  <span>📎</span>
                                  <span className="max-w-[160px] truncate">{file.nomFichier}</span>
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
              <div ref={messagesEndRef} />
            </div>

            {/* Reply box */}
            <div className="px-4 py-3 border-t border-slate-200/80 bg-white/90 backdrop-blur-md flex-shrink-0">
              <form onSubmit={handleReply} className="space-y-2.5">
                <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-400 transition-all duration-150">
                  <textarea
                    value={replyBody}
                    onChange={e => setReplyBody(e.target.value)}
                    rows={2}
                    placeholder="اكتب ردك للمجموعة هنا..."
                    className="w-full px-4 py-3 border-0 text-sm bg-transparent focus:outline-none resize-none"
                    disabled={isReplying}
                  />
                </div>
                <div className="flex justify-start">
                  <button
                    type="submit"
                    disabled={isReplying || !replyBody.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-violet-500/25 active:scale-95 transition-all duration-150 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isReplying ? (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : <Send size={14} />}
                    الرد على المجموعة
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-100/80 to-indigo-100/80 flex items-center justify-center border border-violet-200/80 shadow-inner backdrop-blur-sm">
              <Users size={30} className="text-violet-400" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-slate-500 mb-1">اختر مجموعة لعرض المحادثة</p>
              <p className="text-xs text-slate-400">أو أنشئ مجموعة جديدة للبدء</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {isModalOpen && (
        <CreateGroupModal
          contacts={contacts}
          onClose={() => setIsModalOpen(false)}
          onCreate={createGroupThread}
        />
      )}
    </div>
  );
}
