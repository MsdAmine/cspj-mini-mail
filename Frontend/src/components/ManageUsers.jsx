import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLogs } from '../context/LogContext';

export default function ManageUsers() {
  const { user: currentUser } = useAuth();
  const { addLog } = useLogs();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  // Fetch users from backend
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/users');
      const apiUsers = response.data || [];
      setUsers(apiUsers);
    } catch (err) {
      console.error(err);
      const status = err.response?.status;

      if (!err.response) {
        // True network error — backend is down or unreachable
        setUsers([]);
        setError(
          "L'API de production n'a pas pu être contactée."
        );
      } else if (status === 401 || status === 403) {
        // Auth error — interceptor will reload; show a transient message
        setError("Session expirée. Reconnexion en cours...");
      } else {
        setError(
          err.response?.data?.message ||
          err.response?.data ||
          "Une erreur serveur est survenue lors du chargement des utilisateurs."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle status toggle
  const handleToggleStatus = async (userToUpdate) => {
    setError('');
    setSuccess('');
    const newStatus = !userToUpdate.actif;

    try {
      // Optimistic UI update
      setUsers(prev =>
        prev.map(u => u.id === userToUpdate.id ? { ...u, actif: newStatus } : u)
      );

      await api.put(`/admin/users/${userToUpdate.id}/status`, { actif: newStatus });
      const statusLabel = newStatus ? 'Actif' : 'Inactif';
      const prevLabel = newStatus ? 'Inactif' : 'Actif';
      addLog(
        'TOGGLE_USER_STATUS',
        `L'administrateur a modifié le statut du compte ${userToUpdate.email} de '${prevLabel}' à '${statusLabel}'.`,
        currentUser?.email
      );
      setSuccess(`Le statut de ${userToUpdate.prenom} ${userToUpdate.nom} a été mis à jour.`);

      // Auto clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      // Revert status on failure
      setUsers(prev =>
        prev.map(u => u.id === userToUpdate.id ? { ...u, actif: userToUpdate.actif } : u)
      );
      setError(
        err.response?.data?.message ||
        err.response?.data ||
        "Erreur lors de la mise à jour du statut."
      );
    }
  };

  // Handle delete user API call
  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setIsDeleteLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.delete(`/admin/users/${deletingUser.id}`);
      addLog(
        'DELETE_USER',
        `L'administrateur a définitivement supprimé le compte ${deletingUser.email} (${deletingUser.prenom} ${deletingUser.nom}) du système.`,
        currentUser?.email
      );
      setSuccess(`L'utilisateur ${deletingUser.prenom} ${deletingUser.nom} a été supprimé avec succès.`);
      setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
      setDeletingUser(null);

      // Auto clear success message
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        err.response?.data ||
        "Une erreur est survenue lors de la suppression de l'utilisateur."
      );
    } finally {
      setIsDeleteLoading(false);
    }
  };

  // Filter users dynamically based on query
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    return (
      user.nom.toLowerCase().includes(query) ||
      user.prenom.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query) ||
      (user.entrepriseNom && user.entrepriseNom.toLowerCase().includes(query))
    );
  });

  return (
    <div className="w-full max-w-6xl space-y-6 animate-fade-in pb-12">
      {/* Title & Stats summary */}
      <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gestion des Utilisateurs</h2>
          <p className="text-slate-500 text-xs mt-1">
            Visualisez, recherchez, activez/désactivez ou supprimez les comptes utilisateurs de la plateforme.
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={fetchUsers}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="p-4 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 shadow-sm animate-fade-in flex items-center gap-2">
          <svg className="w-4 h-4 text-rose-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm animate-fade-in flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {/* Search Bar section */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Rechercher par nom, prénom, email, rôle ou structure..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-250 rounded-lg text-sm focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition duration-150"
          />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-4">
            <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-slate-500 text-xs font-medium">Chargement des utilisateurs en cours...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="font-semibold text-slate-800 text-sm">Aucun utilisateur trouvé</h3>
            <p className="text-slate-400 text-xs mt-1">
              {searchQuery ? "Ajustez vos filtres de recherche ou réinitialisez le champ." : "Aucun utilisateur n'est inscrit dans le système."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 uppercase font-bold tracking-wider">
                  <th className="px-6 py-4">Nom / Prénom</th>
                  <th className="px-6 py-4">Adresse Email</th>
                  <th className="px-6 py-4">Structure</th>
                  <th className="px-6 py-4">Rôle</th>
                  <th className="px-6 py-4 text-center">Statut (Actif)</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredUsers.map((u) => {
                  const isSelf = currentUser?.id === u.id;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/50 transition duration-150 ${isSelf ? 'bg-blue-50/15' : ''}`}
                    >
                      {/* Name / Firstname */}
                      <td className="px-6 py-4.5 font-semibold text-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center border border-slate-800 shadow-sm uppercase font-mono">
                            {u.prenom ? u.prenom.charAt(0) : 'U'}
                          </div>
                          <div>
                            <span className="block text-sm font-semibold text-slate-900">
                              {u.prenom} {u.nom}
                            </span>
                            {isSelf && (
                              <span className="inline-block text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 rounded mt-0.5 font-mono">
                                VOUS (Connecté)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4.5 text-slate-600 font-medium">
                        {u.email}
                      </td>

                      {/* Enterprise/Structure */}
                      <td className="px-6 py-4.5">
                        <span className="text-xs font-semibold text-slate-700">
                          {u.entrepriseNom || "Non définie"}
                        </span>
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-4.5">
                        <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider font-mono ${
                          u.role === 'Administrateur'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : u.role === 'Fonctionnaire'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      {/* Toggle status switch */}
                      <td className="px-6 py-4.5 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 ${
                              u.actif ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                            aria-checked={u.actif}
                            title={u.actif ? "Désactiver le compte" : "Activer le compte"}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                u.actif ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4.5 text-right">
                        <button
                          type="button"
                          onClick={() => setDeletingUser(u)}
                          disabled={isSelf}
                          className={`p-2 text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-lg transition border border-rose-200 hover:border-rose-500 cursor-pointer ${
                            isSelf ? 'opacity-30 cursor-not-allowed hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200' : ''
                          }`}
                          title={isSelf ? "Vous ne pouvez pas supprimer votre propre compte" : "Supprimer cet utilisateur"}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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

      {/* Confirmation Modal for Deletion */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden m-4">

            {/* Modal Header */}
            <div className="bg-rose-600 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold tracking-wide text-sm uppercase flex items-center gap-2">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Confirmation de suppression
              </h3>
              <button
                onClick={() => setDeletingUser(null)}
                className="text-white hover:text-slate-200 transition text-lg outline-none cursor-pointer"
                disabled={isDeleteLoading}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700 font-medium leading-relaxed">
                Êtes-vous absolument sûr de vouloir supprimer définitivement le compte de <strong>{deletingUser.prenom} {deletingUser.nom}</strong> ?
              </p>

              <div className="p-3.5 bg-rose-50 text-rose-900 border border-rose-100 rounded-lg text-xs leading-relaxed space-y-2">
                <p className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Conséquences de cette action :
                </p>
                <ul className="list-disc pl-4 space-y-1 font-medium text-[11px]">
                  <li>Suppression de sa fiche utilisateur.</li>
                  <li>Suppression de tous les messages envoyés et reçus par cet utilisateur.</li>
                  <li>Suppression des pièces jointes associées à ces messages.</li>
                  <li>Suppression automatique des fils de discussion devenant vides.</li>
                </ul>
                <p className="font-semibold text-rose-700 italic">Cette action est définitive et irréversible.</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-lg transition border border-slate-200 cursor-pointer"
                disabled={isDeleteLoading}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-md transition flex items-center gap-1.5 cursor-pointer"
                disabled={isDeleteLoading}
              >
                {isDeleteLoading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Suppression...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Confirmer la suppression
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
