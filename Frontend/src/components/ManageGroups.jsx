import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLogs } from '../context/LogContext';
import { 
  Users, Search, RefreshCw, Archive, Trash2, 
  UserCheck, Shield, Eye, X, Check, AlertTriangle, 
  UserX, ArrowRightLeft, Clock, Calendar 
} from 'lucide-react';

const initials = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return '?';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getRoleBadge = (role) => {
  const r = (role || '').toLowerCase();
  if (r.includes('admin'))
    return {
      label: 'Administrateur',
      className: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60',
      dot: 'bg-blue-500',
    };
  if (r.includes('assoc'))
    return {
      label: 'Association',
      className: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60',
      dot: 'bg-amber-500',
    };
  return {
    label: 'Fonctionnaire',
    className: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    dot: 'bg-emerald-500',
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GroupDetailsModal
// ─────────────────────────────────────────────────────────────────────────────
function GroupDetailsModal({ group, onClose, onGroupArchived, onMemberRemoved }) {
  const [removingUserId, setRemovingUserId] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [error, setError] = useState('');
  const [localGroup, setLocalGroup] = useState(group);

  const [transferring, setTransferring] = useState(false);
  const [showTransferSelect, setShowTransferSelect] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState('');

  useEffect(() => setLocalGroup(group), [group]);

  const handleTransferOwnership = async () => {
    if (!newOwnerId) return;
    setTransferring(true);
    setError('');
    try {
      await api.put(`/admin/groups/${localGroup.id}/transfer-owner`, { newOwnerId: parseInt(newOwnerId) });
      const newOwner = localGroup.participants.find(p => p.id === parseInt(newOwnerId));
      if (newOwner) {
        setLocalGroup(prev => ({
          ...prev,
          createdBy: {
            name: newOwner.name,
            email: newOwner.email,
            role: newOwner.role
          }
        }));
      }
      setShowTransferSelect(false);
      setNewOwnerId('');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Erreur lors du transfert de propriété."
      );
    } finally {
      setTransferring(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    setRemovingUserId(userId);
    setError('');
    try {
      await api.delete(`/admin/groups/${localGroup.id}/members/${userId}`);
      const updated = {
        ...localGroup,
        participants: localGroup.participants.filter((p) => p.id !== userId),
        participantCount: localGroup.participantCount - 1,
      };
      setLocalGroup(updated);
      onMemberRemoved(localGroup.id, userId);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          'Erreur lors du retrait du membre.'
      );
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleArchiveGroup = async () => {
    setArchiving(true);
    setError('');
    try {
      await api.delete(`/admin/groups/${localGroup.id}`);
      onGroupArchived(localGroup.id);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Erreur lors de l'archivage du groupe."
      );
      setArchiving(false);
    }
  };

  const creatorName = localGroup.createdBy?.name || 'Inconnu';
  const creatorEmail = localGroup.createdBy?.email || '';
  const badge = getRoleBadge(localGroup.createdBy?.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-xs">
              <Users className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-slate-800 text-sm truncate max-w-xs">
                {localGroup.subject || 'Groupe sans titre'}
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                {localGroup.participantCount} participant{localGroup.participantCount !== 1 ? 's' : ''} · {formatDate(localGroup.createdAt)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={archiving}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Creator Info Card */}
        <div className="px-6 pt-4 flex-shrink-0">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white font-bold text-xs flex items-center justify-center uppercase">
                {initials(creatorName)}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-800 truncate">Créateur : {creatorName}</p>
                <p className="text-[11px] text-slate-400 font-mono truncate">{creatorEmail}</p>
              </div>
              <span className={badge.className}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {badge.label}
              </span>
            </div>

            {!showTransferSelect ? (
              <button
                onClick={() => setShowTransferSelect(true)}
                className="text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors flex-shrink-0 cursor-pointer"
              >
                Changer de propriétaire
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <select
                  value={newOwnerId}
                  onChange={(e) => setNewOwnerId(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700"
                >
                  <option value="">Sélectionner...</option>
                  {(localGroup.participants || []).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleTransferOwnership}
                  disabled={transferring || !newOwnerId}
                  className="text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 px-2.5 py-1 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  OK
                </button>
                <button
                  onClick={() => { setShowTransferSelect(false); setNewOwnerId(''); }}
                  className="text-xs text-slate-600 hover:bg-slate-200 px-2 py-1 rounded-lg"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        {/* Participants List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Membres du groupe ({localGroup.participants?.length ?? 0})
          </span>

          <div className="space-y-1.5">
            {(localGroup.participants || []).map(p => {
              const pBadge = getRoleBadge(p.role);
              const isRemoving = removingUserId === p.id;
              const isCreator = p.email === creatorEmail;

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] uppercase">
                      {initials(p.name)}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{p.email}</p>
                    </div>
                    <span className={pBadge.className}>
                      {pBadge.label}
                    </span>
                  </div>

                  {!isCreator && (
                    <button
                      onClick={() => handleRemoveMember(p.id)}
                      disabled={isRemoving}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Retirer du groupe"
                    >
                      {isRemoving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={archiving}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            Fermer
          </button>

          {!confirmArchive ? (
            <button
              type="button"
              onClick={() => setConfirmArchive(true)}
              disabled={archiving || localGroup.isArchived}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{localGroup.isArchived ? 'Déjà archivé' : 'Archiver le groupe'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-rose-700">Confirmer ?</span>
              <button
                type="button"
                onClick={() => setConfirmArchive(false)}
                className="px-3 py-1.5 text-xs text-slate-600 bg-white rounded-lg border border-slate-200"
              >
                Non
              </button>
              <button
                type="button"
                onClick={handleArchiveGroup}
                disabled={archiving}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                {archiving ? 'Archivage...' : 'Oui, archiver'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ManageGroups Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ManageGroups() {
  const { user: currentUser } = useAuth();
  const { addLog } = useLogs();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/groups');
      setGroups(res.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des groupes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const handleMemberRemoved = (groupId, userId) => {
    setGroups(prev =>
      prev.map(g =>
        g.id === groupId
          ? { ...g, participants: g.participants.filter(p => p.id !== userId), participantCount: g.participantCount - 1 }
          : g
      )
    );
    setSuccess('Membre retiré du groupe avec succès.');
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleGroupArchivedFromModal = (groupId) => {
    setGroups(prev => prev.map(g => (g.id === groupId ? { ...g, isArchived: true } : g)));
    setSuccess('Le groupe a été archivé avec succès.');
    setTimeout(() => setSuccess(''), 4000);
  };

  const filteredGroups = groups.filter(g => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (g.subject || '').toLowerCase().includes(q) ||
      (g.createdBy?.name || '').toLowerCase().includes(q) ||
      (g.createdBy?.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div dir="ltr" className="flex-1 flex flex-col h-full bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">
      
      {/* ── Top Header ── */}
      <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-6 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Gestion des Groupes</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wider">
                Groupes ({filteredGroups.length})
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Supervision des groupes d'échange, membres et transfert de propriété
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchGroups}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Actualiser la liste"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </header>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Alerts */}
          {error && (
            <div className="p-3.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Search Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par titre de groupe ou créateur..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 placeholder:text-slate-400 transition-all"
              />
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Groupes de discussion actifs</span>
              <span className="text-xs text-slate-400 font-mono">{filteredGroups.length} groupes</span>
            </div>

            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-xs font-medium">Chargement des groupes en cours…</p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center gap-2 text-center text-slate-400">
                <Users className="w-8 h-8 text-slate-300" />
                <h3 className="font-semibold text-slate-700 text-sm">Aucun groupe trouvé</h3>
                <p className="text-xs text-slate-400">{searchQuery ? 'Ajustez vos filtres de recherche.' : "Aucun groupe créé."}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 uppercase font-bold tracking-wider text-[10px]">
                      <th className="px-6 py-3.5">Nom du groupe</th>
                      <th className="px-6 py-3.5">Créé par</th>
                      <th className="px-6 py-3.5 text-center">Participants</th>
                      <th className="px-6 py-3.5">Date de création</th>
                      <th className="px-6 py-3.5 text-center">Statut</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {filteredGroups.map((g) => {
                      const badge = getRoleBadge(g.createdBy?.role);
                      return (
                        <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-700 border border-violet-200/80 flex items-center justify-center text-xs font-bold">
                                <Users className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-semibold text-slate-900">{g.subject || 'Groupe sans titre'}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-800">{g.createdBy?.name || 'Inconnu'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{g.createdBy?.email}</div>
                          </td>

                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                              <Users className="w-3 h-3 text-slate-400" />
                              {g.participantCount} membre{g.participantCount !== 1 ? 's' : ''}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                            {formatDate(g.createdAt)}
                          </td>

                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                              g.isArchived 
                                ? 'bg-slate-100 text-slate-600 border-slate-200' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${g.isArchived ? 'bg-slate-400' : 'bg-emerald-500'}`} />
                              {g.isArchived ? 'Archivé' : 'Actif'}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setSelectedGroup(g)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-400" />
                              <span>Gérer</span>
                            </button>
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

      {/* Group Details Modal */}
      {selectedGroup && (
        <GroupDetailsModal
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onGroupArchived={handleGroupArchivedFromModal}
          onMemberRemoved={handleMemberRemoved}
        />
      )}
    </div>
  );
}
