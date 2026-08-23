import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  LifeBuoy, Search, MessageSquare, Clock, CheckCircle2, 
  ChevronRight, Send, X, RefreshCw, User, ShieldAlert,
  UserCheck, Building, Mail, Check, AlertTriangle, RotateCcw
} from 'lucide-react';

const CATEGORY_MAP = {
  AccessRequest: { label: "Demande d'accès", ar: "طلب صلاحية", color: "bg-purple-50 text-purple-700 border-purple-200/80" },
  GroupIssue: { label: "Problème de groupe", ar: "مشكلة مجموعة", color: "bg-amber-50 text-amber-700 border-amber-200/80" },
  AccountUpdate: { label: "Mise à jour compte", ar: "تحديث حساب", color: "bg-blue-50 text-blue-700 border-blue-200/80" },
  Other: { label: "Autre", ar: "أخرى", color: "bg-slate-100 text-slate-700 border-slate-200" },
};

const PRIORITY_MAP = {
  Low: { label: "Faible", badge: "bg-slate-100 text-slate-600 border-slate-200" },
  Normal: { label: "Normale", badge: "bg-blue-50 text-blue-700 border-blue-200/80" },
  Urgent: { label: "Urgente", badge: "bg-rose-50 text-rose-700 border-rose-200 font-bold" },
};

