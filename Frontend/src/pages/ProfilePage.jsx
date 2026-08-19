import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  ShieldCheck,
  KeyRound,
  Lock,
  Pencil,
  X,
  Check,
  LogOut,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  BadgeCheck,
  Fingerprint,
  Wifi,
  Eye,
  EyeOff,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const ROLE = {
  ADMIN:         'Administrateur',
  FONCTIONNAIRE: 'Fonctionnaire',
  ASSOCIATION:   'Association',
};

function detectRole(user) {
  if (!user) return ROLE.FONCTIONNAIRE;
  return user.role ?? ROLE.FONCTIONNAIRE;
}

/** Returns theme tokens based on role */
function roleTheme(role) {
  if (role === ROLE.ASSOCIATION) {
    return {
      accent:         '#0D9488',
      gradientBanner: 'linear-gradient(135deg, #0F172A 0%, #134E4A 60%, #0D9488 100%)',
      badgeBg:        'bg-teal-600',
      badgeBgLight:   'bg-teal-50',
      badgeText:      'text-teal-700',
      badgeBorder:    'border-teal-200',
      avatarGrad:     'linear-gradient(135deg, #134E4A, #0D9488)',
      ringColor:      'ring-teal-400/40',
      btnPrimary:     'bg-teal-600 hover:bg-teal-700 focus:ring-4 focus:ring-teal-300',
      editRing:       'focus:border-teal-500 focus:ring-2 focus:ring-teal-100',
      iconColor:      'text-teal-600',
    };
  }
  return {
    accent:         '#4F46E5',
    gradientBanner: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #1E3A5F 100%)',
    badgeBg:        'bg-indigo-600',
    badgeBgLight:   'bg-indigo-50',
    badgeText:      'text-indigo-700',
    badgeBorder:    'border-indigo-200',
    avatarGrad:     'linear-gradient(135deg, #1e293b, #3730a3)',
    ringColor:      'ring-indigo-400/40',
    btnPrimary:     'bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300',
    editRing:       'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100',
    iconColor:      'text-indigo-600',
  };
}

