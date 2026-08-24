import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  LifeBuoy, Plus, Search, MessageSquare, Clock, CheckCircle2,
  ChevronRight, Send, X, RefreshCw, User, ShieldAlert,
  HelpCircle, Filter, RotateCcw
} from 'lucide-react';

const CATEGORY_LABELS = {
  AccessRequest: { fr: "Demande d'accès", ar: "طلب صلاحية / ولوج", color: "bg-purple-50 text-purple-700 border-purple-200" },
  GroupIssue: { fr: "Problème de groupe", ar: "مشكلة في المجموعات", color: "bg-amber-50 text-amber-700 border-amber-200" },
  AccountUpdate: { fr: "Mise à jour du compte", ar: "تحديث الحساب", color: "bg-blue-50 text-blue-700 border-blue-200" },
  Other: { fr: "Autre demande", ar: "طلب آخر", color: "bg-slate-50 text-slate-700 border-slate-200" },
};

const PRIORITY_LABELS = {
  Low: { fr: "Faible", ar: "منخفضة", badge: "bg-slate-100 text-slate-600 border-slate-200" },
  Normal: { fr: "Normale", ar: "عادية", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  Urgent: { fr: "Urgente", ar: "عاجلة", badge: "bg-rose-50 text-rose-700 border-rose-200" },
};

const STATUS_LABELS = {
  Open: { fr: "Ouvert", ar: "مفتوح", badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  InProgress: { fr: "En cours", ar: "قيد المعالجة", badge: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
  Resolved: { fr: "Résolu", ar: "تم الحل", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  Closed: { fr: "Fermé", ar: "مغلق", badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function SupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetailsLoading, setTicketDetailsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New ticket form state
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('AccessRequest');
  const [newPriority, setNewPriority] = useState('Normal');
  const [newMessage, setNewMessage] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [createError, setCreateError] = useState('');

  // Reply message state
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/support/tickets');
      setTickets(res.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des tickets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const loadTicketDetails = async (id) => {
    try {
      setTicketDetailsLoading(true);
      const res = await api.get(`/support/tickets/${id}`);
      setSelectedTicket(res.data);
    } catch (err) {
      console.error('Erreur lors du chargement du ticket:', err);
    } finally {
      setTicketDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTicket) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) {
      setCreateError('Veuillez renseigner le sujet et la description.');
      return;
    }

    setSubmittingTicket(true);
    setCreateError('');
    try {
      const res = await api.post('/support/tickets', {
        subject: newSubject.trim(),
        category: newCategory,
        priority: newPriority,
        message: newMessage.trim(),
      });

      setIsCreateModalOpen(false);
      setNewSubject('');
      setNewCategory('AccessRequest');
      setNewPriority('Normal');
      setNewMessage('');

      await fetchTickets();
      setSelectedTicket(res.data);
    } catch (err) {
      setCreateError(err.response?.data?.message || err.response?.data || 'Erreur lors de la création du ticket.');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleSendReply = async (e) => {
    e?.preventDefault();
    if (!replyContent.trim() || !selectedTicket || sendingReply) return;

    setSendingReply(true);
    try {
      await api.post(`/support/tickets/${selectedTicket.id}/messages`, {
        content: replyContent.trim(),
      });
      setReplyContent('');
      await loadTicketDetails(selectedTicket.id);
      fetchTickets();
    } catch (err) {
      console.error("Erreur lors de l'envoi du message:", err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedTicket) return;
    try {
      await api.put(`/support/tickets/${selectedTicket.id}/status`, { status });
      await loadTicketDetails(selectedTicket.id);
      fetchTickets();
    } catch (err) {
      console.error("Erreur lors de la mise à jour du statut:", err);
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    const matchesSearch =
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    inProgress: tickets.filter(t => t.status === 'InProgress').length,
    resolved: tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length,
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-hidden font-sans" dir="rtl">
      {/* ── Header ── */}
      <header className="px-6 py-5 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">الدعم الفني والمساعدة</h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200">
                Support & Assistance
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              إرسال ومتابعة تذاكر الدعم والطلبات الإدارية والتقنية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTickets}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-lg text-sm font-medium transition-all shadow-sm active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تذكرة جديدة</span>
            <span className="text-blue-200 text-xs hidden sm:inline">| Nouveau Ticket</span>
          </button>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">

        {/* Left / Main Table View */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-200 bg-slate-50/50 p-3 gap-2 text-center">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
              <span className="text-[11px] text-slate-500 font-medium block">إجمالي التذاكر</span>
              <span className="text-lg font-bold text-slate-800">{stats.total}</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
              <span className="text-[11px] text-amber-600 font-medium block">قيد الانتظار (Ouvert)</span>
              <span className="text-lg font-bold text-amber-600">{stats.open}</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
              <span className="text-[11px] text-indigo-600 font-medium block">قيد المعالجة (En cours)</span>
              <span className="text-lg font-bold text-indigo-600">{stats.inProgress}</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
              <span className="text-[11px] text-emerald-600 font-medium block">تمت المعالجة (Résolu)</span>
              <span className="text-lg font-bold text-emerald-600">{stats.resolved}</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                dir="rtl"
                placeholder="بحث برقم التذكرة أو الموضوع..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 placeholder:text-slate-400 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <span>الفلترة:</span>
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-600"
              >
                <option value="All">كل الفئات (Toutes catégories)</option>
                <option value="AccessRequest">طلب صلاحية (Accès)</option>
                <option value="GroupIssue">مشكلة مجموعات (Groupes)</option>
                <option value="AccountUpdate">تحديث الحساب (Compte)</option>
                <option value="Other">أخرى (Autre)</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-600"
              >
                <option value="All">كل الحالات (Tous statuts)</option>
                <option value="Open">مفتوح (Ouvert)</option>
                <option value="InProgress">قيد المعالجة (En cours)</option>
                <option value="Resolved">تم الحل (Résolu)</option>
                <option value="Closed">مغلق (Fermé)</option>
              </select>
            </div>
          </div>

          {/* Tickets List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-xs">جاري تحميل التذاكر...</span>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3 p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <LifeBuoy className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">لا توجد تذاكر دعم مسجلة</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchQuery ? 'لا توجد نتائج مطابقة لخيارات البحث الحالية' : 'يمكنك إنشاء تذكرة دعم جديدة عند الحاجة لأي مساعدة تقنية أو إدارية'}
                  </p>
                </div>
                {!searchQuery && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="mt-2 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium border border-blue-200 transition-colors"
                  >
                    + إنشاء تذكرة جديدة
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTickets.map((t) => {
                  const cat = CATEGORY_LABELS[t.category] || CATEGORY_LABELS.Other;
                  const pri = PRIORITY_LABELS[t.priority] || PRIORITY_LABELS.Normal;
                  const sta = STATUS_LABELS[t.status] || STATUS_LABELS.Open;
                  const isSelected = selectedTicket?.id === t.id;

                  return (
                    <div
                      key={t.id}
                      onClick={() => loadTicketDetails(t.id)}
                      className={`p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-between gap-4 ${isSelected ? 'bg-blue-50/50 border-r-4 border-blue-600' : ''
                        }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {t.ticketNumber}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sta.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sta.dot}`} />
                            {sta.ar} ({sta.fr})
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${cat.color}`}>
                            {cat.ar}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${pri.badge}`}>
                            {pri.ar}
                          </span>
                        </div>

                        <h3 className="text-sm font-semibold text-slate-800 truncate mb-1">
                          {t.subject}
                        </h3>

                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(t.updatedAt || t.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {t.messagesCount} {t.messagesCount > 1 ? 'رسائل' : 'رسالة'}
                          </span>
                          {t.assignedAdminName && (
                            <span className="text-indigo-600 font-medium">
                              المكلف: {t.assignedAdminName}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center text-slate-400">
                        <ChevronRight className="w-5 h-5 rotate-180" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right / Chat & Details Modal/Drawer */}
        {selectedTicket && (
          <div className="w-full lg:w-[480px] bg-white rounded-xl border border-slate-200/80 shadow-lg flex flex-col overflow-hidden animate-in slide-in-from-left duration-200">
            {/* Thread Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded">
                    {selectedTicket.ticketNumber}
                  </span>
                  {(() => {
                    const sta = STATUS_LABELS[selectedTicket.status] || STATUS_LABELS.Open;
                    return (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sta.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sta.dot}`} />
                        {sta.ar} ({sta.fr})
                      </span>
                    );
                  })()}
                </div>
                <h2 className="text-base font-bold text-slate-800 line-clamp-2">
                  {selectedTicket.subject}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                  <span>الفئة: {CATEGORY_LABELS[selectedTicket.category]?.ar || selectedTicket.category}</span>
                  <span>•</span>
                  <span>الأولوية: {PRIORITY_LABELS[selectedTicket.priority]?.ar || selectedTicket.priority}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Bar for Creator */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs flex items-center justify-between">
              <span className="text-slate-500">
                {selectedTicket.assignedAdminName
                  ? `المشرف المسؤول: ${selectedTicket.assignedAdminName}`
                  : 'في انتظار تعيين مشرف للدعم'}
              </span>

              {selectedTicket.status !== 'Closed' && selectedTicket.status !== 'Resolved' ? (
                <button
                  onClick={() => handleUpdateStatus('Resolved')}
                  className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تحديد كـ "تم الحل"</span>
                </button>
              ) : (
                <button
                  onClick={() => handleUpdateStatus('Open')}
                  className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>إعادة فتح التذكرة</span>
                </button>
              )}
            </div>

            {/* Thread Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
              {ticketDetailsLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                </div>
              ) : selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                selectedTicket.messages.map((m) => {
                  const isCurrentUser = m.senderId === user?.id;
                  const isAdminReply = m.senderRole === 'Administrateur';

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isCurrentUser ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">{m.senderName}</span>
                        {isAdminReply && (
                          <span className="bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded text-[9px] font-bold">
                            إدارة الدعم
                          </span>
                        )}
                        <span>•</span>
                        <span>{formatDate(m.createdAt)}</span>
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${isCurrentUser
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : isAdminReply
                              ? 'bg-white text-slate-800 border border-blue-200/70 rounded-bl-xs'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                          }`}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  لا توجد ردود بعد
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Box */}
            <div className="p-3 border-t border-slate-200 bg-white">
              {selectedTicket.status === 'Closed' ? (
                <div className="text-center py-2 text-xs text-slate-500 bg-slate-100 rounded-lg">
                  هذه التذكرة مغلقة حالياً. يمكنك إعادة فتحها لإضافة رد جديد.
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="flex gap-2.5 items-center">
                  <div className="relative flex-1">
                    <textarea
                      dir="rtl"
                      rows={1}
                      placeholder="اكتب ردك أو توضيحك هنا..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                      className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-none text-slate-800 placeholder:text-slate-400 transition-all leading-relaxed"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sendingReply || !replyContent.trim()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 active:scale-95"
                  >
                    {sendingReply ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>إرسال</span>
                        <Send className="w-3.5 h-3.5 rotate-180" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── New Support Ticket Modal ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <LifeBuoy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">إنشاء تذكرة دعم فني جديدة</h3>
                  <p className="text-[11px] text-slate-500">Nouveau Ticket de Support</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  موضوع الطلب / Sujet <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  dir="rtl"
                  placeholder="مثال: طلب صلاحية الولوج إلى مراسلات الدائرة..."
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    الفئة / Catégorie <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 text-slate-800"
                  >
                    <option value="AccessRequest">طلب صلاحية (Accès)</option>
                    <option value="GroupIssue">مشكلة مجموعات (Groupes)</option>
                    <option value="AccountUpdate">تحديث الحساب (Compte)</option>
                    <option value="Other">أخرى (Autre)</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    الأولوية / Priorité <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 text-slate-800"
                  >
                    <option value="Low">منخفضة (Faible)</option>
                    <option value="Normal">عادية (Normale)</option>
                    <option value="Urgent">عاجلة (Urgente)</option>
                  </select>
                </div>
              </div>

              {/* Initial Message */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  تفاصيل المشكلة أو الطلب / Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  dir="rtl"
                  placeholder="اشرح المشكلة بالتفصيل مع ذكر أي معلومات قد تساعد فريق الدعم..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full p-3.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 placeholder:text-slate-400 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {submittingTicket ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري الإرسال...</span>
                    </>
                  ) : (
                    <span>تأكيد الإرسال</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
