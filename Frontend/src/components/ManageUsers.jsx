import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLogs } from '../context/LogContext';
import {
  Users, UserPlus, Search, RefreshCw, Edit2, Trash2,
  UserCheck, Shield, Eye, X, Check, AlertTriangle,
  Building, Mail, Phone, Calendar, ShieldAlert, KeyRound
} from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-xs">
              {initials(association.prenom, association.nom)}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Assigner des Fonctionnaires</h3>
              <p className="text-slate-500 text-xs">
                {association.prenom} {association.nom} · {association.institutionNom || 'Association'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info notice */}
        <div className="px-6 pt-4 flex-shrink-0">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800">
            Sélectionnez les fonctionnaires avec lesquels ce compte associatif est autorisé à initier des échanges.
          </div>
        </div>

        {/* Search */}
        <div className="px-6 pt-3 flex-shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrer par nom, email ou institution…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
          {loadingInit ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Aucun fonctionnaire actif trouvé.
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map(f => {
                const checked = selectedIds.includes(f.id);
                return (
                  <label
                    key={f.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${checked
                        ? 'bg-blue-50/60 border-blue-300 text-blue-900'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(f.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-800">{f.prenom} {f.nom}</p>
                        <p className="text-[11px] text-slate-400">{f.email} {f.institutionNom ? `• ${f.institutionNom}` : ''}</p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex-shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            {selectedIds.length} sélectionné(s)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loadingInit}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Enregistrer</span>
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
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.trim(),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Modifier le profil utilisateur</h3>
            <p className="text-xs text-slate-500">Mise à jour des coordonnées et de la structure</p>
          </div>
          <button onClick={onClose} disabled={saving} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prénom</label>
              <input
                type="text"
                name="prenom"
                required
                value={formData.prenom}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nom</label>
              <input
                type="text"
                name="nom"
                required
                value={formData.nom}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse Email</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Structure / Institution</label>
            <select
              name="institutionId"
              required
              value={formData.institutionId}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 text-slate-800"
            >
              <option value="">Sélectionner une structure...</option>
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.nom}</option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-xl border border-slate-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Sauvegarder</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UserAuditModal
// ─────────────────────────────────────────────────────────────────────────────
function UserAuditModal({ user, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserLogs = async () => {
      try {
        const res = await api.get('/admin/audit-logs');
        const userLogs = (res.data || []).filter(l =>
          l.utilisateur?.toLowerCase() === user.email?.toLowerCase() ||
          l.description?.toLowerCase().includes(user.email?.toLowerCase())
        );
        setLogs(userLogs);
      } catch (err) {
        console.error("Erreur chargement logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserLogs();
  }, [user]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Journal d'activité de l'utilisateur</h3>
            <p className="text-xs text-slate-500">{user.prenom} {user.nom} ({user.email})</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Aucune activité enregistrée pour cet utilisateur.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {logs.map(log => (
                <div key={log.id} className="py-2.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                    <span className="font-semibold text-slate-600">{log.typeAction}</span>
                    <span>{new Date(log.dateHeure).toLocaleString('fr-FR')}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{log.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-xl border border-slate-200">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main ManageUsers Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ManageUsers() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { addLog } = useLogs();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modals state
  const [editingUser, setEditingUser] = useState(null);
  const [assigningUser, setAssigningUser] = useState(null);
  const [auditingUser, setAuditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [resetting2FaUser, setResetting2FaUser] = useState(null);
  const [isReset2FaLoading, setIsReset2FaLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Erreur lors du chargement des utilisateurs.');
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

  const handleReset2FaConfirm = async () => {
    if (!resetting2FaUser) return;
    setIsReset2FaLoading(true); setError(''); setSuccess('');
    try {
      await api.post(`/admin/users/${resetting2FaUser.id}/reset-2fa`);
      addLog('RESET_2FA', `2FA réinitialisé pour l'utilisateur ${resetting2FaUser.email}.`, currentUser?.email);
      setSuccess(`Le 2FA a été réinitialisé avec succès pour ${resetting2FaUser.prenom} ${resetting2FaUser.nom}.`);
      setUsers(prev => prev.map(u => u.id === resetting2FaUser.id ? { ...u, hasTwoFactor: false } : u));
      setResetting2FaUser(null);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Une erreur est survenue lors de la réinitialisation du 2FA.");
    } finally {
      setIsReset2FaLoading(false);
    }
  };

  const handleAssignSaved = (count) => {
    const name = `${assigningUser?.prenom} ${assigningUser?.nom}`;
    setSuccess(`✓ ${count} fonctionnaire(s) assigné(s) à ${name}.`);
    addLog('ASSIGN_FONCTIONNAIRES', `Assignations de ${assigningUser?.email} : ${count} fonctionnaire(s).`, currentUser?.email);
    setTimeout(() => setSuccess(''), 5000);
  };

  const getRoleBadge = (role) => {
    const r = (role || '').toLowerCase();
    if (r.includes('admin')) {
      return { label: 'Administrateur', className: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60', dot: 'bg-blue-500' };
    }
    if (r.includes('assoc')) {
      return { label: 'Association', className: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60', dot: 'bg-amber-500' };
    }
    return { label: 'Fonctionnaire', className: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60', dot: 'bg-emerald-500' };
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
    const matchesSearch = !q || (
      u.nom?.toLowerCase().includes(q) ||
      u.prenom?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      (u.institutionNom && u.institutionNom.toLowerCase().includes(q))
    );

    const matchesRole = roleFilter === 'ALL' || (
      roleFilter === 'ADMIN' ? u.role?.toLowerCase().includes('admin') :
        roleFilter === 'ASSOC' ? u.role?.toLowerCase().includes('assoc') :
          u.role?.toLowerCase() === 'fonctionnaire'
    );

    return matchesSearch && matchesRole;
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
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Gestion des Utilisateurs</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wider">
                Utilisateurs ({filteredUsers.length})
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Administration des profils, activation, suppression et assignation des comptes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Actualiser la liste"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={() => navigate('/create-user')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-xl text-xs font-semibold shadow-sm transition-all duration-150 active:scale-98 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nouveau Compte</span>
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

          {/* Filter & Search Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, structure..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 placeholder:text-slate-400 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:border-blue-600"
              >
                <option value="ALL">Tous les rôles</option>
                <option value="ADMIN">Administrateurs</option>
                <option value="FONC">Fonctionnaires</option>
                <option value="ASSOC">Associations</option>
              </select>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Répertoire des utilisateurs</span>
              <span className="text-xs text-slate-400 font-mono">{filteredUsers.length} comptes affichés</span>
            </div>

            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-xs font-medium">Chargement des utilisateurs en cours…</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center gap-2 text-center text-slate-400">
                <Users className="w-8 h-8 text-slate-300" />
                <h3 className="font-semibold text-slate-700 text-sm">Aucun utilisateur trouvé</h3>
                <p className="text-xs text-slate-400">{searchQuery ? 'Ajustez vos filtres de recherche.' : "Aucun utilisateur inscrit."}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 uppercase font-bold tracking-wider text-[10px]">
                      <th className="px-6 py-3.5">Nom & Prénom</th>
                      <th className="px-6 py-3.5">Email</th>
                      <th className="px-6 py-3.5">Structure</th>
                      <th className="px-6 py-3.5">Rôle</th>
                      <th className="px-6 py-3.5 text-center">Statut</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {filteredUsers.map(u => {
                      const badge = getRoleBadge(u.role);
                      const isAssoc = (u.role || '').toLowerCase().includes('assoc');

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs uppercase">
                                {initials(u.prenom, u.nom)}
                              </div>
                              <span>{u.prenom} {u.nom}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">{u.email}</td>

                          <td className="px-6 py-4">
                            <span className="text-xs font-medium text-slate-700 px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                              {u.institutionNom || 'Non définie'}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className={badge.className}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              {badge.label}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u)}
                              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${u.actif ? 'bg-emerald-500' : 'bg-slate-200'
                                }`}
                              title={u.actif ? 'Désactiver le compte' : 'Activer le compte'}
                            >
                              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${u.actif ? 'translate-x-4' : 'translate-x-0'
                                }`} />
                            </button>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit button */}
                              <button
                                onClick={() => setEditingUser(u)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                                title="Modifier l'utilisateur"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Audit logs inspect button */}
                              <button
                                onClick={() => setAuditingUser(u)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                                title="Inspecter l'activité"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Reset 2FA button */}
                              {u.hasTwoFactor && (
                                <button
                                  onClick={() => setResetting2FaUser(u)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                                  title="Réinitialiser la double authentification (2FA)"
                                >
                                  <ShieldAlert className="w-4 h-4" />
                                </button>
                              )}

                              {/* Assign button */}
                              {isAssoc && (
                                <button
                                  onClick={() => setAssigningUser(u)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                                  title="Assigner des fonctionnaires"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                              )}

                              {/* Delete button */}
                              <button
                                onClick={() => setDeletingUser(u)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                                title="Supprimer cet utilisateur"
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

      {/* Modals */}
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

      {assigningUser && (
        <AssignStaffModal
          association={assigningUser}
          onClose={() => setAssigningUser(null)}
          onSaved={handleAssignSaved}
        />
      )}

      {auditingUser && (
        <UserAuditModal
          user={auditingUser}
          onClose={() => setAuditingUser(null)}
        />
      )}

      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Confirmation de suppression</h3>
                  <p className="text-xs text-slate-500">Action irréversible</p>
                </div>
              </div>
              <button onClick={() => setDeletingUser(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-700 leading-relaxed">
                Êtes-vous sûr de vouloir supprimer définitivement le compte de{' '}
                <strong className="text-slate-900">{deletingUser.prenom} {deletingUser.nom}</strong> ({deletingUser.email}) ?
              </p>
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs space-y-1">
                <p className="font-semibold">Conséquences :</p>
                <p className="text-[11px]">Tous les messages et attachements associés seront purgés du système.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-3.5 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                disabled={isDeleteLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-xl border border-slate-200"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleteLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleteLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Reset Confirmation Modal */}
      {resetting2FaUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Réinitialisation du 2FA</h3>
                  <p className="text-xs text-slate-500">Double authentification (TOTP)</p>
                </div>
              </div>
              <button onClick={() => setResetting2FaUser(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-700 leading-relaxed">
                Êtes-vous sûr de vouloir réinitialiser le 2FA pour cet utilisateur ?
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <p className="font-semibold text-slate-800">{resetting2FaUser.prenom} {resetting2FaUser.nom}</p>
                <p className="text-slate-500 font-mono text-[11px]">{resetting2FaUser.email}</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs space-y-1">
                <p className="font-semibold text-amber-900">Information importante :</p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Le secret 2FA actuel sera supprimé. L'utilisateur devra scanner un nouveau QR code dans son application Authenticator lors de sa prochaine connexion.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-3.5 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setResetting2FaUser(null)}
                disabled={isReset2FaLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-xl border border-slate-200"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleReset2FaConfirm}
                disabled={isReset2FaLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isReset2FaLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                <span>Réinitialiser 2FA</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
