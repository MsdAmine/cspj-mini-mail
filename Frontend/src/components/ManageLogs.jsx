import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function ManageLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionType, setSelectedActionType] = useState('ALL');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get('/admin/audit-logs');
        setLogs(response.data || []);
      } catch (err) {
        console.error("Erreur lors de la récupération des logs d'audit :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);


  // Filter logs based on search and action type
  const filteredLogs = logs.filter(log => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = !query || 
      log.utilisateur?.toLowerCase().includes(query) ||
      log.description?.toLowerCase().includes(query) ||
      log.typeAction?.toLowerCase().includes(query);

    const matchesAction = selectedActionType === 'ALL' || log.typeAction === selectedActionType;

    return matchesQuery && matchesAction;
  });

  // Get unique action types for filter dropdown
  const actionTypes = ['ALL', ...new Set(logs.map(log => log.typeAction))];

  const formatTimestamp = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Action meta: badge class + dot color + French label
  const ACTION_META = {
    CREATE_USER:        { label: 'Création',      cls: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500 shadow-emerald-500/50' },
    SEND_MESSAGE:       { label: 'Envoi',          cls: 'bg-blue-50/80 text-blue-700 border-blue-200/80',         dot: 'bg-blue-500 shadow-blue-500/50'     },
    LOGIN:              { label: 'Connexion',       cls: 'bg-indigo-50/80 text-indigo-700 border-indigo-200/80',   dot: 'bg-indigo-500 shadow-indigo-500/50' },
    TOGGLE_USER_STATUS: { label: 'Statut',          cls: 'bg-amber-50/80 text-amber-700 border-amber-200/80',      dot: 'bg-amber-500 shadow-amber-500/50'   },
    DELETE_USER:        { label: 'Suppression',     cls: 'bg-rose-50/80 text-rose-700 border-rose-200/80',         dot: 'bg-rose-500 shadow-rose-500/50'     },
    UPLOAD_ATTACHMENT:  { label: 'Pièce jointe',   cls: 'bg-teal-50/80 text-teal-700 border-teal-200/80',         dot: 'bg-teal-500 shadow-teal-500/50'     },
    ARCHIVE_DISCUSSION: { label: 'Archivage',       cls: 'bg-slate-100 text-slate-600 border-slate-200',           dot: 'bg-slate-400'                        },
  };

  const getActionMeta = (actionType) =>
    ACTION_META[actionType] || {
      label: actionType,
      cls: 'bg-slate-50 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
    };

  return (
    <div dir="ltr" className="flex-1 overflow-y-auto p-8 flex flex-col items-center bg-[#f8fafc] text-left">
    <div className="w-full max-w-6xl space-y-6 animate-fade-in pb-12 text-left">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/25 flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-none">Journal d'Audit &amp; Sécurité</h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Historique chronologique des événements système et actions d'administration.
            </p>
          </div>
        </div>
        {/* Live entry counter pill */}
        {!loading && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-600 shadow-sm flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {filteredLogs.length} entrée{filteredLogs.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* ── Filter and Search Bar ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_0_rgb(0_0_0/_0.04),_0_1px_2px_-1px_rgb(0_0_0/_0.04)] flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Rechercher par email, action ou description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition duration-150"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="w-full md:w-60">
          <select
            value={selectedActionType}
            onChange={(e) => setSelectedActionType(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-200/60 rounded-xl bg-white text-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition duration-150 cursor-pointer"
          >
            {actionTypes.map(type => (
              <option key={type} value={type}>
                {type === 'ALL' ? 'Toutes les actions' : type}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filter Button */}
        {(searchQuery || selectedActionType !== 'ALL') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedActionType('ALL');
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer flex items-center justify-center active:scale-[0.98] duration-150"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* ── Floating Data Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_0_rgb(0_0_0/_0.04),_0_4px_6px_-2px_rgb(0_0_0/_0.04)] overflow-hidden hover:shadow-[0_4px_12px_-2px_rgb(0_0_0/_0.08)] transition-shadow duration-300">

        {/* Prismatic accent bar */}
        <div className="h-px w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500" />

        {/* Card inner header */}
        <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Événements enregistrés</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {!loading && `${filteredLogs.length} / ${logs.length}`}
          </span>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin" />
            <p className="text-slate-400 text-xs font-medium">Chargement des journaux...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center">
              <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-700 text-sm">Aucun log trouvé</h3>
              <p className="text-slate-400 text-xs mt-1">Ajustez vos filtres de recherche ou réinitialisez le champ.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100/80 text-slate-400 uppercase font-bold tracking-widest text-[10px]">
                  <th className="px-5 py-3.5 w-44">Date / Heure</th>
                  <th className="px-5 py-3.5 w-44">Action</th>
                  <th className="px-5 py-3.5 w-52">Utilisateur</th>
                  <th className="px-5 py-3.5">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 text-slate-600">
                {filteredLogs.map((log, idx) => {
                  const meta = getActionMeta(log.typeAction);
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-indigo-50/20 transition-colors duration-150"
                    >
                      {/* Timestamp */}
                      <td className="px-5 py-4 font-mono font-medium text-slate-500 whitespace-nowrap text-[11px]">
                        {formatTimestamp(log.dateHeure)}
                      </td>

                      {/* Action Type Badge */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold border ${meta.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 shadow-sm ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </td>

                      {/* User Email */}
                      <td className="px-5 py-4 font-medium text-slate-700 whitespace-nowrap font-mono text-[11px]">
                        {log.utilisateur}
                      </td>

                      {/* Description */}
                      <td className="px-5 py-4 text-slate-500 font-normal leading-relaxed max-w-sm">
                        {log.description}
                      </td>
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
