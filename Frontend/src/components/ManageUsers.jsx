import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLogs } from '../context/LogContext';

const initials = (prenom = '', nom = '') =>
  `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase() || '?';

// ─────────────────────────────────────────────────────────────────────────────
// AssignStaffModal
// ─────────────────────────────────────────────────────────────────────────────
function AssignStaffModal({ association, onClose, onSaved }) {
  const [fonctionnaires, setFonctionnaires] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingInit, setLoadingInit] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [allRes, assignedRes] = await Promise.all([
          api.get('/admin/users'),
          api.get(`/admin/users/${association.id}/assignments`),
        ]);
        if (cancelled) return;
        const foncs = (allRes.data || []).filter(
          u => u.role?.toLowerCase() === 'fonctionnaire' && u.actif
        );
        setFonctionnaires(foncs);
        setSelectedIds((assignedRes.data || []).map(a => a.fonctionnaireId));
      } catch {
        if (!cancelled) setError('Erreur lors du chargement des données.');
      } finally {
        if (!cancelled) setLoadingInit(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [association.id]);

  const filtered = fonctionnaires.filter(f =>
    `${f.prenom} ${f.nom} ${f.email} ${f.institutionNom || ''}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id) =>
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/admin/users/${association.id}/assignments`, {
        fonctionnaireIds: selectedIds,
      });
      onSaved(selectedIds.length);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data ||
        'Erreur lors de la sauvegarde des assignations.'
      );
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden flex flex-col max-h-[85vh] m-4">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-violet-700 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shadow-inner text-white font-bold text-sm uppercase">
              {initials(association.prenom, association.nom)}
            </div>
            <div>
              <h3 className="font-bold text-white text-sm leading-tight">Assigner des Fonctionnaires</h3>
              <p className="text-indigo-200 text-[11px] mt-0.5">
                {association.prenom} {association.nom} · {association.institutionNom || 'Association'}
              </p>
            </div>
          </div>
          <button onClick={onClose} disabled={saving}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all duration-150 cursor-pointer active:scale-95">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Info notice */}
        <div className="px-6 pt-5 flex-shrink-0">
          <div className="flex items-start gap-3 p-3.5 bg-indigo-50/80 border border-indigo-200/60 rounded-xl">
            <svg className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[11px] text-indigo-800 font-medium leading-relaxed">
              Les fonctionnaires sélectionnés seront les seuls contacts disponibles pour cette association lors de la création de groupes.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/60 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {loadingInit ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Chargement en cours…</p>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" placeholder="Rechercher un fonctionnaire…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition duration-150" />
              </div>

              {/* Selected count and pills */}
              {selectedIds.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      Sélectionnés ({selectedIds.length})
                    </span>
                    <button onClick={() => setSelectedIds([])}
                      className="text-[10px] font-semibold text-slate-400 hover:text-slate-700 underline underline-offset-2 transition cursor-pointer">
                      Tout désélectionner
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {fonctionnaires.filter(f => selectedIds.includes(f.id)).map(f => (
                      <span key={f.id} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-medium rounded-lg">
                        {f.prenom} {f.nom}
                        <button type="button" onClick={() => toggle(f.id)} className="hover:text-indigo-900 focus:outline-none">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* List */}
              <div className="border border-slate-200/60 rounded-xl bg-white shadow-sm max-h-72 overflow-y-auto pr-1">
                {filtered.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-xs text-slate-400 font-medium">
                      {fonctionnaires.length === 0 ? 'Aucun fonctionnaire actif dans le système.' : 'Aucun résultat pour cette recherche.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100/80">
                    {filtered.map(f => {
                      const checked = selectedIds.includes(f.id);
                      return (
                        <label key={f.id}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors duration-100 ${checked ? 'bg-indigo-50/80' : 'hover:bg-slate-50/80'}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggle(f.id)}
                            className="w-4 h-4 rounded border-slate-300 accent-indigo-600 cursor-pointer flex-shrink-0"
                            disabled={saving} />
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold uppercase flex-shrink-0 shadow-sm transition-colors duration-150 ${checked ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                            {initials(f.prenom, f.nom)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{f.prenom} {f.nom}</p>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {f.email}
                              {f.institutionNom && <span className="text-slate-300"> · {f.institutionNom}</span>}
                            </p>
                          </div>
                          {checked && (
                            <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex-shrink-0">
          <span className="text-[10px] text-slate-400 font-medium">
            {selectedIds.length} / {fonctionnaires.length} fonctionnaires assignés
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-all duration-150 cursor-pointer active:scale-[0.98]">
              Annuler
            </button>
            <button type="button" onClick={handleSave} disabled={saving || loadingInit}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/25 transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Sauvegarde…
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EditUserModal
// ─────────────────────────────────────────────────────────────────────────────
function EditUserModal({ user, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    nom: user.nom || '',
    prenom: user.prenom || '',
    email: user.email || '',
    institutionId: user.institutionId || ''
  });
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchInstitutions = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/institutions');
        if (!cancelled) setInstitutions(res.data || []);
      } catch (err) {
        if (!cancelled) setError("Erreur lors du chargement des institutions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchInstitutions();
    return () => { cancelled = true; };
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nom || !formData.prenom || !formData.email || !formData.institutionId) {
      setError("Tous les champs sont obligatoires.");
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.put(`/admin/users/${user.id}`, {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        institutionId: parseInt(formData.institutionId)
      });
      const selectedInst = institutions.find(i => i.id === parseInt(formData.institutionId));
      onSaved({
        ...formData,
        institutionId: parseInt(formData.institutionId),
        institutionNom: selectedInst ? selectedInst.nom : user.institutionNom
      });
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Erreur lors de la modification.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-5 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Modifier l'utilisateur</h3>
          <button onClick={onClose} disabled={saving} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Prénom</label>
                  <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nom</label>
                  <input type="text" name="nom" value={formData.nom} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Structure / Institution</label>
                <select name="institutionId" value={formData.institutionId} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none transition-all">
                  <option value="">Sélectionner une structure</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.nom} {inst.estAssociation ? '(Association)' : ''}</option>
                  ))}
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50">Annuler</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 flex items-center gap-2">
                  {saving ? 'Sauvegarde...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UserAuditModal
// ─────────────────────────────────────────────────────────────────────────────
function UserAuditModal({ user, onClose }) {
  const [groups, setGroups] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const pGroups = api.get(`/admin/users/${user.id}/groups`);
        let pAssignments = Promise.resolve({ data: [] });
        if (user.role?.toLowerCase() === 'association') {
          pAssignments = api.get(`/admin/users/${user.id}/assignments`);
        }
        const [resGroups, resAssignments] = await Promise.all([pGroups, pAssignments]);
        if (!cancelled) {
          setGroups(resGroups.data || []);
          setAssignments(resAssignments.data || []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user.id, user.role]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-5 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Audit Profil Utilisateur</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold">
              {initials(user.prenom, user.nom)}
            </div>
            <div>
              <h4 className="font-bold text-slate-800">{user.prenom} {user.nom}</h4>
              <p className="text-xs text-slate-500">{user.email}</p>
              <div className="mt-2 flex gap-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold">{user.role}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${user.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{user.actif ? 'Actif' : 'Inactif'}</span>
              </div>
            </div>
          </div>
          
          {loading ? (
             <div className="py-8 text-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
          ) : (
            <div className="space-y-6">
              {user.role?.toLowerCase() === 'association' && (
                <div>
                  <h5 className="text-xs font-bold uppercase text-slate-500 mb-3">Fonctionnaires assignés ({assignments.length})</h5>
                  {assignments.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                      {assignments.map(a => (
                        <div key={a.fonctionnaireId} className="px-4 py-2.5 text-sm flex justify-between">
                          <span className="font-medium text-slate-700">{a.nomComplet}</span>
                          <span className="text-xs text-slate-500">{a.institutionNom}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-slate-400 italic">Aucun fonctionnaire assigné.</p>}
                </div>
              )}
              
              <div>
                <h5 className="text-xs font-bold uppercase text-slate-500 mb-3">Groupes ({groups.length})</h5>
                {groups.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {groups.map(g => (
                      <div key={g.id} className="px-4 py-2.5 text-sm flex items-center justify-between">
                        <span className="font-medium text-slate-700">{g.subject || '(Sans titre)'}</span>
                        {g.isArchived ? (
                           <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded">Archivé</span>
                        ) : (
                           <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded">Actif</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-slate-400 italic">Ne participe à aucun groupe.</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ManageUsers
// ─────────────────────────────────────────────────────────────────────────────
export default function ManageUsers() {
  const { user: currentUser } = useAuth();
  const { addLog } = useLogs();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingUser, setDeletingUser] = useState(null);
  const [auditingUser, setAuditingUser] = useState(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [assigningUser, setAssigningUser] = useState(null); // NEW
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data || []);
    } catch (err) {
      const status = err.response?.status;
      if (!err.response) {
        setUsers([]);
        setError("L'API de production n'a pas pu être contactée.");
      } else if (status === 401 || status === 403) {
        setError('Session expirée. Reconnexion en cours…');
      } else {
        setError(err.response?.data?.message || err.response?.data || 'Une erreur serveur est survenue lors du chargement des utilisateurs.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggleStatus = async (userToUpdate) => {
    setError(''); setSuccess('');
    const newStatus = !userToUpdate.actif;
    try {
      setUsers(prev => prev.map(u => u.id === userToUpdate.id ? { ...u, actif: newStatus } : u));
      await api.put(`/admin/users/${userToUpdate.id}/status`, { actif: newStatus });
      addLog('TOGGLE_USER_STATUS', `Statut de ${userToUpdate.email} modifié.`, currentUser?.email);
      setSuccess(`Le statut de ${userToUpdate.prenom} ${userToUpdate.nom} a été mis à jour.`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setUsers(prev => prev.map(u => u.id === userToUpdate.id ? { ...u, actif: userToUpdate.actif } : u));
      setError(err.response?.data?.message || err.response?.data || 'Erreur lors de la mise à jour du statut.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setIsDeleteLoading(true); setError(''); setSuccess('');
    try {
      await api.delete(`/admin/users/${deletingUser.id}`);
      addLog('DELETE_USER', `Compte ${deletingUser.email} supprimé.`, currentUser?.email);
      setSuccess(`L'utilisateur ${deletingUser.prenom} ${deletingUser.nom} a été supprimé avec succès.`);
      setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
      setDeletingUser(null);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Une erreur est survenue lors de la suppression.");
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleAssignSaved = (count) => {
    const name = `${assigningUser?.prenom} ${assigningUser?.nom}`;
    setSuccess(
      `✓ ${count} fonctionnaire${count !== 1 ? 's' : ''} assigné${count !== 1 ? 's' : ''} à ${name} — تم تعيين الموظفين بنجاح`
    );
    addLog('ASSIGN_FONCTIONNAIRES', `Assignations de ${assigningUser?.email} : ${count} fonctionnaire(s).`, currentUser?.email);
    setTimeout(() => setSuccess(''), 5000);
  };

  const formatRoleInFrench = (role) => {
    if (!role) return 'Fonctionnaire';
    const n = role.toString().toLowerCase();
    if (n.includes('assoc') || n.includes('جمعية')) return 'Association';
    if (n.includes('admin')) return 'Administrateur';
    return 'Fonctionnaire';
  };

  const getRoleBadge = (role) => {
    const r = formatRoleInFrench(role);
    if (r === 'Administrateur') return { label: 'Administrateur', className: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50/80 text-blue-700 border border-blue-200/80 shadow-sm', dot: 'bg-blue-500' };
    if (r === 'Association') return { label: 'Association', className: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50/80 text-amber-700 border border-amber-200/80 shadow-sm', dot: 'bg-amber-500' };
    return { label: 'Fonctionnaire', className: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50/80 text-emerald-700 border border-emerald-200/80 shadow-sm', dot: 'bg-emerald-500' };
  };

  const otherUsers = users.filter(u => {
    const isSameEmail = u.email?.toLowerCase().trim() === currentUser?.email?.toLowerCase().trim();
    const cid = currentUser?.id ?? currentUser?.userId;
    const uid = u.id ?? u.userId;
    const isSameId = cid != null && uid != null && String(cid) === String(uid);
    return !isSameEmail && !isSameId;
  });

  const filteredUsers = otherUsers.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.nom.toLowerCase().includes(q) ||
      u.prenom.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.institutionNom && u.institutionNom.toLowerCase().includes(q))
    );
  });

  return (
    <div dir="ltr" className="flex-1 overflow-y-auto p-8 flex flex-col items-center bg-[#f8fafc] text-left">
      <div className="w-full max-w-6xl space-y-6 animate-fade-in pb-12 text-left">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/25 flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-none">Gestion des Utilisateurs</h2>
              <p className="text-slate-500 text-xs mt-0.5">Visualisez, activez, supprimez ou assignez des fonctionnaires aux associations.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!loading && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-600 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''}
              </div>
            )}
            <button onClick={fetchUsers}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md">
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
            <input type="text" placeholder="Rechercher par nom, prénom, email, rôle ou structure…"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition duration-150" />
          </div>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer active:scale-[0.98] duration-150">
              Effacer
            </button>
          )}
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_0_rgb(0_0_0/_0.04),_0_4px_6px_-2px_rgb(0_0_0/_0.04)] overflow-hidden hover:shadow-[0_4px_12px_-2px_rgb(0_0_0/_0.08)] transition-shadow duration-300">
          <div className="h-px w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
          <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Répertoire des comptes</span>
            <span className="text-[10px] text-slate-400 font-mono">{!loading && `${filteredUsers.length} / ${otherUsers.length}`}</span>
          </div>

          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
              <p className="text-slate-400 text-xs font-medium">Chargement des utilisateurs en cours…</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center">
                <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 text-sm">Aucun utilisateur trouvé</h3>
                <p className="text-slate-400 text-xs mt-1">{searchQuery ? 'Ajustez vos filtres.' : "Aucun utilisateur n'est inscrit dans le système."}</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto lg:overflow-x-visible w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100/80 text-slate-400 uppercase font-bold tracking-widest text-[10px]">
                    <th className="px-5 py-3.5 w-1/5">Nom / Prénom</th>
                    <th className="px-5 py-3.5 w-1/4">Adresse Email</th>
                    <th className="px-5 py-3.5 w-1/5">Structure</th>
                    <th className="px-5 py-3.5 w-1/6">Rôle</th>
                    <th className="px-5 py-3.5 w-1/12 text-center">Statut</th>
                    <th className="px-5 py-3.5 w-auto text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 text-slate-600">
                  {filteredUsers.map(u => {
                    const badge = getRoleBadge(u.role);
                    const isAssoc = formatRoleInFrench(u.role) === 'Association';
                    return (
                      <tr key={u.id} className="hover:bg-blue-50/25 transition-colors duration-150 group">
                        {/* Name */}
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white font-bold text-sm flex items-center justify-center shadow-sm uppercase flex-shrink-0 group-hover:from-blue-500 group-hover:to-indigo-600 transition-all duration-200">
                              {u.prenom ? u.prenom.charAt(0) : 'U'}
                            </div>
                            <span className="block text-sm font-semibold text-slate-900 leading-tight">{u.prenom} {u.nom}</span>
                          </div>
                        </td>
                        {/* Email */}
                        <td className="px-5 py-4 text-slate-500 font-medium font-mono text-[11px]">{u.email}</td>
                        {/* Structure */}
                        <td className="px-5 py-4">
                          <span title={u.institutionNom || 'Non définie'} className="inline-block max-w-[160px] truncate text-xs font-medium text-slate-700 px-2.5 py-1 bg-slate-100/70 rounded-lg border border-slate-200/60 align-bottom">
                            {u.institutionNom || 'Non définie'}
                          </span>
                        </td>
                        {/* Role */}
                        <td className="px-5 py-4">
                          <span className={badge.className}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${badge.dot}`} />
                            {badge.label}
                          </span>
                        </td>
                        {/* Status toggle */}
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <button type="button" onClick={() => handleToggleStatus(u)}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 ${u.actif ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30' : 'bg-slate-200'}`}
                              aria-checked={u.actif} title={u.actif ? 'Désactiver le compte' : 'Activer le compte'}>
                              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${u.actif ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>
                        </td>
                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Edit button */}
                            <button type="button" onClick={() => setEditingUser(u)}
                              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              title="Modifier l'utilisateur">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>

                            {/* Inspect button */}
                            <button type="button" onClick={() => setAuditingUser(u)}
                              className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                              title="Inspecter le profil">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>

                            {/* Assign button */}
                            {isAssoc && (
                              <button type="button" onClick={() => setAssigningUser(u)}
                                className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                                title="Assigner des fonctionnaires">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </button>
                            )}

                            {/* Delete button */}
                            <button type="button" onClick={() => setDeletingUser(u)}
                              className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                              title="Supprimer cet utilisateur">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
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

        {/* Edit User Modal */}
        {editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSaved={(updatedData) => {
              addLog('UPDATE_USER', `Profil utilisateur mis à jour : ${updatedData.email}`, currentUser?.email);
              setSuccess(`Le profil de ${updatedData.prenom} a été mis à jour.`);
              setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...updatedData } : u));
              setEditingUser(null);
              setTimeout(() => setSuccess(''), 4000);
            }}
          />
        )}

        {/* Assign Staff Modal */}
        {assigningUser && (
          <AssignStaffModal
            association={assigningUser}
            onClose={() => setAssigningUser(null)}
            onSaved={handleAssignSaved}
          />
        )}

        {/* User Audit Modal */}
        {auditingUser && (
          <UserAuditModal
            user={auditingUser}
            onClose={() => setAuditingUser(null)}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deletingUser && (
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
                    <h3 className="font-bold text-slate-900 text-sm">Confirmation de suppression</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Cette action est irréversible</p>
                  </div>
                </div>
                <button onClick={() => setDeletingUser(null)} disabled={isDeleteLoading}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150 cursor-pointer active:scale-95">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                  Êtes-vous absolument sûr de vouloir supprimer définitivement le compte de{' '}
                  <strong className="text-slate-900">{deletingUser.prenom} {deletingUser.nom}</strong> ?
                </p>
                <div className="p-4 bg-rose-50/80 text-rose-900 border border-rose-100 rounded-xl text-xs leading-relaxed space-y-2">
                  <p className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-rose-700">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Conséquences de cette action :
                  </p>
                  <ul className="list-disc pl-4 space-y-1 font-medium text-[11px] text-rose-800">
                    <li>Suppression de sa fiche utilisateur.</li>
                    <li>Suppression de tous les messages envoyés et reçus par cet utilisateur.</li>
                    <li>Suppression des pièces jointes associées à ces messages.</li>
                    <li>Suppression automatique des fils de discussion devenant vides.</li>
                  </ul>
                  <p className="font-semibold text-rose-700 italic">Cette action est définitive et irréversible.</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/60 border-t border-slate-100">
                <button type="button" onClick={() => setDeletingUser(null)} disabled={isDeleteLoading}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-xl transition-all duration-150 border border-slate-200 cursor-pointer active:scale-[0.98]">
                  Annuler
                </button>
                <button type="button" onClick={handleDeleteConfirm} disabled={isDeleteLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-md shadow-rose-500/20 transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-[0.98]">
                  {isDeleteLoading ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Suppression…</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>Confirmer la suppression</>
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
