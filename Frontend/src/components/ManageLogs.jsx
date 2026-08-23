import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Shield, Search, RefreshCw, Filter, Clock, Activity } from 'lucide-react';

export default function ManageLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionType, setSelectedActionType] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/audit-logs');
      setLogs(response.data || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des logs d'audit :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = !query || 
      log.utilisateur?.toLowerCase().includes(query) ||
      log.description?.toLowerCase().includes(query) ||
      log.typeAction?.toLowerCase().includes(query);

    const matchesAction = selectedActionType === 'ALL' || log.typeAction === selectedActionType;

    return matchesQuery && matchesAction;
  });

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

  const ACTION_META = {
    CREATE_USER:        { label: 'Création',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' },
    SEND_MESSAGE:       { label: 'Envoi',         cls: 'bg-blue-50 text-blue-700 border-blue-200/80',         dot: 'bg-blue-500'    },
    LOGIN:              { label: 'Connexion',     cls: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',   dot: 'bg-indigo-500'  },
    TOGGLE_USER_STATUS: { label: 'Statut',        cls: 'bg-amber-50 text-amber-700 border-amber-200/80',      dot: 'bg-amber-500'   },
    DELETE_USER:        { label: 'Suppression',   cls: 'bg-rose-50 text-rose-700 border-rose-200/80',         dot: 'bg-rose-500'    },
    UPLOAD_ATTACHMENT:  { label: 'Pièce jointe', cls: 'bg-teal-50 text-teal-700 border-teal-200/80',         dot: 'bg-teal-500'    },
    ARCHIVE_DISCUSSION: { label: 'Archivage',     cls: 'bg-slate-100 text-slate-600 border-slate-200',           dot: 'bg-slate-400'   },
  };

  const getActionMeta = (actionType) =>
    ACTION_META[actionType] || {
      label: actionType,
      cls: 'bg-slate-50 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
    };

  return (
    <div dir="ltr" className="flex-1 flex flex-col h-full bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">
      
      {/* ── Top Header ── */}
      <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-6 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Journal d'Audit & Sécurité</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wider">
                {filteredLogs.length} événements
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Historique chronologique des événements système et actions d'administration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Actualiser les logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </header>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Search & Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par email, action ou description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 placeholder:text-slate-400 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedActionType}
                onChange={(e) => setSelectedActionType(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:border-blue-600"
              >
                {actionTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'ALL' ? 'Toutes les actions' : type}
                  </option>
                ))}
              </select>

              {(searchQuery || selectedActionType !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedActionType('ALL');
                  }}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Événements de sécurité enregistrés</span>
              <span className="text-xs text-slate-400 font-mono">{filteredLogs.length} entrées</span>
            </div>

            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-xs font-medium">Chargement des journaux d'audit...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center gap-2 text-center text-slate-400">
                <Shield className="w-8 h-8 text-slate-300" />
                <h3 className="font-semibold text-slate-700 text-sm">Aucun événement trouvé</h3>
                <p className="text-xs text-slate-400">Ajustez vos filtres de recherche.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 uppercase font-bold tracking-wider text-[10px]">
                      <th className="px-6 py-3.5 w-44">Date / Heure</th>
                      <th className="px-6 py-3.5 w-40">Action</th>
                      <th className="px-6 py-3.5 w-52">Utilisateur</th>
                      <th className="px-6 py-3.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {filteredLogs.map((log) => {
                      const meta = getActionMeta(log.typeAction);
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                            {formatTimestamp(log.dateHeure)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${meta.cls}`}>
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-800 whitespace-nowrap font-mono text-[11px]">
                            {log.utilisateur}
                          </td>
                          <td className="px-6 py-4 text-slate-600 leading-relaxed">
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
    </div>
  );
}
