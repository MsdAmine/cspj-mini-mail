import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLogs } from '../context/LogContext';
import api from '../services/api';

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

  useEffect(() => {
    fetchStats();
    fetchThreads();
    fetchRecentLogs();
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
    <div dir="ltr" className="flex-1 bg-[#f8fafc] p-8 overflow-y-auto flex flex-col items-center text-left">
      <div className="w-full max-w-5xl space-y-8 animate-fade-in">

        {/* ── Hero greeting header ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Tableau de bord</h2>
            </div>
            <p className="text-slate-500 text-sm">Données analytiques et statistiques globales d'activité sur le serveur de messagerie.</p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-white border border-slate-200/60 rounded-xl px-3 py-2 shadow-sm">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card: Users */}
          <div className="group bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_0_rgb(0_0_0/_0.04),_0_1px_2px_-1px_rgb(0_0_0/_0.04)] hover:shadow-[0_8px_24px_-4px_rgb(59_130_246/_0.15)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
            <div className="h-px w-full bg-gradient-to-r from-blue-500 to-indigo-500" />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:bg-blue-500 group-hover:border-blue-500 group-hover:shadow-md group-hover:shadow-blue-500/25 transition-all duration-300">
                  <svg className="w-4 h-4 text-blue-500 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Comptes Utilisateurs</p>
              <p className="text-3xl font-bold tracking-tight text-slate-900 mt-1.5 tabular-nums">{stats.totalUsers}</p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">Profils enregistrés et habilités sur le réseau interne.</p>
            </div>
          </div>

          {/* Card: Discussions */}
          <div className="group bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_0_rgb(0_0_0/_0.04),_0_1px_2px_-1px_rgb(0_0_0/_0.04)] hover:shadow-[0_8px_24px_-4px_rgb(139_92_246/_0.15)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
            <div className="h-px w-full bg-gradient-to-r from-violet-500 to-purple-500" />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center group-hover:bg-violet-500 group-hover:border-violet-500 group-hover:shadow-md group-hover:shadow-violet-500/25 transition-all duration-300">
                  <svg className="w-4 h-4 text-violet-500 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Discussions Initiées</p>
              <p className="text-3xl font-bold tracking-tight text-slate-900 mt-1.5 tabular-nums">{stats.totalThreads}</p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">Fils de discussion distincts créés par les utilisateurs.</p>
            </div>
          </div>

          {/* Card: Messages */}
          <div className="group bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_0_rgb(0_0_0/_0.04),_0_1px_2px_-1px_rgb(0_0_0/_0.04)] hover:shadow-[0_8px_24px_-4px_rgb(16_185_129/_0.15)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
            <div className="h-px w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-500 group-hover:shadow-md group-hover:shadow-emerald-500/25 transition-all duration-300">
                  <svg className="w-4 h-4 text-emerald-500 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Messages Acheminés</p>
              <p className="text-3xl font-bold tracking-tight text-slate-900 mt-1.5 tabular-nums">{stats.totalMessagesSent}</p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">Volume total de messages transmis de bout en bout.</p>
            </div>
          </div>
        </div>

        {/* ── Threads surveillance table ── */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_0_rgb(0_0_0/_0.04),_0_4px_6px_-2px_rgb(0_0_0/_0.04)] hover:shadow-[0_4px_12px_-2px_rgb(0_0_0/_0.08)] transition-shadow duration-300 overflow-hidden">
          <div className="h-px w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
          <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-slate-900">Suivi des Discussions / Échanges</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">Dernières conversations surveillées sur la plateforme.</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Rechercher sujet, expéditeur..."
                value={threadSearch}
                onChange={(e) => setThreadSearch(e.target.value)}
                className="px-3 py-1.5 border border-slate-200/60 rounded-xl text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 w-48 md:w-56 transition bg-white"
              />
              <select
                value={threadStatusFilter}
                onChange={(e) => setThreadStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200/60 rounded-xl text-xs outline-none bg-white cursor-pointer w-36 focus:border-blue-400 transition"
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
                <tr className="bg-slate-50/80 border-b border-slate-100/80 text-slate-400 uppercase font-bold tracking-widest text-[10px]">
                  <th className="px-5 py-3.5">Sujet / Objet</th>
                  <th className="px-5 py-3.5">Expéditeur</th>
                  <th className="px-5 py-3.5">Destinataire</th>
                  <th className="px-5 py-3.5 text-center">Pièce Jointe</th>
                  <th className="px-5 py-3.5 text-center">Lecture</th>
                  <th className="px-5 py-3.5 text-center">Acheminement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 text-slate-600">
                {isThreadsLoading ? (
                  <tr><td colSpan="6"><div className="py-12 flex flex-col items-center gap-2"><div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin" /><p className="text-slate-400 text-xs mt-2">Chargement des discussions...</p></div></td></tr>
                ) : threadError ? (
                  <tr><td colSpan="6"><div className="py-12 flex flex-col items-center gap-2"><div className="p-4 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 shadow-sm flex items-center gap-2"><svg className="w-4 h-4 text-rose-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg><span>{threadError}</span></div></div></td></tr>
                ) : filteredThreads.length === 0 ? (
                  <tr><td colSpan="6"><div className="py-12 flex flex-col items-center gap-2"><p className="text-slate-400 text-xs">Aucune discussion ne correspond aux critères de recherche.</p></div></td></tr>
                ) : (
                  filteredThreads.map((t) => (
                    <tr key={t.id} className="hover:bg-blue-50/25 transition-colors duration-150">
                      <td className="px-5 py-4 font-semibold text-slate-800 max-w-xs truncate" title={t.objet}>{t.objet}</td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">{t.expediteur}</div>
                        <div className="text-[10px] text-slate-400 font-mono" dir="ltr">{t.expediteurEmail}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">{t.destinataire}</div>
                        <div className="text-[10px] text-slate-400 font-mono" dir="ltr">{t.destinataireEmail}</div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {t.hasAttachment ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-500">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.586 6.586a6 6 0 108.486 8.486L20 13" /></svg>
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold rounded-full border ${t.statutLecture === 'Lu' ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/80' : 'bg-indigo-50/80 text-indigo-700 border-indigo-200/80'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${t.statutLecture === 'Lu' ? 'bg-emerald-400' : 'bg-indigo-400 animate-pulse'}`} />
                          {t.statutLecture}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold rounded-full border ${t.statutAcheminement === 'En cours' ? 'bg-blue-50/80 text-blue-700 border-blue-200/80' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${t.statutAcheminement === 'En cours' ? 'bg-blue-400' : 'bg-slate-400'}`} />
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
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_0_rgb(0_0_0/_0.04),_0_4px_6px_-2px_rgb(0_0_0/_0.04)] hover:shadow-[0_4px_12px_-2px_rgb(0_0_0/_0.08)] transition-shadow duration-300 overflow-hidden">
          <div className="h-px w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500" />
          <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-slate-900">Dernières Activités Système</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Aperçu des 5 dernières entrées du journal d'audit.</p>
            </div>
            <button
              onClick={() => navigate('/audit-logs')}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-all duration-150 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Voir tout le journal
            </button>
          </div>

          {recentLogs === null ? (
            <div className="p-10 flex items-center justify-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin" />
              <span className="text-xs font-medium text-slate-400">Chargement des activités...</span>
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center gap-3">
              <p className="text-sm font-semibold text-slate-600">Aucune activité enregistrée</p>
              <p className="text-xs text-slate-400 mt-0.5">Les événements système apparaîtront ici dès qu'ils seront produits.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100/80 text-slate-400 uppercase font-bold tracking-widest text-[10px]">
                    <th className="px-5 py-3.5 w-44">Date / Heure</th>
                    <th className="px-5 py-3.5 w-36">Action</th>
                    <th className="px-5 py-3.5">Acteur</th>
                    <th className="px-5 py-3.5">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 text-slate-600">
                  {recentLogs.map((log) => {
                    const actionMeta = {
                      CREATE_USER:        { label: 'Création',      cls: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' },
                      SEND_MESSAGE:       { label: 'Envoi',         cls: 'bg-blue-50/80 text-blue-700 border-blue-200/80',         dot: 'bg-blue-500'    },
                      LOGIN:              { label: 'Connexion',     cls: 'bg-indigo-50/80 text-indigo-700 border-indigo-200/80',   dot: 'bg-indigo-500'  },
                      TOGGLE_USER_STATUS: { label: 'Statut',        cls: 'bg-amber-50/80 text-amber-700 border-amber-200/80',      dot: 'bg-amber-500'   },
                      DELETE_USER:        { label: 'Suppression',   cls: 'bg-rose-50/80 text-rose-700 border-rose-200/80',         dot: 'bg-rose-500'    },
                      UPLOAD_ATTACHMENT:  { label: 'Pièce jointe', cls: 'bg-teal-50/80 text-teal-700 border-teal-200/80',         dot: 'bg-teal-500'    },
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
                      <tr key={log.id} className="hover:bg-violet-50/20 transition-colors duration-150">
                        <td className="px-5 py-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">{ts}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold border ${meta.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 shadow-sm ${meta.dot}`} />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-700 whitespace-nowrap font-mono text-[11px]">{log.utilisateur}</td>
                        <td className="px-5 py-4 text-slate-500 leading-relaxed max-w-xs truncate" title={log.description}>{log.description}</td>
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
  );
}
