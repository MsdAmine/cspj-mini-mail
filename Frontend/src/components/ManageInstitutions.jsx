import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLogs } from '../context/LogContext';
import CreateInstitutionModal from './CreateInstitutionModal';

// ── Delete Confirmation Modal ─────────────────────────────────────────────────
function DeleteConfirmModal({ institution, onCancel, onConfirm, loading }) {
  if (!institution) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-slate-900/40 animate-fade-in p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden">
        <div className="h-px w-full bg-gradient-to-r from-rose-500 via-red-500 to-orange-400" />

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Supprimer la structure</h3>
            <p className="text-xs text-slate-400 mt-0.5">Cette action est irréversible.</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-slate-700">
            Vous êtes sur le point de supprimer{' '}
            <span className="font-bold text-slate-900">"{institution.nom}"</span>.
          </p>
          {institution.utilisateursCount > 0 ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 flex items-start gap-2">
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>
                Cette structure compte <strong>{institution.utilisateursCount} membre(s)</strong> actif(s).
                La suppression sera bloquée par le serveur — réaffectez-les d'abord.
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Aucun membre n'est rattaché à cette structure. La suppression peut être effectuée.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/60 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 rounded-xl shadow-md shadow-rose-500/20 transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Suppression...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Confirmer la suppression
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ManageInstitutions() {
  const { user: currentUser } = useAuth();
  const { addLog } = useLogs();

  const [institutions, setInstitutions]           = useState([]);
  const [users, setUsers]                         = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [error, setError]                         = useState('');
  const [success, setSuccess]                     = useState('');
  const [searchQuery, setSearchQuery]             = useState('');

  // Create / Edit modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState(null);

  // Delete modal
  const [deletingInstitution, setDeletingInstitution] = useState(null);
  const [deleteLoading, setDeleteLoading]           = useState(false);

  const fetchInstitutionsAndUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const [institutionsRes, usersRes] = await Promise.all([
        api.get('/admin/institutions'),
        api.get('/admin/users'),
      ]);
      setInstitutions(institutionsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data || err.message;
      console.error(`[ManageInstitutions] fetch failed — HTTP ${status ?? 'N/A'}:`, detail);
      setError(`Erreur lors du chargement des données (HTTP ${status ?? 'ERR'}).`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutionsAndUsers();
  }, []);

  const getMemberCount = (institution) => {
    if (typeof institution.utilisateursCount === 'number') return institution.utilisateursCount;
    if (!users || !Array.isArray(users)) return institution.membresCount || 0;
    return users.filter(
      (u) => u.institutionId === institution.id || u.institutionNom === institution.nom,
    ).length;
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleOpenEdit = (institution) => {
    setEditingInstitution(institution);
    setIsCreateModalOpen(true);
  };

  const handleCreateModalClose = () => {
    setIsCreateModalOpen(false);
    // Delay clearing so the modal exit animation can play
    setTimeout(() => setEditingInstitution(null), 200);
  };

  const handleCreateSuccess = () => {
    fetchInstitutionsAndUsers();
    setSuccess(editingInstitution ? 'Institution mise à jour avec succès !' : 'Institution créée avec succès !');
    setTimeout(() => setSuccess(''), 3500);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deletingInstitution) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/institutions/${deletingInstitution.id}`);
      setDeletingInstitution(null);
      await fetchInstitutionsAndUsers();
      setSuccess('Structure supprimée avec succès.');
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      const msg =
        typeof err.response?.data === 'string'
          ? err.response.data
          : err.response?.data?.message || 'Erreur lors de la suppression.';
      setError(msg);
      setDeletingInstitution(null);
      setTimeout(() => setError(''), 5000);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredInstitutions = institutions.filter((e) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (e.nom || '').toLowerCase().includes(query);
  });

  return (
    <div dir="ltr" className="flex-1 overflow-y-auto p-8 flex flex-col items-center bg-[#f8fafc] text-left">
    <div className="w-full max-w-6xl space-y-6 animate-fade-in pb-12 text-left">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/25 flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-none">Gestion des Institutions &amp; Associations</h2>
              <p className="text-slate-500 text-xs mt-0.5">Visualisez, recherchez et gérez les structures du réseau CSPJ.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!loading && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-600 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {filteredInstitutions.length} structure{filteredInstitutions.length !== 1 ? 's' : ''}
            </div>
          )}
          <button
            onClick={() => { setEditingInstitution(null); setIsCreateModalOpen(true); }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 border border-transparent rounded-xl text-xs font-semibold text-white hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] transition-all duration-150 shadow-md shadow-violet-500/20 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle Institution
          </button>
        </div>
      </div>

      {/* ── Global Alerts ── */}
      {error && (
        <div className="p-4 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 shadow-sm flex items-center gap-2">
          <svg className="w-4 h-4 text-rose-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {/* ── Search Bar ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_0_rgb(0_0_0/_0.04),_0_1px_2px_-1px_rgb(0_0_0/_0.04)] flex items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-50 outline-none transition duration-150"
          />
        </div>
      </div>

      {/* ── Data Table Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_0_rgb(0_0_0/_0.04),_0_4px_6px_-2px_rgb(0_0_0/_0.04)] overflow-hidden">
        <div className="h-px w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500" />
        <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Répertoire des structures</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {!loading && `${filteredInstitutions.length} / ${institutions.length}`}
          </span>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 rounded-full border-2 border-violet-200 border-t-violet-500 animate-spin" />
            <p className="text-slate-400 text-xs font-medium">Chargement en cours...</p>
          </div>
        ) : filteredInstitutions.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center">
              <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-700 text-sm">Aucune structure trouvée</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100/80 text-slate-400 uppercase font-bold tracking-widest text-[10px]">
                  <th className="px-5 py-3.5">Nom de l'Institution</th>
                  <th className="px-5 py-3.5">Type de Structure</th>
                  <th className="px-5 py-3.5 text-center">Membres Associés</th>
                  <th className="px-5 py-3.5 text-center">Date de Création</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 text-slate-600">
                {filteredInstitutions.map((institution) => (
                  <tr key={institution.id} className="hover:bg-violet-50/25 transition-colors duration-150 group">
                    {/* Name */}
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center shadow-sm flex-shrink-0 group-hover:from-violet-500 group-hover:to-indigo-600 transition-all duration-200">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="block text-sm font-semibold text-slate-900 leading-tight">{institution.nom}</span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${
                        institution.estAssociation
                          ? 'bg-indigo-50/70 text-indigo-700 border-indigo-200/60'
                          : 'bg-violet-50/70 text-violet-700 border-violet-200/60'
                      }`}>
                        {institution.estAssociation ? 'Association' : 'Institution'}
                      </span>
                    </td>

                    {/* Member count */}
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        {getMemberCount(institution)}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-center">
                      <span className="text-xs text-slate-600 font-medium">
                        {institution.dateCreation ? new Date(institution.dateCreation).toLocaleDateString('fr-FR') : 'N/A'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit button */}
                        <button
                          onClick={() => handleOpenEdit(institution)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-amber-600 bg-amber-50/80 hover:bg-amber-500 hover:text-white rounded-xl transition-all duration-150 border border-amber-200/80 hover:border-amber-500 cursor-pointer active:scale-[0.98] hover:shadow-md hover:shadow-amber-500/20 text-xs font-semibold"
                          title="Modifier cette institution"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Éditer
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => setDeletingInstitution(institution)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-600 bg-rose-50/80 hover:bg-rose-500 hover:text-white rounded-xl transition-all duration-150 border border-rose-200/80 hover:border-rose-500 cursor-pointer active:scale-[0.98] hover:shadow-md hover:shadow-rose-500/20 text-xs font-semibold"
                          title="Supprimer cette institution"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {isCreateModalOpen && (
        <CreateInstitutionModal
          institutionToEdit={editingInstitution}
          onClose={handleCreateModalClose}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* ── Delete Confirmation Modal ── */}
      <DeleteConfirmModal
        institution={deletingInstitution}
        onCancel={() => setDeletingInstitution(null)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />
    </div>
    </div>
  );
}
