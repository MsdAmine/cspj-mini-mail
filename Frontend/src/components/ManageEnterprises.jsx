import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLogs } from '../context/LogContext';
import CreateEnterpriseModal from './CreateEnterpriseModal';

export default function ManageEnterprises() {
  const { user: currentUser } = useAuth();
  const { addLog } = useLogs();
  const [enterprises, setEnterprises] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchEnterprisesAndUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const [enterprisesRes, usersRes] = await Promise.all([
        api.get('/admin/entreprises'),
        api.get('/admin/users')
      ]);
      setEnterprises(enterprisesRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnterprisesAndUsers();
  }, []);

  const getMemberCount = (enterprise) => {
    if (!users || !Array.isArray(users)) return enterprise.membresCount || 0;
    
    return users.filter(user => 
      user.entrepriseId === enterprise.id || 
      user.entrepriseNom === enterprise.nom ||
      user.structure === enterprise.nom
    ).length;
  };

  const handleToggleStatus = async (enterprise) => {
    setError('');
    setSuccess('');
    // Assuming the backend has a status toggle endpoint, if not, we handle gracefully.
    // Assuming property name `actif`, default to true if missing.
    const currentStatus = enterprise.actif ?? true;
    const newStatus = !currentStatus;

    try {
      // Optimistic update
      setEnterprises(prev => prev.map(e => e.id === enterprise.id ? { ...e, actif: newStatus } : e));
      
      // Attempt API call (if this endpoint doesn't exist, we might need to adjust or skip)
      // await api.put(`/admin/entreprises/${enterprise.id}/status`, { actif: newStatus });
      // For now, if no such API exists, it might fail. We'll leave it optimistic or mock.
      // If the backend has it:
      await api.put(`/admin/entreprises/${enterprise.id}`, { ...enterprise, actif: newStatus });
      
      const statusLabel = newStatus ? 'Actif' : 'Inactif';
      addLog(
        'TOGGLE_ENTERPRISE_STATUS',
        `L'administrateur a modifié le statut de l'entreprise ${enterprise.nom} à '${statusLabel}'.`,
        currentUser?.email
      );
      setSuccess(`Le statut de l'entreprise ${enterprise.nom} a été mis à jour.`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      // Revert status
      setEnterprises(prev => prev.map(e => e.id === enterprise.id ? { ...e, actif: currentStatus } : e));
      setError("Erreur lors de la mise à jour du statut.");
    }
  };

  const filteredEnterprises = enterprises.filter((e) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (e.nom || '').toLowerCase().includes(query) ||
      (e.code || '').toLowerCase().includes(query) ||
      (e.emailContact || '').toLowerCase().includes(query)
    );
  });

  return (
    <div dir="ltr" className="w-full max-w-6xl space-y-6 animate-fade-in pb-12 text-left">
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
              <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-none">Gestion des Entreprises & Associations</h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Visualisez, recherchez et gérez les structures du réseau CSPJ.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!loading && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-600 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {filteredEnterprises.length} structure{filteredEnterprises.length !== 1 ? 's' : ''}
            </div>
          )}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 border border-transparent rounded-xl text-xs font-semibold text-white hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] transition-all duration-150 shadow-md shadow-violet-500/20 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle Entreprise
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
            placeholder="Rechercher par nom ou code matricule..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-50 outline-none transition duration-150"
          />
        </div>
      </div>

      {/* ── Floating Data Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_0_rgb(0_0_0/_0.04),_0_4px_6px_-2px_rgb(0_0_0/_0.04)] overflow-hidden">
        <div className="h-px w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500" />
        <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Répertoire des structures</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {!loading && `${filteredEnterprises.length} / ${enterprises.length}`}
          </span>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 rounded-full border-2 border-violet-200 border-t-violet-500 animate-spin" />
            <p className="text-slate-400 text-xs font-medium">Chargement en cours...</p>
          </div>
        ) : filteredEnterprises.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center">
              <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-700 text-sm">Aucune structure trouvée</h3>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100/80 text-slate-400 uppercase font-bold tracking-widest text-[10px]">
                  <th className="px-5 py-3.5">Nom de l'Entreprise</th>
                  <th className="px-5 py-3.5">Matricule / Code ID</th>
                  <th className="px-5 py-3.5 text-center">Membres Associés</th>
                  <th className="px-5 py-3.5 text-center">Statut</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 text-slate-600">
                {filteredEnterprises.map((e) => {
                  const estActif = e.actif ?? true;
                  return (
                    <tr key={e.id} className="hover:bg-violet-50/25 transition-colors duration-150 group">
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center shadow-sm flex-shrink-0 group-hover:from-violet-500 group-hover:to-indigo-600 transition-all duration-200">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <span className="block text-sm font-semibold text-slate-900 leading-tight">
                              {e.nom}
                            </span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              {e.emailContact || "Aucun email"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-mono font-medium text-slate-700 px-2.5 py-1 bg-slate-100/70 rounded-lg border border-slate-200/60">
                          {e.code || "N/A"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          {getMemberCount(e)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(e)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-2 focus:ring-violet-500/20 focus:ring-offset-2 ${
                              estActif ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30' : 'bg-slate-200'
                            }`}
                            aria-checked={estActif}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                estActif ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-600 bg-white hover:bg-slate-50 hover:text-violet-600 rounded-xl transition-all duration-150 border border-slate-200/80 cursor-pointer active:scale-[0.98] shadow-sm">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Éditer
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

      {isCreateModalOpen && (
        <CreateEnterpriseModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            fetchEnterprisesAndUsers();
            setSuccess("Entreprise créée avec succès !");
            setTimeout(() => setSuccess(''), 3000);
          }}
        />
      )}
    </div>
  );
}