/** Bilingual string maps */
function useStrings(role) {
  const isAdmin = role === ROLE.ADMIN;
  const isRTL   = role !== ROLE.ADMIN;

  return {
    isAdmin,
    isRTL,
    back:             isAdmin ? 'Retour'                                              : 'رجوع',
    breadcrumb:       isAdmin ? 'Mon Profil'                                          : 'ملفي الشخصي',
    logout:           isAdmin ? 'Déconnexion'                                         : 'تسجيل الخروج',
    statusActive:     isAdmin ? 'Session active'                                      : 'متصل الآن',
    cardATitle:       isAdmin ? 'Informations personnelles & Rôle'                    : 'المعلومات الشخصية والدور المؤسسي',
    labelPrenom:      isAdmin ? 'Prénom'                                              : 'الاسم الشخصي',
    labelNom:         isAdmin ? 'Nom de famille'                                      : 'الاسم العائلي',
    labelPhone:       isAdmin ? 'Téléphone professionnel'                             : 'الهاتف المهني',
    phoneDemo:        isAdmin ? 'Non synchronisé'                                     : 'غير متزامن',
    phoneDemoTip:     isAdmin
      ? 'Ce champ est une préférence locale non persistée en base de données.'
      : 'هذا الحقل تفضيل محلي غير محفوظ في قاعدة البيانات.',
    editBtn:          isAdmin ? 'Modifier'                                            : 'تعديل',
    cancelBtn:        isAdmin ? 'Annuler'                                             : 'إلغاء',
    saveBtn:          isAdmin ? 'Enregistrer'                                         : 'حفظ',
    savingBtn:        isAdmin ? 'Enregistrement…'                                     : 'جارٍ الحفظ…',
    lockedTip:        isAdmin ? "Verrouillé par l'administration CSPJ"                : 'مقفل من طرف إدارة CSPJ',
    editableNote:     isAdmin
      ? "Les champs marqués ✎ sont modifiables. Le rôle et la structure sont verrouillés."
      : 'الحقول المعلّمة بـ ✎ قابلة للتعديل. الدور والهيكل مقفلان.',
    labelRole:        isAdmin ? 'Rôle système'                                        : 'الدور في النظام',
    labelInstitution: isAdmin ? 'Structure / Institution'                             : 'المؤسسة / الهيكل',
    labelMatricule:   isAdmin ? 'Identifiant système'                                 : 'معرّف النظام',
    labelAssocName:   isAdmin ? "Nom de l'association"                                : 'اسم الجمعية',
    labelRepStatus:   isAdmin ? 'Statut représentant'                                 : 'صفة الممثل الرسمي',
    labelDirection:   isAdmin ? 'Direction / Service'                                 : 'المديرية / المصلحة',
    readOnlyNote:     isAdmin
      ? "Ces informations sont définies par l'administration CSPJ."
      : 'هذه المعلومات يحددها فريق إدارة CSPJ.',
    cardBTitle:       isAdmin ? 'Sécurité & Authentification'                         : 'الأمان والمصادقة',
    label2FA:         isAdmin ? 'Double authentification (TOTP)'                      : 'المصادقة الثنائية (TOTP)',
    status2FAOn:      isAdmin ? 'Activé'                                              : 'مُفعَّل',
    changePwdBtn:     isAdmin ? 'Changer le mot de passe'                             : 'تغيير كلمة المرور',
    changePwdTitle:   isAdmin ? 'Changer le mot de passe'                             : 'تغيير كلمة المرور',
    labelCurrentPwd:  isAdmin ? 'Mot de passe actuel'                                 : 'كلمة المرور الحالية',
    labelNewPwd:      isAdmin ? 'Nouveau mot de passe'                                : 'كلمة المرور الجديدة',
    labelConfirmPwd:  isAdmin ? 'Confirmer le nouveau mot de passe'                   : 'تأكيد كلمة المرور الجديدة',
    changePwdSubmit:  isAdmin ? 'Mettre à jour'                                       : 'تحديث',
    changePwdCancel:  isAdmin ? 'Annuler'                                             : 'إلغاء',
    pwdMismatch:      isAdmin ? 'Les mots de passe ne correspondent pas.'             : 'كلمات المرور غير متطابقة.',
    pwdTooShort:      isAdmin ? 'Le mot de passe doit contenir au moins 8 caractères.': 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل.',
    pwdRequired:      isAdmin ? 'Tous les champs sont requis.'                        : 'جميع الحقول مطلوبة.',
    pwdSuccess:       isAdmin ? 'Mot de passe mis à jour avec succès.'               : 'تم تحديث كلمة المرور بنجاح.',
    saveSuccess:      isAdmin ? 'Profil mis à jour avec succès.'                      : 'تم تحديث الملف الشخصي بنجاح.',
    saveError:        isAdmin ? 'Échec de la mise à jour. Veuillez réessayer.'        : 'فشل التحديث. يرجى المحاولة مجددًا.',
    fieldRequired:    isAdmin ? 'Tous les champs requis doivent être remplis.'        : 'يجب ملء جميع الحقول المطلوبة.',
    securityNote:     isAdmin
      ? 'Session protégée par TLS 1.3. Pensez à vous déconnecter après usage.'
      : 'جلستك محمية بتشفير TLS 1.3. تأكد من تسجيل الخروج بعد الانتهاء.',
    footer: isAdmin
      ? 'CSPJ Mail © 2026 — Conseil Supérieur du Pouvoir Judiciaire — Tous droits réservés'
      : 'CSPJ Mail © 2026 — المجلس الأعلى للسلطة القضائية — جميع الحقوق محفوظة',
    quickAction: isAdmin ? 'Action rapide' : 'إجراء سريع',
  };
}

function getRoleBadgeLabel(role) {
  if (role === ROLE.ADMIN)         return 'Administrateur Système — CSPJ';
  if (role === ROLE.FONCTIONNAIRE) return 'إطار إداري — Fonctionnaire CSPJ';
  if (role === ROLE.ASSOCIATION)   return 'جمعية شريكة — Association Partenaire';
  return role ?? '—';
}

