import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLogs } from '../context/LogContext';
import CreateInstitutionModal from './CreateInstitutionModal';
import {
  Building, Building2, Plus, Search, RefreshCw,
  Edit2, Trash2, Users, AlertTriangle, Check, X
} from 'lucide-react';

// ── Delete Confirmation Modal ─────────────────────────────────────────────────
function DeleteConfirmModal({ institution, onCancel, onConfirm, loading }) {
  if (!institution) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Supprimer la structure</h3>
              <p className="text-xs text-slate-500">Action irréversible</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3">
          <p className="text-xs text-slate-700 leading-relaxed">
            Vous êtes sur le point de supprimer{' '}
            <strong className="text-slate-900 font-semibold">"{institution.nom}"</strong>.
          </p>
          {institution.utilisateursCount > 0 ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                Cette structure compte <strong>{institution.utilisateursCount} membre(s)</strong>.
                La suppression sera refusée tant que des utilisateurs y sont rattachés.
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Aucun membre n'est rattaché à cette structure. La suppression peut être effectuée en toute sécurité.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3.5 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Suppression...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmer</span>
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

  const [institutions, setInstitutions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Create / Edit modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState(null);

  // Delete modal
  const [deletingInstitution, setDeletingInstitution] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
      setError('Erreur lors du chargement des institutions.');
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

  const handleOpenEdit = (institution) => {
    setEditingInstitution(institution);
    setIsCreateModalOpen(true);
  };

  const handleCreateModalClose = () => {
    setIsCreateModalOpen(false);
    setTimeout(() => setEditingInstitution(null), 200);
  };

  const handleCreateSuccess = () => {
    fetchInstitutionsAndUsers();
    setSuccess(editingInstitution ? 'Institution mise à jour avec succès !' : 'Institution créée avec succès !');
    setTimeout(() => setSuccess(''), 3500);
  };

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
      const msg = typeof err.response?.data === 'string'
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
    <div dir="ltr" className="flex-1 flex flex-col h-full bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">

      {/* ── Top Header ── */}
      <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-6 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Gestion des Institutions</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wider">
                Structures ({filteredInstitutions.length})
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Administration des institutions, directions et associations du réseau
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchInstitutionsAndUsers}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Actualiser la liste"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={() => { setEditingInstitution(null); setIsCreateModalOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-xl text-xs font-semibold shadow-sm transition-all duration-150 active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Institution</span>
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
                placeholder="Rechercher une institution ou association..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 placeholder:text-slate-400 transition-all"
              />
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Liste des structures enregistrées</span>
              <span className="text-xs text-slate-400 font-mono">{filteredInstitutions.length} institutions</span>
            </div>

            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-xs font-medium">Chargement des structures en cours…</p>
              </div>
            ) : filteredInstitutions.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center gap-2 text-center text-slate-400">
                <Building2 className="w-8 h-8 text-slate-300" />
                <h3 className="font-semibold text-slate-700 text-sm">Aucune institution trouvée</h3>
                <p className="text-xs text-slate-400">{searchQuery ? 'Ajustez votre recherche.' : "Aucune structure enregistrée."}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 uppercase font-bold tracking-wider text-[10px]">
                      <th className="px-6 py-3.5">Nom de la structure</th>
                      <th className="px-6 py-3.5">Type</th>
                      <th className="px-6 py-3.5 text-center">Membres</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {filteredInstitutions.map((inst) => {
                      const count = getMemberCount(inst);
                      return (
                        <tr key={inst.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-800">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${inst.estAssociation
                                ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
                                : 'bg-blue-50 text-blue-700 border border-blue-200/80'
                                }`}>
                                <Building className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-semibold text-slate-900">{inst.nom}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${inst.estAssociation
                              ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                              : 'bg-blue-50 text-blue-700 border-blue-200/60'
                              }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${inst.estAssociation ? 'bg-amber-500' : 'bg-blue-500'}`} />
                              {inst.estAssociation ? 'Association' : 'Institution publique'}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                              <Users className="w-3 h-3 text-slate-400" />
                              {count} membre{count !== 1 ? 's' : ''}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(inst)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Modifier la structure"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setDeletingInstitution(inst)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Supprimer la structure"
                              >
                                <Trash2 className="w-4 h-4" />
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
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isCreateModalOpen && (
        <CreateInstitutionModal
          onClose={handleCreateModalClose}
          onSuccess={handleCreateSuccess}
          institutionToEdit={editingInstitution}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingInstitution && (
        <DeleteConfirmModal
          institution={deletingInstitution}
          onCancel={() => setDeletingInstitution(null)}
          onConfirm={handleConfirmDelete}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
