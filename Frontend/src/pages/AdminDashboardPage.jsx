import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Users, MessageSquare, Mail, Activity, ArrowUpRight, 
  Search, Filter, RefreshCw, Clock, CheckCircle2, Shield 
} from 'lucide-react';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState({ totalUsers: 0, totalThreads: 0, totalMessagesSent: 0 });
  const [threads, setThreads] = useState([]);
  const [threadSearch, setThreadSearch] = useState('');
  const [threadStatusFilter, setThreadStatusFilter] = useState('ALL');
  const [isThreadsLoading, setIsThreadsLoading] = useState(true);
  const [threadError, setThreadError] = useState('');
  const [recentLogs, setRecentLogs] = useState(null);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      const data = response.data || {};
      setStats({
        totalUsers: data.totalUsers || 0,
        totalThreads: data.totalThreads || 0,
        totalMessagesSent: data.totalMessagesSent || 0
      });
    } catch (err) {
      console.error("Erreur lors de la récupération des statistiques :", err);
    }
  };

  const fetchThreads = async () => {
    setIsThreadsLoading(true);
    setThreadError('');
    try {
      const response = await api.get('/admin/threads');
      setThreads(response.data || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des discussions :", err);
      setThreadError("Erreur lors de la récupération des discussions.");
      setThreads([]);
    } finally {
      setIsThreadsLoading(false);
    }
  };

  const fetchRecentLogs = async () => {
    try {
      const response = await api.get('/admin/audit-logs');
      const all = response.data || [];
      setRecentLogs(all.slice(0, 5));
    } catch (err) {
      console.error("Erreur lors de la récupération des activités récentes :", err);
      setRecentLogs([]);
    }
  };

  const refreshAll = () => {
    fetchStats();
    fetchThreads();
    fetchRecentLogs();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const filteredThreads = threads.filter(t => {
    const query = threadSearch.toLowerCase().trim();
    let matchesQuery = true;
    if (query) {
      matchesQuery = 
        t.objet?.toLowerCase().includes(query) ||
        t.expediteur?.toLowerCase().includes(query) ||
        t.destinataire?.toLowerCase().includes(query) ||
        t.expediteurEmail?.toLowerCase().includes(query) ||
        t.destinataireEmail?.toLowerCase().includes(query);
    }
    let matchesStatus = true;
    if (threadStatusFilter === 'EN_COURS') matchesStatus = t.statutAcheminement === 'En cours';
    else if (threadStatusFilter === 'CLOTURE') matchesStatus = t.statutAcheminement === 'Clôturé';
    return matchesQuery && matchesStatus;
  });

  return (
    <div dir="ltr" className="flex-1 flex flex-col h-full bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">
      
      {/* ── Top header bar ── */}
      <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-6 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Tableau de bord</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wider">
                Vue d'ensemble
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Statistiques globales d'activité et surveillance du serveur de messagerie
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={refreshAll}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Actualiser les données"
          >
            <RefreshCw className={`w-4 h-4 ${isThreadsLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Profile pill */}
          <div 
            onClick={() => navigate('/profile')}
            className="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 transition-all duration-150 group bg-white shadow-xs"
            title="Mon profil"
          >
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition">
                {user ? `${user.prenom} ${user.nom}` : ''}
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.2 rounded-full border bg-blue-50 text-blue-700 border-blue-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Administrateur
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white font-semibold text-xs flex items-center justify-center border border-slate-700/50 shadow-xs uppercase font-mono">
              {user?.prenom ? user.prenom.charAt(0) : 'A'}
            </div>
          </div>
        </div>
      </header>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* ── Metric Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Card: Users */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                  Actifs
                </span>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Comptes Utilisateurs</p>
              <p className="text-3xl font-bold tracking-tight text-slate-900 mt-1 tabular-nums">{stats.totalUsers}</p>
              <p className="text-xs text-slate-500 mt-2">Profils enregistrés et habilités sur le réseau.</p>
            </div>

            {/* Card: Discussions */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Surveillées
                </span>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Discussions Initiées</p>
              <p className="text-3xl font-bold tracking-tight text-slate-900 mt-1 tabular-nums">{stats.totalThreads}</p>
              <p className="text-xs text-slate-500 mt-2">Fils de discussion distincts créés par les utilisateurs.</p>
            </div>

            {/* Card: Messages */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Transmis
                </span>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Messages Acheminés</p>
              <p className="text-3xl font-bold tracking-tight text-slate-900 mt-1 tabular-nums">{stats.totalMessagesSent}</p>
              <p className="text-xs text-slate-500 mt-2">Volume total de messages transmis de bout en bout.</p>
            </div>
          </div>

          {/* ── Threads Surveillance Table ── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold tracking-tight text-slate-900">Suivi des Discussions / Échanges</h3>
                <p className="text-slate-500 text-xs mt-0.5">Dernières conversations surveillées sur la plateforme.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Rechercher sujet, utilisateur..."
                    value={threadSearch}
                    onChange={(e) => setThreadSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 w-48 md:w-56 transition bg-white"
                  />
                </div>
                <select
                  value={threadStatusFilter}
                  onChange={(e) => setThreadStatusFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none bg-white cursor-pointer w-36 focus:border-blue-600 transition"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="CLOTURE">Clôturés</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 uppercase font-bold tracking-wider text-[10px]">
                    <th className="px-6 py-3.5">Sujet / Objet</th>
                    <th className="px-6 py-3.5">Expéditeur</th>
                    <th className="px-6 py-3.5">Destinataire</th>
                    <th className="px-6 py-3.5 text-center">Pièce Jointe</th>
                    <th className="px-6 py-3.5 text-center">Lecture</th>
                    <th className="px-6 py-3.5 text-center">Acheminement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {isThreadsLoading ? (
                    <tr>
                      <td colSpan="6">
                        <div className="py-12 flex flex-col items-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                          <p className="text-slate-400 text-xs">Chargement des discussions...</p>
                        </div>
                      </td>
                    </tr>
                  ) : threadError ? (
                    <tr>
                      <td colSpan="6">
                        <div className="py-12 flex flex-col items-center gap-2">
                          <div className="p-3.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-2">
                            <span>{threadError}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredThreads.length === 0 ? (
                    <tr>
                      <td colSpan="6">
                        <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
                          <p className="text-xs">Aucune discussion ne correspond aux critères de recherche.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredThreads.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors duration-150">
                        <td className="px-6 py-4 font-semibold text-slate-800 max-w-xs truncate" title={t.objet}>{t.objet}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{t.expediteur}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{t.expediteurEmail}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{t.destinataire}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{t.destinataireEmail}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {t.hasAttachment ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-semibold text-xs">
                              📎
                            </span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-semibold rounded-full border ${
                            t.statutLecture === 'Lu' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' 
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${t.statutLecture === 'Lu' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                            {t.statutLecture}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-semibold rounded-full border ${
                            t.statutAcheminement === 'En cours' 
                              ? 'bg-blue-50 text-blue-700 border-blue-200/80' 
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${t.statutAcheminement === 'En cours' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                            {t.statutAcheminement}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Recent System Activity ── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold tracking-tight text-slate-900">Dernières Activités Système</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Aperçu des 5 dernières entrées du journal d'audit.</p>
              </div>
              <button
                onClick={() => navigate('/audit-logs')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <span>Voir tout le journal</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentLogs === null ? (
              <div className="p-10 flex items-center justify-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-xs font-medium text-slate-400">Chargement des activités...</span>
              </div>
            ) : recentLogs.length === 0 ? (
              <div className="p-10 flex flex-col items-center justify-center text-center gap-2">
                <p className="text-xs font-semibold text-slate-600">Aucune activité enregistrée</p>
                <p className="text-[11px] text-slate-400">Les événements système apparaîtront ici dès qu'ils seront produits.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 uppercase font-bold tracking-wider text-[10px]">
                      <th className="px-6 py-3.5 w-44">Date / Heure</th>
                      <th className="px-6 py-3.5 w-36">Action</th>
                      <th className="px-6 py-3.5">Acteur</th>
                      <th className="px-6 py-3.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {recentLogs.map((log) => {
                      const actionMeta = {
                        CREATE_USER:        { label: 'Création',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' },
                        SEND_MESSAGE:       { label: 'Envoi',         cls: 'bg-blue-50 text-blue-700 border-blue-200/80',         dot: 'bg-blue-500'    },
                        LOGIN:              { label: 'Connexion',     cls: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',   dot: 'bg-indigo-500'  },
                        TOGGLE_USER_STATUS: { label: 'Statut',        cls: 'bg-amber-50 text-amber-700 border-amber-200/80',      dot: 'bg-amber-500'   },
                        DELETE_USER:        { label: 'Suppression',   cls: 'bg-rose-50 text-rose-700 border-rose-200/80',         dot: 'bg-rose-500'    },
                        UPLOAD_ATTACHMENT:  { label: 'Pièce jointe', cls: 'bg-teal-50 text-teal-700 border-teal-200/80',         dot: 'bg-teal-500'    },
                        ARCHIVE_DISCUSSION: { label: 'Archivage',     cls: 'bg-slate-100 text-slate-600 border-slate-200',           dot: 'bg-slate-400'   },
                      };
                      const meta = actionMeta[log.typeAction] || { label: log.typeAction, cls: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
                      const ts = (() => {
                        try {
                          return new Date(log.dateHeure).toLocaleString('fr-FR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          });
                        } catch { return log.dateHeure; }
                      })();
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors duration-150">
                          <td className="px-6 py-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">{ts}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${meta.cls}`}>
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-800 whitespace-nowrap font-mono text-[11px]">{log.utilisateur}</td>
                          <td className="px-6 py-4 text-slate-600 leading-relaxed max-w-xs truncate" title={log.description}>{log.description}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