function getRoleShortLabel(role) {
  if (role === ROLE.ADMIN)         return 'Admin';
  if (role === ROLE.FONCTIONNAIRE) return 'Fonctionnaire';
  if (role === ROLE.ASSOCIATION)   return 'Association';
  return role ?? '—';
}

/**
 * Reads the institution name directly from the API-supplied nomEntreprise field.
 * Falls back to a dash only when the value is genuinely absent.
 */
function getInstitutionLabel(user) {
  if (user?.nomEntreprise) return user.nomEntreprise;
  if (user?.institutionId == null) return '—';
  return `ID-${user.institutionId}`; // safety fallback while cache warms up
}

/**
 * Formats the role string from user object for display.
 * No fake labels — maps exact role strings or returns the raw value.
 */
function getRoleDisplayLabel(role, isAdmin) {
  if (!role) return '—';
  if (role === ROLE.ADMIN)         return 'Administrateur Système';
  if (role === ROLE.FONCTIONNAIRE) return isAdmin ? 'Fonctionnaire CSPJ' : 'وظيفة إدارية — Fonctionnaire';
  if (role === ROLE.ASSOCIATION)   return isAdmin ? 'Association Partenaire' : 'جمعية / Association';
  return role;
}

function getInitials(user) {
  if (!user) return 'U';
  return `${user.prenom?.charAt(0) ?? ''}${user.nom?.charAt(0) ?? ''}`.toUpperCase() || 'U';
}

// ─────────────────────────────────────────────────────────────────────────────
// DOT PATTERN
// ─────────────────────────────────────────────────────────────────────────────

