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

  const getActionBadgeColor = (actionType) => {
    switch (actionType) {
      case 'SEND_MESSAGE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'TOGGLE_USER_STATUS':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'UPLOAD_ATTACHMENT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-250';
      case 'DELETE_USER':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'ARCHIVE_DISCUSSION':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getActionDotColor = (actionType) => {
    switch (actionType) {
      case 'SEND_MESSAGE':      return 'bg-blue-500';
      case 'TOGGLE_USER_STATUS': return 'bg-amber-500';
      case 'UPLOAD_ATTACHMENT': return 'bg-emerald-500';
      case 'DELETE_USER':       return 'bg-rose-500';
      case 'ARCHIVE_DISCUSSION': return 'bg-slate-400';
      default:                  return 'bg-slate-400';
    }
  };

  return (
    <div dir="ltr" className="w-full max-w-6xl space-y-6 animate-fade-in pb-12 text-left">

      {/* ── Page Header ── */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-blue-600" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Journal d'Audit &amp; Sécurité</h2>
          </div>
          <p className="text-slate-500 text-xs mt-1 ml-3">
            Historique chronologique des événements de sécurité et actions d'administration de la plateforme (sans contenu de message).
          </p>
        </div>
        {/* Live counter pill */}
        {!loading && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-600 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {filteredLogs.length} entrée{filteredLogs.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* ── Filter and Search Bar ── */}
      <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3">
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
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition duration-150"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="w-full md:w-60">
          <select
            value={selectedActionType}
            onChange={(e) => setSelectedActionType(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition duration-150 cursor-pointer"
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
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer flex items-center justify-center active:scale-95 duration-150"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* ── Table Container ── */}
      <div className="bg-white/90 backdrop-blur-md rounded-xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">

        {/* Accent top bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500" />

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-4">
            <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-slate-400 text-xs font-medium">Chargement des journaux...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center">
            <svg className="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="font-semibold text-slate-700 text-sm">Aucun log trouvé</h3>
            <p className="text-slate-400 text-xs mt-1">
              Ajustez vos filtres de recherche ou réinitialisez le champ.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 uppercase font-bold tracking-widest text-[10px]">
                  <th className="px-4 py-3 w-44">Date / Heure</th>
                  <th className="px-4 py-3 w-48">Type d'Action</th>
                  <th className="px-4 py-3 w-52">Utilisateur</th>
                  <th className="px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredLogs.map((log, idx) => (
                  <tr
                    key={log.id}
                    className={`hover:bg-blue-50/30 transition-colors duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                  >
                    {/* Timestamp */}
                    <td className="px-4 py-3 font-mono font-medium text-slate-500 whitespace-nowrap">
                      {formatTimestamp(log.dateHeure)}
                    </td>

                    {/* Action Type Badge */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider font-mono ${getActionBadgeColor(log.typeAction)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getActionDotColor(log.typeAction)}`} />
                        {log.typeAction}
                      </span>
                    </td>

                    {/* User Email */}
                    <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                      {log.utilisateur}
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3 text-slate-600 font-normal leading-relaxed">
                      {log.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