const STATUS_MAP = {
  Open: { label: "Ouvert", ar: "مفتوح", badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  InProgress: { label: "En cours", ar: "قيد المعالجة", badge: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
  Resolved: { label: "Résolu", ar: "تم الحل", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  Closed: { label: "Fermé", ar: "مغلق", badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
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

const initials = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return '?';
};

export default function ManageSupport() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetailsLoading, setTicketDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Open', 'InProgress', 'Resolved'
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Claiming & Status state
  const [claiming, setClaiming] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

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
      setActionError('');
      setActionSuccess('');
      const res = await api.get(`/support/tickets/${id}`);
      setSelectedTicket(res.data);
    } catch (err) {
      console.error('Erreur chargement détails ticket:', err);
    } finally {
      setTicketDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTicket) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages]);

  const handleClaimTicket = async (ticketId) => {
    setClaiming(true);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await api.put(`/support/tickets/${ticketId}/claim`);
      setSelectedTicket(res.data);
      setActionSuccess('Vous avez pris en charge ce ticket.');
      await fetchTickets();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data || "Erreur lors de la prise en charge.";
      setActionError(errorMsg);
    } finally {
      setClaiming(false);
    }
  };

  // Simplified Status Transition: Mark as Resolved or Reopen
  const handleToggleResolve = async (ticketId, currentStatus) => {
    setUpdatingStatus(true);
    setActionError('');
    setActionSuccess('');
    const newStatus = currentStatus === 'Resolved' || currentStatus === 'Closed' ? 'InProgress' : 'Resolved';
    try {
      const res = await api.put(`/support/tickets/${ticketId}/status`, { status: newStatus });
      setSelectedTicket(res.data);
      setActionSuccess(newStatus === 'Resolved' ? 'Ticket marqué comme résolu.' : 'Ticket rouvert.');
      await fetchTickets();
    } catch (err) {
      setActionError(err.response?.data?.message || err.response?.data || "Erreur lors du changement de statut.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendReply = async (e) => {
    e?.preventDefault();
    if (!replyContent.trim() || !selectedTicket || sendingReply) return;

    setSendingReply(true);
    setActionError('');
    try {
      await api.post(`/support/tickets/${selectedTicket.id}/messages`, {
        content: replyContent.trim(),
      });
      setReplyContent('');
      await loadTicketDetails(selectedTicket.id);
      fetchTickets();
    } catch (err) {
      setActionError(err.response?.data?.message || err.response?.data || "Erreur lors de l'envoi de la réponse.");
    } finally {
      setSendingReply(false);
    }
  };

  // Filtered tickets logic
  const filteredTickets = tickets.filter(t => {
    const matchesTab = activeTab === 'All' 
      ? true 
      : activeTab === 'Resolved' 
      ? (t.status === 'Resolved' || t.status === 'Closed')
      : t.status === activeTab;

    const matchesSearch = 
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.createdByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.createdByEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;

    return matchesTab && matchesSearch && matchesPriority && matchesCategory;
  });

  const counts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    inProgress: tickets.filter(t => t.status === 'InProgress').length,
    resolved: tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length,
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] text-slate-800 overflow-hidden font-sans" dir="ltr">
      {/* ── Top Header ── */}
      <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-6 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Gestion du Support</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wider">
                Support Tickets
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Traitement, assignation et résolution des demandes et incidents utilisateurs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTickets}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </header>

      {/* ── Main Work Area ── */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        
        {/* Left Side: Ticket Management Table / Cards */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          
          {/* Navigation Tabs */}
          <div className="px-4 pt-3 border-b border-slate-200/80 flex items-center gap-2 bg-slate-50/50 overflow-x-auto">
            <button
              onClick={() => setActiveTab('All')}
              className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'All'
                  ? 'border-blue-600 text-blue-700 bg-white shadow-xs font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Tous les tickets</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono">
                {counts.all}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('Open')}
              className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'Open'
                  ? 'border-amber-500 text-amber-700 bg-white shadow-xs font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Ouverts (En attente)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-50 text-amber-700 font-mono border border-amber-200/60">
                {counts.open}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('InProgress')}
              className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'InProgress'
                  ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>En cours</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 text-indigo-700 font-mono border border-indigo-200/60">
                {counts.inProgress}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('Resolved')}
              className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'Resolved'
                  ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Résolus</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-mono border border-emerald-200/60">
                {counts.resolved}
              </span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-3 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 bg-white">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Recherche (N° ticket, sujet, utilisateur)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-3.5 pl-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 placeholder:text-slate-400 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:border-blue-600"
              >
                <option value="All">Toutes catégories</option>
                <option value="AccessRequest">Demande d'accès</option>
                <option value="GroupIssue">Problème de groupe</option>
                <option value="AccountUpdate">Mise à jour compte</option>
                <option value="Other">Autre</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:border-blue-600"
              >
                <option value="All">Toutes priorités</option>
                <option value="Low">Faible</option>
                <option value="Normal">Normale</option>
                <option value="Urgent">Urgente</option>
              </select>
            </div>
          </div>

          {/* Ticket Listing */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-xs">Chargement des tickets...</span>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3 p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <LifeBuoy className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Aucun ticket trouvé</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {searchQuery ? 'Aucun ticket ne correspond à vos filtres de recherche.' : 'Aucun ticket disponible dans cette catégorie.'}
                  </p>
                </div>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const cat = CATEGORY_MAP[t.category] || CATEGORY_MAP.Other;
                const pri = PRIORITY_MAP[t.priority] || PRIORITY_MAP.Normal;
                const sta = STATUS_MAP[t.status] || STATUS_MAP.Open;
                const isSelected = selectedTicket?.id === t.id;
                const isClaimedByMe = t.assignedAdminId === user?.id;

                return (
                  <div
                    key={t.id}
                    onClick={() => loadTicketDetails(t.id)}
                    className={`p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected ? 'bg-blue-50/50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {t.ticketNumber}
                        </span>

                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${sta.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sta.dot}`} />
                          {sta.label}
                        </span>

                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${cat.color}`}>
                          {cat.label}
                        </span>

                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${pri.badge}`}>
                          {pri.label}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-slate-800 truncate mb-1">
                        {t.subject}
                      </h3>

                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {t.createdByName} {t.createdByInstitution ? `(${t.createdByInstitution})` : ''}
                        </span>

                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(t.updatedAt || t.createdAt)}
                        </span>

                        <span className="flex items-center gap-1 text-slate-400">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {t.messagesCount} msg
                        </span>

                        {t.assignedAdminName ? (
                          <span className={`font-medium ${isClaimedByMe ? 'text-blue-600 font-semibold' : 'text-slate-600'}`}>
                            Pris en charge : {isClaimedByMe ? 'Moi' : t.assignedAdminName}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">
                            Non assigné
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {t.status === 'Open' && !t.assignedAdminId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClaimTicket(t.id);
                          }}
                          disabled={claiming}
                          className="px-3 py-1.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1 cursor-pointer active:scale-98"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Prendre en charge</span>
                        </button>
                      )}
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Chat / Detail Pane */}
        {selectedTicket ? (
          <div className="w-full lg:w-[500px] bg-white rounded-2xl border border-slate-200/80 shadow-lg flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            
            {/* Thread Header */}
            <div className="p-4 border-b border-slate-200/80 bg-slate-50/70 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {selectedTicket.ticketNumber}
                  </span>

                  {(() => {
                    const sta = STATUS_MAP[selectedTicket.status] || STATUS_MAP.Open;
                    return (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${sta.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sta.dot}`} />
                        {sta.label}
                      </span>
                    );
                  })()}

                  <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${CATEGORY_MAP[selectedTicket.category]?.color || 'bg-slate-100 text-slate-700'}`}>
                    {CATEGORY_MAP[selectedTicket.category]?.label || selectedTicket.category}
                  </span>

                  <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${PRIORITY_MAP[selectedTicket.priority]?.badge || 'bg-slate-100 text-slate-700'}`}>
                    {PRIORITY_MAP[selectedTicket.priority]?.label || selectedTicket.priority}
                  </span>
                </div>

                <h2 className="text-base font-bold text-slate-900 line-clamp-2">
                  {selectedTicket.subject}
                </h2>

                {/* Requester Info Card */}
                <div className="mt-2.5 p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {initials(selectedTicket.createdByName)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{selectedTicket.createdByName}</p>
                      <p className="text-[11px] text-slate-400">{selectedTicket.createdByEmail}</p>
                    </div>
                  </div>
                  {selectedTicket.createdByInstitution && (
                    <span className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md border border-slate-200 font-medium">
                      {selectedTicket.createdByInstitution}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Bar: Simplified Resolution Button & Assignment */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedTicket.assignedAdminId ? (
                  <span className="text-slate-600">
                    Assigné à : <strong className="text-blue-700 font-semibold">{selectedTicket.assignedAdminId === user?.id ? 'Vous' : selectedTicket.assignedAdminName}</strong>
                  </span>
                ) : (
                  <button
                    onClick={() => handleClaimTicket(selectedTicket.id)}
                    disabled={claiming}
                    className="px-3 py-1 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-lg font-semibold text-xs transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Prendre en charge</span>
                  </button>
                )}
              </div>

              {/* Single Primary Resolution CTA */}
              <div>
                {selectedTicket.status !== 'Resolved' && selectedTicket.status !== 'Closed' ? (
                  <button
                    onClick={() => handleToggleResolve(selectedTicket.id, selectedTicket.status)}
                    disabled={updatingStatus}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    {updatingStatus ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Marquer comme résolu</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleResolve(selectedTicket.id, selectedTicket.status)}
                    disabled={updatingStatus}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {updatingStatus ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5 text-slate-500" />}
                    <span>Rouvrir le ticket</span>
                  </button>
                )}
              </div>
            </div>

            {/* Error / Success Toast Alerts */}
            {actionError && (
              <div className="mx-4 mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}
            {actionSuccess && (
              <div className="mx-4 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Thread Messages: Clean, standard messages between User and Admin */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/40">
              {ticketDetailsLoading ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                selectedTicket.messages.map((m) => {
                  const isCurrentUser = m.senderId === user?.id;
                  const isAdminRole = m.senderRole === 'Administrateur';

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">{m.senderName}</span>
                        <span className="text-[10px] text-slate-400">({m.senderRole})</span>
                        <span>•</span>
                        <span>{formatDate(m.createdAt)}</span>
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                          isCurrentUser
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : isAdminRole
                            ? 'bg-white text-slate-800 border border-blue-200 rounded-bl-xs'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-xs text-slate-400">
                  Aucun message dans ce fil de discussion.
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input Box */}
            <div className="p-3 border-t border-slate-200/80 bg-white">
              <form onSubmit={handleSendReply} className="flex gap-2 items-end">
                <textarea
                  rows={2}
                  placeholder="Rédiger une réponse à l'utilisateur..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  className="flex-1 p-2.5 text-xs rounded-xl focus:outline-none resize-none transition-colors bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyContent.trim()}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50 active:scale-98 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white"
                >
                  {sendingReply ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Répondre</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 p-8 text-center shadow-xs">
            <div className="max-w-xs space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400 border border-slate-100">
                <LifeBuoy className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700">Aucun ticket sélectionné</h3>
              <p className="text-xs text-slate-500">
                Sélectionnez un ticket dans la liste pour consulter les détails et échanger avec l'utilisateur.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