const DOT_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%23ffffff'%3E%3Ccircle cx='40' cy='40' r='1.5'/%3E%3Ccircle cx='0' cy='0' r='1.5'/%3E%3Ccircle cx='80' cy='0' r='1.5'/%3E%3Ccircle cx='0' cy='80' r='1.5'/%3E%3Ccircle cx='80' cy='80' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`;

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }) {
  useEffect(() => {
    if (!message.text) return;
    const t = setTimeout(onDismiss, 4200);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message.text) return null;
  const isSuccess = message.type === 'success';
  const isRTL     = message.isRTL;

  return (
    <div
      className={`fixed top-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold ${isRTL ? 'left-5' : 'right-5'} ${isSuccess ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}
      style={{ minWidth: 280, maxWidth: 380 }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {isSuccess
        ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        : <AlertCircle  className="w-5 h-5 text-rose-500 flex-shrink-0" />
      }
      <span className="flex-1">{message.text}</span>
      <button onClick={onDismiss} className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-black/5 transition">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD INPUT WITH SHOW/HIDE TOGGLE
// ─────────────────────────────────────────────────────────────────────────────

function PasswordInput({ id, value, onChange, placeholder, className, disabled }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        dir="ltr"
        className={`pr-10 ${className}`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow(s => !s)}
        className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600 transition"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHANGE PASSWORD MODAL — REAL, FUNCTIONAL
// ─────────────────────────────────────────────────────────────────────────────

function ChangePasswordModal({ strings, theme, onClose, onSuccess }) {
  const { isRTL } = strings;

  const [currentPwd,   setCurrentPwd]   = useState('');
  const [newPwd,       setNewPwd]       = useState('');
  const [confirmPwd,   setConfirmPwd]   = useState('');
  const [error,        setError]        = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass = [
    'w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-800',
    'bg-slate-50/60 focus:bg-white outline-none transition duration-150',
    'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' ');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPwd.trim() || !newPwd.trim() || !confirmPwd.trim()) {
      setError(strings.pwdRequired);
      return;
    }
    if (newPwd !== confirmPwd) {
      setError(strings.pwdMismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: currentPwd,
        newPassword:     newPwd,
      });
      onSuccess({ type: 'success', text: strings.pwdSuccess, isRTL });
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        strings.saveError;
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden ${isRTL ? 'text-right' : 'text-left'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="relative px-6 py-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #1E3A5F 100%)' }}>
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: DOT_PATTERN, backgroundSize: '40px 40px' }} />
          <div className="relative flex items-center justify-between">
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-white font-bold text-sm">{strings.changePwdTitle}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Current password */}
          <div className="space-y-1.5">
            <label htmlFor="pwd-current" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {strings.labelCurrentPwd}
            </label>
            <PasswordInput
              id="pwd-current"
              value={currentPwd}
              onChange={e => setCurrentPwd(e.target.value)}
              placeholder="••••••••"
              disabled={isSubmitting}
              className={inputClass}
            />
          </div>

          {/* New password */}
          <div className="space-y-1.5">
            <label htmlFor="pwd-new" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {strings.labelNewPwd}
            </label>
            <PasswordInput
              id="pwd-new"
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              placeholder="••••••••"
              disabled={isSubmitting}
              className={inputClass}
            />
          </div>

          {/* Confirm new password */}
          <div className="space-y-1.5">
            <label htmlFor="pwd-confirm" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {strings.labelConfirmPwd}
            </label>
            <PasswordInput
              id="pwd-confirm"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              placeholder="••••••••"
              disabled={isSubmitting}
              className={inputClass}
            />
          </div>

          {/* Validation error */}
          {error && (
            <div className={`flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 font-medium leading-snug">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className={`flex items-center gap-3 pt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
            >
              {strings.changePwdCancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl text-white transition shadow-sm disabled:opacity-60 bg-slate-900 hover:bg-slate-800 focus:ring-4 focus:ring-slate-300"
            >
              {isSubmitting && (
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {strings.changePwdSubmit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELD ROW
// ─────────────────────────────────────────────────────────────────────────────

function FieldRow({
  icon: Icon,
  label,
  value,
  forceDir,
  editable  = false,
  locked    = false,
  isEditing = false,
  editValue,
  onEditChange,
  type      = 'text',
  isRTL,
  theme,
  lockedTip,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && editable && !locked && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing, editable, locked]);

  const displayValue = value != null && value !== '' ? value : '—';

  return (
    <div className={`flex items-center gap-3 py-3 px-4 border-b border-slate-100 last:border-b-0 group transition-colors hover:bg-slate-50/60 ${isRTL ? 'flex-row-reverse' : ''}`}>
      {/* Icon */}
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${locked ? 'bg-slate-100' : theme.badgeBgLight}`}>
        {locked
          ? <Lock className="w-3 h-3 text-slate-400" />
          : <Icon className={`w-3 h-3 ${theme.iconColor}`} />
        }
      </div>

      {/* Label + Value */}
      <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className={`flex items-center gap-1.5 mb-0.5 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 leading-none">
            {label}
          </span>
          {locked && (
            <span
              title={lockedTip}
              className="inline-flex items-center gap-1 text-[8px] font-bold tracking-wider text-slate-400 bg-slate-100 border border-slate-200 rounded px-1 py-0.5 cursor-help select-none"
            >
              <Lock className="w-2 h-2" />
              {isRTL ? 'مقفل' : 'Verrouillé'}
            </span>
          )}
          {editable && !locked && (
            <Pencil className={`w-2.5 h-2.5 ${theme.iconColor} opacity-0 group-hover:opacity-40 transition-opacity`} />
          )}
        </div>

        {isEditing && editable && !locked ? (
          <input
            ref={inputRef}
            type={type}
            value={editValue ?? ''}
            onChange={(e) => onEditChange(e.target.value)}
            dir="ltr"
            className={`w-full px-2.5 py-1 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 text-left bg-slate-50 focus:bg-white outline-none transition ${theme.editRing}`}
          />
        ) : (
          <span
            dir={forceDir}
            className={`text-sm font-semibold text-slate-800 truncate block ${type === 'email' || forceDir === 'ltr' ? 'font-mono' : ''}`}
          >
            {displayValue}
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

function ProfileCard({ title, icon: TitleIcon, theme, isRTL, children, action }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className={`px-4 py-3 border-b border-slate-100 flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${theme.badgeBgLight}`}>
          <TitleIcon className={`w-3.5 h-3.5 ${theme.iconColor}`} />
        </div>
        <h2 className={`flex-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 ${isRTL ? 'text-right' : 'text-left'}`}>
          {title}
        </h2>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO BANNER — Compact horizontal layout
// ─────────────────────────────────────────────────────────────────────────────

function HeroBanner({ user, role, theme, strings }) {
  const { isRTL } = strings;
  const initials  = getInitials(user);
  const fullName  = user
    ? `${user.prenom ?? ''} ${user.nom ?? ''}`.trim() || '—'
    : '—';

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-md border border-white/20"
      style={{ background: theme.gradientBanner }}
    >
      {/* Dot watermark */}
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: DOT_PATTERN, backgroundSize: '40px 40px' }} />
      {/* Glow blob */}
      <div
        className="absolute -top-12 opacity-20 w-56 h-56 rounded-full blur-3xl pointer-events-none"
        style={{ background: theme.accent, [isRTL ? 'right' : 'left']: '-24px' }}
      />

      <div className={`relative flex items-center gap-4 px-5 py-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center text-white text-lg font-extrabold uppercase select-none border-2 border-white/20 ring-4 ${theme.ringColor}`}
            style={{ background: theme.avatarGrad }}
          >
            {initials}
          </div>
          {/* Online indicator */}
          <div className="absolute -bottom-1 -right-1 flex items-center gap-1 bg-white/10 backdrop-blur-sm border border-emerald-400/30 rounded-full px-1.5 py-0.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
          </div>
        </div>

        {/* Name / email */}
        <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h1 className="text-base font-extrabold text-white leading-tight truncate">{fullName}</h1>
          <p
            className="text-[11px] text-white/60 font-mono mt-0.5 truncate"
            dir="ltr"
            style={{ textAlign: isRTL ? 'right' : 'left' }}
          >
            {user?.email || '—'}
          </p>
        </div>

        {/* Role chip + online label */}
        <div className={`flex flex-col gap-1.5 flex-shrink-0 ${isRTL ? 'items-start' : 'items-end'}`}>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/90 bg-white/10 border border-white/20 rounded-xl px-2.5 py-1">
            <BadgeCheck className="w-3 h-3" />
            {getRoleShortLabel(role)}
          </span>
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-300 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {strings.statusActive}
          </span>
        </div>
      </div>

      {/* Role stripe */}
      <div className="relative border-t border-white/10 px-5 py-2">
        <p className={`text-[9px] font-bold tracking-[0.2em] uppercase text-white/30 select-none ${isRTL ? 'text-right' : 'text-left'}`}>
          {getRoleBadgeLabel(role)}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMBINED CARD A — Personal Info + Role & Institution (Left/Main column)
// ─────────────────────────────────────────────────────────────────────────────

function PersonalAndRoleCard({ user, role, theme, strings, onSaved }) {
  const { isRTL, isAdmin } = strings;
  const { updateProfile }  = useAuth();

  const [isEditing,  setIsEditing]  = useState(false);
  const [editPrenom, setEditPrenom] = useState('');
  const [editNom,    setEditNom]    = useState('');
  const [editEmail,  setEditEmail]  = useState('');
  const [editPhone,  setEditPhone]  = useState('');
  const [isSaving,   setIsSaving]   = useState(false);

  const handleEditStart = () => {
    setEditPrenom(user?.prenom ?? '');
    setEditNom(user?.nom ?? '');
    setEditEmail(user?.email ?? '');
    setEditPhone(user?.telephone ?? '');
    setIsEditing(true);
  };

  const handleCancel = () => setIsEditing(false);

  const handleSave = async () => {
    if (!editPrenom.trim() || !editNom.trim() || !editEmail.trim()) {
      onSaved({ type: 'error', text: strings.fieldRequired, isRTL });
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({
        prenom:    editPrenom,
        nom:       editNom,
        email:     editEmail,
        telephone: editPhone || null,
      });
      setIsEditing(false);
      onSaved({ type: 'success', text: strings.saveSuccess, isRTL });
    } catch (err) {
      onSaved({ type: 'error', text: err.message || strings.saveError, isRTL });
    } finally {
      setIsSaving(false);
    }
  };

  // Derived data — institution name comes from the API, no hardcoded IDs
  const roleLabel        = getRoleDisplayLabel(role, isAdmin);
  const institutionLabel = getInstitutionLabel(user);

  const cardAction = (
    <div className={`flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
      {!isEditing ? (
        <button
          onClick={handleEditStart}
          className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border transition hover:shadow-sm ${theme.badgeBgLight} ${theme.badgeText} ${theme.badgeBorder}`}
        >
          <Pencil className="w-2.5 h-2.5" />
          {strings.editBtn}
        </button>
      ) : (
        <>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition disabled:opacity-50"
          >
            <X className="w-2.5 h-2.5" />
            {strings.cancelBtn}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg text-white transition shadow-sm disabled:opacity-60 ${theme.btnPrimary}`}
          >
            {isSaving
              ? <span className="w-2.5 h-2.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Check className="w-2.5 h-2.5" />
            }
            {isSaving ? strings.savingBtn : strings.saveBtn}
          </button>
        </>
      )}
    </div>
  );

  return (
    <ProfileCard title={strings.cardATitle} icon={User} theme={theme} isRTL={isRTL} action={cardAction}>
      <div>
        {/* Personal fields */}
        <FieldRow
          icon={User} label={strings.labelPrenom}
          value={user?.prenom}
          editable isEditing={isEditing}
          editValue={editPrenom} onEditChange={setEditPrenom}
          isRTL={isRTL} theme={theme} lockedTip={strings.lockedTip}
        />
        <FieldRow
          icon={User} label={strings.labelNom}
          value={user?.nom}
          editable isEditing={isEditing}
          editValue={editNom} onEditChange={setEditNom}
          isRTL={isRTL} theme={theme} lockedTip={strings.lockedTip}
        />
        <FieldRow
          icon={Mail} label={isAdmin ? 'Adresse e-mail' : 'البريد الإلكتروني'}
          value={user?.email}
          forceDir="ltr" type="email"
          editable isEditing={isEditing}
          editValue={editEmail} onEditChange={setEditEmail}
          isRTL={isRTL} theme={theme} lockedTip={strings.lockedTip}
        />

        {/* Phone — persisted in DB, editable */}
        <FieldRow
          icon={Phone} label={strings.labelPhone}
          value={user?.telephone}
          forceDir="ltr"
          editable isEditing={isEditing}
          editValue={editPhone} onEditChange={setEditPhone}
          isRTL={isRTL} theme={theme} lockedTip={strings.lockedTip}
        />

        {/* Institutional section divider */}
        <div className={`px-4 pt-3.5 pb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
            {isAdmin ? 'Informations institutionnelles' : 'المعلومات المؤسسية'}
          </span>
        </div>

        {/* Role — from user.role, no fake values */}
        <FieldRow
          icon={Shield} label={strings.labelRole}
          value={roleLabel}
          locked isRTL={isRTL} theme={theme} lockedTip={strings.lockedTip}
        />

        {/* Institution — real name from API response */}
        <FieldRow
          icon={Building2}
          label={role === ROLE.ASSOCIATION ? strings.labelAssocName : strings.labelInstitution}
          value={institutionLabel}
          locked isRTL={isRTL} theme={theme} lockedTip={strings.lockedTip}
        />
      </div>

      <div className={`px-4 py-2.5 bg-slate-50 border-t border-slate-100 ${isRTL ? 'text-right' : 'text-left'}`}>
        <p className="text-[9px] text-slate-400 leading-relaxed">{strings.editableNote}</p>
      </div>
    </ProfileCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD B — Security & Authentication (Right/Side column)
// ─────────────────────────────────────────────────────────────────────────────

function SecurityCard({ theme, strings, onChangePwd }) {
  const { isRTL } = strings;

  return (
    <ProfileCard title={strings.cardBTitle} icon={ShieldCheck} theme={theme} isRTL={isRTL}>
      <div>
        {/* 2FA status */}
        <div className={`flex items-center gap-3 py-3 px-4 border-b border-slate-100 hover:bg-slate-50/60 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-50">
            <Fingerprint className="w-3 h-3 text-emerald-600" />
          </div>
          <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
              {strings.label2FA}
            </p>
            <div className={`flex items-center gap-2 flex-wrap ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-0.5">
                <ShieldCheck className="w-3 h-3" />
                {strings.status2FAOn}
              </span>
              <span className="text-[9px] text-slate-400 font-mono" dir="ltr">TOTP / RFC 6238</span>
            </div>
          </div>
        </div>

        {/* Change password button */}
        <div className={`flex items-center gap-3 py-4 px-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-rose-50">
            <KeyRound className="w-3 h-3 text-rose-500" />
          </div>
          <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              {strings.quickAction}
            </p>
            <button
              id="btn-change-password"
              onClick={onChangePwd}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              {strings.changePwdBtn}
            </button>
          </div>
        </div>
      </div>

      {/* Security footer note */}
      <div className={`px-4 py-2.5 border-t border-slate-100 flex items-start gap-2 bg-slate-50 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
        <Wifi className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="text-[9px] text-slate-400 leading-relaxed">{strings.securityNote}</p>
      </div>
    </ProfileCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const role    = detectRole(user);
  const theme   = roleTheme(role);
  const strings = useStrings(role);
  const { isRTL } = strings;

  const [toast,        setToast]        = useState({ type: '', text: '', isRTL: false });
  const [showPwdModal, setShowPwdModal] = useState(false);

  const BackIcon = isRTL ? ChevronRight : ChevronLeft;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <Toast message={toast} onDismiss={() => setToast({ type: '', text: '', isRTL: false })} />

      {showPwdModal && (
        <ChangePasswordModal
          strings={strings}
          theme={theme}
          onClose={() => setShowPwdModal(false)}
          onSuccess={setToast}
        />
      )}

      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        className="flex flex-col flex-1 min-h-0 overflow-y-auto"
        style={{ background: 'linear-gradient(160deg, #EFF6FF 0%, #F0F4F8 50%, #F1F5F9 100%)' }}
      >
        {/* Top Nav */}
        <header
          className="bg-white/80 backdrop-blur-md border-b border-slate-200/70 flex items-center justify-between px-5 shrink-0 sticky top-0 z-10 shadow-sm"
          style={{ height: '52px' }}
        >
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors group ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <BackIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            {strings.back}
          </button>

          <nav className={`flex items-center gap-1.5 text-[11px] font-medium text-slate-400 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="font-bold text-slate-600">CSPJ Mail</span>
            <span className="text-slate-300">/</span>
            <span>{strings.breadcrumb}</span>
          </nav>

          <button
            onClick={logout}
            className={`flex items-center gap-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl px-3.5 py-1.5 hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50 transition-all duration-150 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <LogOut className="w-3.5 h-3.5" />
            {strings.logout}
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex justify-center px-4 sm:px-6 py-6">
          <div className="w-full max-w-3xl space-y-4">

            {/* Hero banner — full width */}
            <HeroBanner user={user} role={role} theme={theme} strings={strings} />

            {/* 2-column responsive grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">
              {/* Left: Personal + Institutional combined */}
              <PersonalAndRoleCard
                user={user}
                role={role}
                theme={theme}
                strings={strings}
                onSaved={setToast}
              />

              {/* Right: Security */}
              <SecurityCard
                theme={theme}
                strings={strings}
                onChangePwd={() => setShowPwdModal(true)}
              />
            </div>

            {/* Footer */}
            <p
              className={`text-center text-[10px] text-slate-400 pb-3 ${isRTL ? 'font-medium' : ''}`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {strings.footer}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
