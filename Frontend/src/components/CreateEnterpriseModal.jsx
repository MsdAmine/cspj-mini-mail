import React, { useState } from 'react';
import api from '../services/api';

export default function CreateEnterpriseModal({ onClose, onSuccess }) {
  const [nom, setNom] = useState('');
  const [estAssociation, setEstAssociation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nom.trim()) {
      setError("Le nom de l'entreprise est obligatoire.");
      return;
    }
    setLoading(true);
    try {
      await api.post('/admin/entreprises', {
        nom: nom.trim(),
        estAssociation
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg =
        typeof err.response?.data === 'string'
          ? err.response.data
          : err.response?.data?.message ||
            "Une erreur est survenue lors de la création de l'entreprise.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-slate-900/40 animate-fade-in p-4">
      <div className="w-full max-w-lg bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden">

        {/* Prismatic accent bar */}
        <div className="h-px w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500" />

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/25 flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Nouvelle Entreprise / Association</h3>
              <p className="text-xs text-slate-400 mt-0.5">Enregistrer une nouvelle structure dans le réseau CSPJ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">

            {/* Error Alert */}
            {error && (
              <div className="p-3.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2">
                <svg className="w-4 h-4 text-rose-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Nom */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Nom de l'association / entreprise <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Association des Magistrats du Sud"
                disabled={loading}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-50 outline-none transition duration-150 disabled:opacity-60"
              />
            </div>

            {/* Est Association */}
            <div className="flex items-center gap-3 bg-slate-50/50 p-3.5 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                id="estAssociation"
                checked={estAssociation}
                onChange={(e) => setEstAssociation(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 text-violet-600 bg-white border-slate-300 rounded focus:ring-violet-500 focus:ring-2 disabled:opacity-60 cursor-pointer"
              />
              <div>
                <label htmlFor="estAssociation" className="block text-sm font-semibold text-slate-700 cursor-pointer">
                  Il s'agit d'une association
                </label>
                <p className="text-[10px] text-slate-400 mt-0.5">Cochez cette case s'il s'agit d'une association et non d'une entreprise.</p>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/60 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-xl transition-all duration-150 border border-slate-200 cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl shadow-md shadow-violet-500/20 transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Créer l'entreprise
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
