import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Building2, X, Check, RefreshCw } from 'lucide-react';

export default function CreateInstitutionModal({ onClose, onSuccess, institutionToEdit = null }) {
  const isEditing = Boolean(institutionToEdit);

  const [nom, setNom]                     = useState('');
  const [estAssociation, setEstAssociation] = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  // Pre-fill fields when editing
  useEffect(() => {
    if (institutionToEdit) {
      setNom(institutionToEdit.nom ?? '');
      setEstAssociation(institutionToEdit.estAssociation ?? false);
    } else {
      setNom('');
      setEstAssociation(false);
    }
    setError('');
  }, [institutionToEdit]);

  const handleClose = () => {
    setNom('');
    setEstAssociation(false);
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nom.trim()) {
      setError("Le nom de l'institution est obligatoire.");
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/admin/institutions/${institutionToEdit.id}`, {
          nom: nom.trim(),
          estAssociation,
        });
      } else {
        await api.post('/admin/institutions', {
          nom: nom.trim(),
          estAssociation,
        });
      }
      onSuccess?.();
      handleClose();
    } catch (err) {
      const msg =
        typeof err.response?.data === 'string'
          ? err.response.data
          : err.response?.data?.message ||
            (isEditing
              ? "Erreur lors de la modification de l'institution."
              : "Erreur lors de la création de l'institution.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                {isEditing ? "Modifier l'institution" : "Nouvelle Institution"}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? "Mise à jour des paramètres" : "Ajouter une structure au réseau"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nom de la structure <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="ex: Direction des Ressources Humaines..."
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Type d'entité
            </label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  !estAssociation
                    ? 'bg-blue-50/60 border-blue-300 text-blue-900 font-semibold'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="typeEntite"
                  checked={!estAssociation}
                  onChange={() => setEstAssociation(false)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs">Institution publique</span>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  estAssociation
                    ? 'bg-amber-50/60 border-amber-300 text-amber-900 font-semibold'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="typeEntite"
                  checked={estAssociation}
                  onChange={() => setEstAssociation(true)}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span className="text-xs">Association</span>
              </label>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Enregistrer' : 'Créer'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
