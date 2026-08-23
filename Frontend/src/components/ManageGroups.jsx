import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLogs } from '../context/LogContext';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
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
      className:
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50/80 text-blue-700 border border-blue-200/80',
      dot: 'bg-blue-500',
    };
  if (r.includes('assoc'))
    return {
      label: 'Association',
      className:
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50/80 text-amber-700 border border-amber-200/80',
      dot: 'bg-amber-500',
    };
  return {
    label: 'Fonctionnaire',
    className:
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50/80 text-emerald-700 border border-emerald-200/80',
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
      setConfirmArchive(false);
    }
  };

  const creatorName = localGroup.createdBy?.name || 'Inconnu';
  const creatorRole = localGroup.createdBy?.role || '';
  const creatorEmail = localGroup.createdBy?.email || '';
  const badge = getRoleBadge(creatorRole);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-violet-700 to-indigo-700 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shadow-inner flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-white text-sm leading-tight truncate max-w-xs">
                {localGroup.subject || 'Groupe sans titre'}
              </h3>
              <p className="text-violet-200 text-[11px] mt-0.5">
                {localGroup.participantCount} participant{localGroup.participantCount !== 1 ? 's' : ''} · {formatDate(localGroup.createdAt)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={archiving}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all duration-150 cursor-pointer active:scale-95 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Creator info */}
        <div className="px-6 pt-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 bg-slate-50/80 border border-slate-200/60 rounded-xl">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 uppercase shadow-sm">
                {initials(creatorName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                  Créé par : {creatorName}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">{creatorEmail}</p>
              </div>
              <span className={badge.className}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${badge.dot}`} />
                {badge.label}
              </span>
            </div>
            
            {!showTransferSelect ? (
              <button
                onClick={() => setShowTransferSelect(true)}
                className="text-[10px] font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 px-2.5 py-1.5 rounded-lg border border-violet-200 transition-colors flex-shrink-0 cursor-pointer active:scale-95"
              >
                Transfer Owner <span className="opacity-60">/ تغيير المشرف</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-shrink-0">
                <select
                  value={newOwnerId}
                  onChange={(e) => setNewOwnerId(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-violet-400 bg-white text-slate-700"
                >
                  <option value="">Sélectionner...</option>
                  {(localGroup.participants || []).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleTransferOwnership}
                  disabled={transferring || !newOwnerId}
                  className="text-[10px] font-semibold text-white bg-violet-500 hover:bg-violet-600 px-2.5 py-1.5 rounded-lg disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {transferring ? '...' : 'Valider'}
                </button>
                <button
                  onClick={() => { setShowTransferSelect(false); setNewOwnerId(''); }}
                  className="text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg cursor-pointer active:scale-95 border border-slate-200"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 flex-shrink-0 p-3 rounded-xl bg-rose-50 border border-rose-200/60 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Participants list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Participants ({localGroup.participants?.length ?? 0})
            </span>
          </div>

          {localGroup.participants?.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-xs text-slate-400 font-medium">Aucun participant actif dans ce groupe.</p>
            </div>
          ) : (
            <div className="border border-slate-200/60 rounded-xl bg-white shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100/80">
                {(localGroup.participants || []).map((p) => {
                  const pb = getRoleBadge(p.role);
                  const isRemoving = removingUserId === p.id;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors duration-100 group"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 uppercase shadow-sm group-hover:from-violet-500 group-hover:to-indigo-600 transition-all duration-200">
                        {initials(p.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{p.name}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">{p.email}</p>
                      </div>
                      <span className={pb.className}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pb.dot}`} />
                        {pb.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(p.id)}
                        disabled={isRemoving || archiving}
                        title="Retirer ce membre du groupe"
                        className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-500 bg-rose-50/80 hover:bg-rose-500 hover:text-white rounded-lg transition-all duration-150 border border-rose-200/60 hover:border-rose-500 cursor-pointer active:scale-[0.97] text-[10px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
                      >
                        {isRemoving ? (
                          <div className="w-3 h-3 border border-rose-300 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h15v-1a6 6 0 00-6-6h-3zM20 13l-3 3m0 0l-3-3m3 3V6" />
                          </svg>
                        )}
                        Retirer <span className="hidden sm:inline opacity-60">/ إزالة</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer — archive group */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={archiving}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-all duration-150 cursor-pointer active:scale-[0.98]"
          >
            Fermer
          </button>

          {!confirmArchive ? (
            <button
              type="button"
              onClick={() => setConfirmArchive(true)}
              disabled={archiving || localGroup.isArchived}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-md shadow-rose-500/20 transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {localGroup.isArchived ? 'Déjà archivé' : 'Supprimer le groupe'}
              <span className="hidden sm:inline opacity-60 font-normal text-[10px]">/ حذف</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-rose-700">Confirmer l'archivage ?</span>
              <button
                type="button"
                onClick={() => setConfirmArchive(false)}
                disabled={archiving}
                className="px-3 py-1.5 text-[10px] font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleArchiveGroup}
                disabled={archiving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg cursor-pointer active:scale-[0.98] disabled:opacity-60"
              >
                {archiving ? (
                  <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />Archivage&hellip;</>
                ) : (
                  <>Confirmer</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ManageGroups
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
  const [deletingGroup, setDeletingGroup] = useState(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/groups');
      setGroups(res.data || []);
    } catch (err) {
      const status = err.response?.status;
      if (!err.response) {
        setError("L'API n'a pas pu être contactée.");
      } else if (status === 401 || status === 403) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else {
        setError(
          err.response?.data?.message ||
            err.response?.data ||
            'Une erreur serveur est survenue lors du chargement des groupes.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const handleMemberRemoved = (groupId, userId) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, participants: g.participants.filter((p) => p.id !== userId), participantCount: g.participantCount - 1 }
          : g
      )
    );
    setSelectedGroup((prev) =>
      prev && prev.id === groupId
        ? { ...prev, participants: prev.participants.filter((p) => p.id !== userId), participantCount: prev.participantCount - 1 }
        : prev
    );
    addLog('REMOVE_GROUP_MEMBER', `Membre retiré du groupe ID ${groupId}.`, currentUser?.email);
    setSuccess('Membre retiré du groupe avec succès.');
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleGroupArchivedFromModal = (groupId) => {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, isArchived: true } : g)));
    addLog('ARCHIVE_GROUP', `Groupe ID ${groupId} archivé.`, currentUser?.email);
    setSuccess('Le groupe a été archivé avec succès.');
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingGroup) return;
    setIsDeleteLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.delete(`/admin/groups/${deletingGroup.id}`);
      addLog('ARCHIVE_GROUP', `Groupe "${deletingGroup.subject}" archivé.`, currentUser?.email);
      setGroups((prev) =>
        prev.map((g) => (g.id === deletingGroup.id ? { ...g, isArchived: true } : g))
      );
      setSuccess(`Le groupe "${deletingGroup.subject}" a été archivé.`);
      setDeletingGroup(null);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          'Une erreur est survenue lors de la suppression du groupe.'
      );
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const filteredGroups = groups.filter((g) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (g.subject || '').toLowerCase().includes(q) ||
      (g.createdBy?.name || '').toLowerCase().includes(q) ||
      (g.createdBy?.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div dir="ltr" className="flex-1 overflow-y-auto p-8 flex flex-col items-center bg-[#f8fafc] text-left">
      <div className="w-full max-w-6xl space-y-6 pb-12 text-left">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/25 flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-none">Gestion des Groupes</h2>
              <p className="text-slate-500 text-xs mt-0.5">
                إدارة المجموعات &middot; Visualisez, gérez et archivez les discussions de groupe.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!loading && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-600 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                {filteredGroups.length} groupe{filteredGroups.length !== 1 ? 's' : ''}
              </div>
            )}
            <button
              onClick={fetchGroups}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
              </svg>
              Actualiser
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_0_rgb(0_0_0/_0.04)] flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              id="group-search"
              placeholder="Rechercher par sujet, créateur ou email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-50 outline-none transition duration-150"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer active:scale-[0.98] duration-150"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_0_rgb(0_0_0/_0.04),_0_4px_6px_-2px_rgb(0_0_0/_0.04)] overflow-hidden hover:shadow-[0_4px_12px_-2px_rgb(0_0_0/_0.08)] transition-shadow duration-300">
          <div className="h-px w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500" />
          <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Répertoire des groupes</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {!loading && `${filteredGroups.length} / ${groups.length}`}
            </span>
          </div>

          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 rounded-full border-2 border-violet-200 border-t-violet-500 animate-spin" />
              <p className="text-slate-400 text-xs font-medium">Chargement des groupes en cours&hellip;</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center">
                <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 text-sm">Aucun groupe trouvé</h3>
                <p className="text-slate-400 text-xs mt-1">
                  {searchQuery ? 'Ajustez vos filtres.' : "Aucune discussion de groupe n'existe dans le système."}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100/80 text-slate-400 uppercase font-bold tracking-widest text-[10px]">
                    <th className="px-5 py-3.5">Sujet du groupe</th>
                    <th className="px-5 py-3.5">Créateur</th>
                    <th className="px-5 py-3.5 text-center">Participants</th>
                    <th className="px-5 py-3.5">Date de création</th>
                    <th className="px-5 py-3.5 text-center">Statut</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 text-slate-600">
                  {filteredGroups.map((g) => {
                    const creatorBadge = getRoleBadge(g.createdBy?.role);
                    return (
                      <tr key={g.id} className="hover:bg-violet-50/25 transition-colors duration-150 group">
                        {/* Subject */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 text-white font-bold text-sm flex items-center justify-center shadow-sm flex-shrink-0 uppercase group-hover:from-violet-500 group-hover:to-indigo-500 transition-all duration-200">
                              {(g.subject || 'G').charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate max-w-[200px] leading-tight">
                                {g.subject || '(Sans titre)'}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID #{g.id}</p>
                            </div>
                          </div>
                        </td>

                        {/* Creator */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-800 truncate max-w-[160px]">
                              {g.createdBy?.name || 'Inconnu'}
                            </p>
                            <span className={creatorBadge.className}>
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${creatorBadge.dot}`} />
                              {creatorBadge.label}
                            </span>
                          </div>
                        </td>

                        {/* Participant count */}
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold shadow-sm">
                            {g.participantCount}
                          </span>
                        </td>

                        {/* Creation date */}
                        <td className="px-5 py-4">
                          <span className="text-xs font-medium text-slate-600">{formatDate(g.createdAt)}</span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 text-center">
                          {g.isArchived ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Archivé
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50/80 text-emerald-700 border border-emerald-200/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Actif
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              id={`details-group-${g.id}`}
                              onClick={() => setSelectedGroup(g)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-indigo-600 bg-indigo-50/80 hover:bg-indigo-600 hover:text-white rounded-xl transition-all duration-150 border border-indigo-200/80 hover:border-indigo-600 cursor-pointer active:scale-[0.98] hover:shadow-md hover:shadow-indigo-500/20 text-xs font-semibold"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Détails
                              <span className="hidden lg:inline text-[10px] opacity-60 font-normal">/ التفاصيل</span>
                            </button>

                            <button
                              type="button"
                              id={`delete-group-${g.id}`}
                              onClick={() => setDeletingGroup(g)}
                              disabled={g.isArchived}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-600 bg-rose-50/80 hover:bg-rose-500 hover:text-white rounded-xl transition-all duration-150 border border-rose-200/80 hover:border-rose-500 cursor-pointer active:scale-[0.98] hover:shadow-md hover:shadow-rose-500/20 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Supprimer
                              <span className="hidden lg:inline text-[10px] opacity-60 font-normal">/ حذف</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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

        {/* Delete Confirmation Modal */}
        {deletingGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-slate-900/40">
            <div className="w-full max-w-md bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden m-4">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Confirmation d'archivage</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Cette action masquera le groupe pour tous les membres</p>
                  </div>
                </div>
                <button
                  onClick={() => setDeletingGroup(null)}
                  disabled={isDeleteLoading}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150 cursor-pointer active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                  Êtes-vous sûr de vouloir archiver le groupe{' '}
                  <strong className="text-slate-900">« {deletingGroup.subject} »</strong> ?
                </p>
                <div className="p-4 bg-rose-50/80 text-rose-900 border border-rose-100 rounded-xl text-xs leading-relaxed space-y-2">
                  <p className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-rose-700">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Conséquences :
                  </p>
                  <ul className="list-disc pl-4 space-y-1 font-medium text-[11px] text-rose-800">
                    <li>Le groupe sera marqué comme archivé.</li>
                    <li>Il disparaîtra de la vue des {deletingGroup.participantCount} participant(s).</li>
                    <li>Les messages et pièces jointes seront conservés en base de données.</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/60 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeletingGroup(null)}
                  disabled={isDeleteLoading}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-xl transition-all duration-150 border border-slate-200 cursor-pointer active:scale-[0.98]"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleteLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-md shadow-rose-500/20 transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
                >
                  {isDeleteLoading ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Archivage&hellip;</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>Confirmer l'archivage</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
