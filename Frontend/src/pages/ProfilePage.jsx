import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  ShieldCheck,
  KeyRound,
  Clock,
  Hash,
  BadgeCheck,
  Lock,
  Pencil,
  X,
  Check,
  LogOut,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Fingerprint,
  Wifi,
  Info,
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
      accent:          '#0D9488',
      gradientBanner:  'linear-gradient(135deg, #0F172A 0%, #134E4A 60%, #0D9488 100%)',
      badgeBg:         'bg-teal-600',
      badgeBgLight:    'bg-teal-50',
      badgeText:       'text-teal-700',
      badgeBorder:     'border-teal-200',
      avatarGrad:      'linear-gradient(135deg, #134E4A, #0D9488)',
      ringColor:       'ring-teal-400/40',
      btnPrimary:      'bg-teal-600 hover:bg-teal-700 focus:ring-4 focus:ring-teal-300',
      editRing:        'focus:border-teal-500 focus:ring-4 focus:ring-teal-50',
      iconColor:       'text-teal-600',
    };
  }
  // Fonctionnaire & Admin → Indigo/Blue
  return {
    accent:          '#4F46E5',
    gradientBanner:  'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #1E3A5F 100%)',
    badgeBg:         'bg-indigo-600',
    badgeBgLight:    'bg-indigo-50',
    badgeText:       'text-indigo-700',
    badgeBorder:     'border-indigo-200',
    avatarGrad:      'linear-gradient(135deg, #1e293b, #3730a3)',
    ringColor:       'ring-indigo-400/40',
    btnPrimary:      'bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300',
    editRing:        'focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50',
    iconColor:       'text-indigo-600',
  };
}

/** Bilingual string maps – AR for non-admin, FR for admin */
function useStrings(role) {
  const isAdmin = role === ROLE.ADMIN;
  const isRTL   = role !== ROLE.ADMIN;

  return {
    isAdmin,
    isRTL,
    back:              isAdmin ? 'Retour'                                       : 'رجوع',
    breadcrumb:        isAdmin ? 'Mon Profil'                                   : 'ملفي الشخصي',
    logout:            isAdmin ? 'Déconnexion'                                  : 'تسجيل الخروج',
    statusActive:      isAdmin ? 'Session active'                               : 'متصل الآن',
    cardATitle:        isAdmin ? 'Informations personnelles'                    : 'المعلومات الشخصية',
    labelPrenom:       isAdmin ? 'Prénom'                                       : 'الاسم الشخصي',
    labelNom:          isAdmin ? 'Nom de famille'                               : 'الاسم العائلي',
    labelEmail:        isAdmin ? 'Adresse e-mail professionnelle'               : 'البريد الإلكتروني المهني',
    labelPhone:        isAdmin ? 'Téléphone professionnel'                      : 'الهاتف المهني',
    phoneDemo:         isAdmin ? 'Non synchronisé'                              : 'غير متزامن',
    phoneDemoTip:      isAdmin
      ? 'Ce champ est une préférence locale non persistée en base de données.'
      : 'هذا الحقل تفضيل محلي غير محفوظ في قاعدة البيانات.',
    editBtn:           isAdmin ? 'Modifier'                                     : 'تعديل',
    cancelBtn:         isAdmin ? 'Annuler'                                      : 'إلغاء',
    saveBtn:           isAdmin ? 'Enregistrer'                                  : 'حفظ التغييرات',
    savingBtn:         isAdmin ? 'Enregistrement…'                              : 'جارٍ الحفظ…',
    lockedTip:         isAdmin ? 'Verrouillé par l\'administration CSPJ'        : 'مقفل من طرف إدارة CSPJ',
    editableNote:      isAdmin
      ? 'Les champs marqués ✎ sont modifiables. Le rôle et la structure sont verrouillés par l\'administration CSPJ.'
      : 'الحقول المعلّمة بـ ✎ قابلة للتعديل. الدور والهيكل مقفلان من طرف إدارة CSPJ.',
    cardBTitle:        isAdmin ? 'Rôle & Organisation'                          : 'الدور والهيكل المؤسسي',
    labelRole:         isAdmin ? 'Rôle système'                                 : 'الدور في النظام',
    labelInstitution:  isAdmin ? 'Structure / Institution'                      : 'المؤسسة / الهيكل',
    labelMatricule:    isAdmin ? 'Identifiant système'                          : 'معرّف النظام',
    labelAssocName:    isAdmin ? 'Nom de l\'association'                        : 'اسم الجمعية',
    labelRepStatus:    isAdmin ? 'Statut représentant'                          : 'صفة الممثل الرسمي',
    labelDirection:    isAdmin ? 'Direction / Service'                          : 'المديرية / المصلحة',
    readOnlyNote:      isAdmin
      ? 'Ces informations sont définies par l\'administration CSPJ.'
      : 'هذه المعلومات يحددها فريق إدارة CSPJ.',
    cardCTitle:        isAdmin ? 'Sécurité & Authentification'                  : 'الأمان والمصادقة',
    label2FA:          isAdmin ? 'Double authentification (TOTP)'               : 'المصادقة الثنائية (TOTP)',
    status2FAOn:       isAdmin ? 'Activé'                                       : 'مُفعَّل',
    labelLastLogin:    isAdmin ? 'Session courante'                             : 'الجلسة الحالية',
    sessionActive:     isAdmin ? 'Active — session en cours'                    : 'نشطة — جلسة جارية',
    changePwdBtn:      isAdmin ? 'Changer le mot de passe'                      : 'تغيير كلمة المرور',
    changePwdTitle:    isAdmin ? 'Réinitialisation du mot de passe'             : 'إعادة تعيين كلمة المرور',
    changePwdBody:     isAdmin
      ? 'Vous allez être redirigé vers le flux de réinitialisation sécurisé de CSPJ Mail. Votre session sera maintenue.'
      : 'سيتم توجيهك إلى مسار إعادة تعيين كلمة المرور الآمن الخاص بـ CSPJ Mail. ستظل جلستك نشطة.',
    changePwdConfirm:  isAdmin ? 'Continuer'                                    : 'متابعة',
    changePwdCancel:   isAdmin ? 'Annuler'                                      : 'إلغاء',
    saveSuccess:       isAdmin ? 'Profil mis à jour avec succès.'               : 'تم تحديث الملف الشخصي بنجاح.',
    saveError:         isAdmin ? 'Échec de la mise à jour. Veuillez réessayer.' : 'فشل التحديث. يرجى المحاولة مجددًا.',
    fieldRequired:     isAdmin ? 'Tous les champs requis doivent être remplis.' : 'يجب ملء جميع الحقول المطلوبة.',
    securityNote:      isAdmin
      ? 'Votre session est protégée par TLS 1.3 et la double authentification. Pensez à vous déconnecter après usage.'
      : 'جلستك محمية بتشفير TLS 1.3 والمصادقة الثنائية. تأكد من تسجيل الخروج بعد الانتهاء من عملك.',
    footer:            isAdmin
      ? 'CSPJ Mail © 2026 — Conseil Supérieur du Pouvoir Judiciaire — Tous droits réservés'
      : 'CSPJ Mail © 2026 — المجلس الأعلى للسلطة القضائية — جميع الحقوق محفوظة',
    quickAction:       isAdmin ? 'Action rapide' : 'إجراء سريع',
    folders:           isAdmin ? 'Dossiers' : 'المجلدات',
  };
}

function getRoleBadgeLabel(role) {
  if (role === ROLE.ADMIN)         return 'Administrateur Système — CSPJ';
  if (role === ROLE.FONCTIONNAIRE) return 'إطار إداري — Fonctionnaire CSPJ';
  if (role === ROLE.ASSOCIATION)   return 'جمعية شريكة — Association Partenaire';
  return role;
}

function getRoleShortLabel(role) {
  if (role === ROLE.ADMIN)         return 'Admin';
  if (role === ROLE.FONCTIONNAIRE) return 'Fonctionnaire';
  if (role === ROLE.ASSOCIATION)   return 'Association';
  return role;
}

function getInstitutionLabel(institutionId, role) {
  const isAdmin = role === ROLE.ADMIN;
  if (institutionId === 1) return isAdmin
    ? 'CSPJ — Conseil Supérieur du Pouvoir Judiciaire'
    : 'المجلس الأعلى للسلطة القضائية — CSPJ';
  if (institutionId === 2) return isAdmin
    ? 'Association des Magistrats Marocains'
    : 'جمعية القضاة المغاربة';
  return isAdmin ? 'Structure externe' : 'هيكل خارجي';
}

function getRoleDisplayLabel(role) {
  if (role === ROLE.ADMIN)         return 'Administrateur Système';
  if (role === ROLE.FONCTIONNAIRE) return 'موظف إداري — Fonctionnaire';
  if (role === ROLE.ASSOCIATION)   return 'ممثل جمعية — Association';
  return role;
}

function getInitials(user) {
  if (!user) return 'U';
  return `${user.prenom?.charAt(0) ?? ''}${user.nom?.charAt(0) ?? ''}`.toUpperCase() || 'U';
}

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
      className={`
        fixed top-5 z-[100] flex items-center gap-3
        px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold
        ${isRTL ? 'left-5' : 'right-5'}
        ${isSuccess
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : 'bg-rose-50 text-rose-800 border-rose-200'
        }
      `}
      style={{ minWidth: 280, maxWidth: 380 }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {isSuccess
        ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        : <AlertCircle  className="w-5 h-5 text-rose-500 flex-shrink-0" />
      }
      <span className="flex-1">{message.text}</span>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-black/5 transition"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHANGE PASSWORD MODAL
// ─────────────────────────────────────────────────────────────────────────────

const DOT_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%23ffffff'%3E%3Ccircle cx='40' cy='40' r='1.5'/%3E%3Ccircle cx='0' cy='0' r='1.5'/%3E%3Ccircle cx='80' cy='0' r='1.5'/%3E%3Ccircle cx='0' cy='80' r='1.5'/%3E%3Ccircle cx='80' cy='80' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`;

function ChangePasswordModal({ strings, theme, onConfirm, onClose }) {
  const { isRTL, isAdmin } = strings;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden ${isRTL ? 'text-right' : 'text-left'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="relative px-6 py-5 overflow-hidden" style={{ background: theme.gradientBanner }}>
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: DOT_PATTERN, backgroundSize: '40px 40px' }}
          />
          <div className="relative flex items-center justify-between">
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white font-bold text-sm">{strings.changePwdTitle}</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          <div className={`flex items-start gap-3 p-4 rounded-2xl border ${isAdmin ? 'bg-indigo-50 border-indigo-100' : 'bg-teal-50 border-teal-100'}`}>
            <Info className={`w-5 h-5 mt-0.5 flex-shrink-0 ${theme.iconColor}`} />
            <p className="text-sm text-slate-700 leading-relaxed">{strings.changePwdBody}</p>
          </div>

          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={onClose}
              className="flex-1 px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              {strings.changePwdCancel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-5 py-2.5 text-sm font-bold rounded-xl text-white transition shadow-sm ${theme.btnPrimary}`}
            >
              {strings.changePwdConfirm}
            </button>
          </div>
        </div>
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
  badge,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && editable && !locked && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing, editable, locked]);

  return (
    <div
      className={`flex items-center gap-4 py-3.5 px-5 border-b border-slate-100 last:border-b-0 group transition-colors hover:bg-slate-50/60 ${isRTL ? 'flex-row-reverse' : ''}`}
    >
      {/* Icon container */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${locked ? 'bg-slate-100' : theme.badgeBgLight}`}>
        {locked
          ? <Lock className="w-3.5 h-3.5 text-slate-400" />
          : <Icon className={`w-3.5 h-3.5 ${theme.iconColor}`} />
        }
      </div>

      {/* Label + Value */}
      <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
        {/* Label row */}
        <div className={`flex items-center gap-2 mb-0.5 flex-wrap ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none">
            {label}
          </span>
          {locked && (
            <span
              title={lockedTip}
              className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider text-slate-400 bg-slate-100 border border-slate-200 rounded-md px-1.5 py-0.5 cursor-help select-none"
            >
              <Lock className="w-2.5 h-2.5" />
              {isRTL ? 'مقفل' : 'Verrouillé'}
            </span>
          )}
          {editable && !locked && (
            <Pencil className={`w-3 h-3 ${theme.iconColor} opacity-0 group-hover:opacity-50 transition-opacity`} />
          )}
        </div>

        {/* Edit input OR read-only value */}
        {isEditing && editable && !locked ? (
          <input
            ref={inputRef}
            type={type}
            value={editValue ?? ''}
            onChange={(e) => onEditChange(e.target.value)}
            dir={forceDir ?? (isRTL ? 'rtl' : 'ltr')}
            className={`w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 bg-slate-50/60 focus:bg-white outline-none transition duration-150 ${theme.editRing}`}
          />
        ) : (
          <div className={`flex items-center gap-2 flex-wrap ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
            <span
              dir={forceDir}
              className={`text-sm font-semibold text-slate-800 truncate ${type === 'email' || forceDir === 'ltr' ? 'font-mono' : ''}`}
            >
              {value || '—'}
            </span>
            {badge}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE CARD WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

function ProfileCard({ title, icon: TitleIcon, theme, isRTL, children, action }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 shadow-md overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-4 border-b border-slate-100 flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${theme.badgeBgLight}`}>
          <TitleIcon className={`w-4 h-4 ${theme.iconColor}`} />
        </div>
        <h2 className={`flex-1 text-xs font-bold uppercase tracking-widest text-slate-600 ${isRTL ? 'text-right' : 'text-left'}`}>
          {title}
        </h2>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO CARD
// ─────────────────────────────────────────────────────────────────────────────

function HeroCard({ user, role, theme, strings }) {
  const { isRTL } = strings;
  const initials  = getInitials(user);
  const fullName  = user ? `${user.prenom} ${user.nom}` : '—';

  return (
    <div className="rounded-3xl overflow-hidden shadow-lg border border-white/40">
      {/* Banner */}
      <div className="relative h-40 overflow-hidden" style={{ background: theme.gradientBanner }}>
        {/* Dot watermark */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: DOT_PATTERN, backgroundSize: '40px 40px' }}
        />
        {/* Glow blobs */}
        <div
          className="absolute -top-10 opacity-20 w-64 h-64 rounded-full blur-3xl"
          style={{ background: theme.accent, [isRTL ? 'right' : 'left']: '-32px' }}
        />
        <div
          className="absolute bottom-0 opacity-10 w-48 h-32 rounded-full blur-2xl"
          style={{ background: '#60A5FA', [isRTL ? 'left' : 'right']: '10%' }}
        />
        {/* Corner stamp */}
        <span
          className={`absolute top-4 ${isRTL ? 'left-5' : 'right-5'} text-[9px] font-bold tracking-[0.25em] uppercase text-white/30 select-none`}
        >
          CSPJ Mail — Espace Sécurisé
        </span>
      </div>

      {/* Avatar + info */}
      <div
        className="relative px-6 pb-6"
        style={{ background: 'linear-gradient(to bottom, #f8fafc, #ffffff)' }}
      >
        <div className={`flex items-end gap-5 ${isRTL ? 'flex-row-reverse' : ''} -mt-14`}>
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className={`w-24 h-24 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold uppercase border-4 border-white shadow-xl select-none ring-4 ${theme.ringColor}`}
              style={{ background: theme.avatarGrad }}
            >
              {initials}
            </div>
            {/* Live status badge */}
            <div
              className={`absolute -bottom-1 ${isRTL ? '-left-1' : '-right-1'} flex items-center gap-1 bg-white border border-emerald-100 rounded-xl px-2 py-1 shadow-sm`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[9px] font-bold text-emerald-700 whitespace-nowrap">
                {strings.statusActive}
              </span>
            </div>
          </div>

          {/* Name + email */}
          <div className={`flex-1 min-w-0 pt-16 ${isRTL ? 'text-right' : 'text-left'}`}>
            <h1 className="text-xl font-extrabold text-slate-900 leading-tight truncate">
              {fullName}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5 truncate" dir="ltr"
              style={{ textAlign: isRTL ? 'right' : 'left' }}>
              {user?.email || '—'}
            </p>
          </div>

          {/* Role badge chip */}
          <div className="pb-1 flex-shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl border ${theme.badgeBgLight} ${theme.badgeText} ${theme.badgeBorder}`}
            >
              <BadgeCheck className="w-3.5 h-3.5" />
              {getRoleShortLabel(role)}
            </span>
          </div>
        </div>

        {/* Role banner divider */}
        <div className={`mt-4 flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200" />
          <span
            className={`text-[10px] font-bold tracking-[0.18em] uppercase px-3 py-1 rounded-full border select-none whitespace-nowrap ${theme.badgeBgLight} ${theme.badgeText} ${theme.badgeBorder}`}
          >
            {getRoleBadgeLabel(role)}
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD A — Personal & Identity
// ─────────────────────────────────────────────────────────────────────────────

function PersonalInfoCard({ user, role, theme, strings, onSaved }) {
  const { isRTL } = strings;
  const { updateProfile } = useAuth();

  const [isEditing,    setIsEditing]    = useState(false);
  const [editPrenom,   setEditPrenom]   = useState('');
  const [editNom,      setEditNom]      = useState('');
  const [editEmail,    setEditEmail]    = useState('');
  const [editPhone,    setEditPhone]    = useState('');
  const [localPhone,   setLocalPhone]   = useState('');
  const [isSaving,     setIsSaving]     = useState(false);
  const [showPhoneTip, setShowPhoneTip] = useState(false);

  const handleEditStart = () => {
    setEditPrenom(user?.prenom ?? '');
    setEditNom(user?.nom ?? '');
    setEditEmail(user?.email ?? '');
    setEditPhone(localPhone);
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
      await updateProfile({ prenom: editPrenom, nom: editNom, email: editEmail });
      setLocalPhone(editPhone);
      setIsEditing(false);
      onSaved({ type: 'success', text: strings.saveSuccess, isRTL });
    } catch (err) {
      onSaved({ type: 'error', text: err.message || strings.saveError, isRTL });
    } finally {
      setIsSaving(false);
    }
  };

  const cardAction = (
    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
      {!isEditing ? (
        <button
          onClick={handleEditStart}
          className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl border transition hover:shadow-sm ${theme.badgeBgLight} ${theme.badgeText} ${theme.badgeBorder}`}
        >
          <Pencil className="w-3 h-3" />
          {strings.editBtn}
        </button>
      ) : (
        <>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition disabled:opacity-50"
          >
            <X className="w-3 h-3" />
            {strings.cancelBtn}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl text-white transition shadow-sm disabled:opacity-60 ${theme.btnPrimary}`}
          >
            {isSaving
              ? <span className="block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Check className="w-3 h-3" />
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
        <FieldRow
          icon={User} label={strings.labelPrenom}
          value={user?.prenom || '—'}
          editable isEditing={isEditing}
          editValue={editPrenom} onEditChange={setEditPrenom}
          isRTL={isRTL} theme={theme} lockedTip={strings.lockedTip}
        />
        <FieldRow
          icon={User} label={strings.labelNom}
          value={user?.nom || '—'}
          editable isEditing={isEditing}
          editValue={editNom} onEditChange={setEditNom}
          isRTL={isRTL} theme={theme} lockedTip={strings.lockedTip}
        />
        <FieldRow
          icon={Mail} label={strings.labelEmail}
          value={user?.email || '—'}
          forceDir="ltr" type="email"
          editable isEditing={isEditing}
          editValue={editEmail} onEditChange={setEditEmail}
          isRTL={isRTL} theme={theme} lockedTip={strings.lockedTip}
        />

        {/* ── Phone (local-only) ── */}
        <div className={`flex items-center gap-4 py-3.5 px-5 border-b border-slate-100 last:border-b-0 group transition-colors hover:bg-slate-50/60 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${theme.badgeBgLight}`}>
            <Phone className={`w-3.5 h-3.5 ${theme.iconColor}`} />
          </div>
          <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
            {/* Label row */}
            <div className={`flex items-center gap-2 mb-0.5 flex-wrap ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {strings.labelPhone}
              </span>
              {/* Non-sync badge + tooltip */}
              <div className="relative">
                <button
                  onMouseEnter={() => setShowPhoneTip(true)}
                  onFocus={()       => setShowPhoneTip(true)}
                  onMouseLeave={() => setShowPhoneTip(false)}
                  onBlur={()        => setShowPhoneTip(false)}
                  className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-1.5 py-0.5 cursor-help select-none"
                >
                  <Info className="w-2.5 h-2.5" />
                  {strings.phoneDemo}
                </button>
                {showPhoneTip && (
                  <div
                    className={`absolute z-20 bottom-full mb-2 w-60 bg-slate-900 text-white text-[10px] leading-relaxed rounded-xl px-3 py-2.5 shadow-xl pointer-events-none ${isRTL ? 'right-0' : 'left-0'}`}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  >
                    {strings.phoneDemoTip}
                    <span
                      className={`absolute top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900 ${isRTL ? 'right-3' : 'left-3'}`}
                    />
                  </div>
                )}
              </div>
            </div>
            {/* Input or display */}
            {isEditing ? (
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+212 6xx xxx xxx"
                dir="ltr"
                className={`w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 font-mono bg-slate-50/60 focus:bg-white outline-none transition duration-150 ${theme.editRing}`}
              />
            ) : (
              <span dir="ltr" className="text-sm font-semibold text-slate-800 font-mono">
                {localPhone || '—'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footnote */}
      <div className={`px-5 py-3 bg-slate-50 border-t border-slate-100 ${isRTL ? 'text-right' : 'text-left'}`}>
        <p className="text-[9px] text-slate-400 leading-relaxed">{strings.editableNote}</p>
      </div>
    </ProfileCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD B — Role & Organisation
// ─────────────────────────────────────────────────────────────────────────────

function RoleOrgCard({ user, role, theme, strings }) {
  const { isRTL } = strings;
  const institutionLabel = getInstitutionLabel(user?.institutionId, role);
  const roleLabel        = getRoleDisplayLabel(role);
  const systemId         = user?.id ? `CSPJ-${String(user.id).padStart(5, '0')}` : '—';

  const LockBadge = () => (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider text-slate-400 bg-slate-100 border border-slate-200 rounded-md px-1.5 py-0.5 select-none flex-shrink-0">
      <Lock className="w-2.5 h-2.5" />
      {isRTL ? 'مقفل' : 'Verrouillé'}
    </span>
  );

  return (
    <ProfileCard title={strings.cardBTitle} icon={Building2} theme={theme} isRTL={isRTL}>
      <div>
        <FieldRow
          icon={Shield} label={strings.labelRole}
          value={roleLabel}
          locked isRTL={isRTL} theme={theme} lockedTip={strings.lockedTip}
          badge={<LockBadge />}
        />
        <FieldRow
          icon={Building2}
          label={role === ROLE.ASSOCIATION ? strings.labelAssocName : strings.labelInstitution}
          value={institutionLabel}
          locked isRTL={isRTL} theme={theme} lockedTip={strings.lockedTip}
          badge={<LockBadge />}
        />
        {role === ROLE.FONCTIONNAIRE && (
          <FieldRow
            icon={Building2} label={strings.labelDirection}
            value={institutionLabel}
            locked isRTL={isRTL} theme={theme} lockedTip={strings.lockedTip}
            badge={<LockBadge />}
          />
        )}
        {role === ROLE.ASSOCIATION && (
          <FieldRow
            icon={BadgeCheck} label={strings.labelRepStatus}
            value={isRTL ? 'ممثل رسمي معتمد' : 'Représentant officiel accrédité'}
            locked isRTL={isRTL} theme={theme} lockedTip={strings.lockedTip}
            badge={<LockBadge />}
          />
        )}
        <FieldRow
          icon={Hash} label={strings.labelMatricule}
          value={systemId}
          forceDir="ltr"
          locked isRTL={isRTL} theme={theme} lockedTip={strings.lockedTip}
          badge={<LockBadge />}
        />
      </div>
      <div className={`px-5 py-3 bg-slate-50 border-t border-slate-100 ${isRTL ? 'text-right' : 'text-left'}`}>
        <p className="text-[9px] text-slate-400 leading-relaxed">{strings.readOnlyNote}</p>
      </div>
    </ProfileCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD C — Security & Authentication
// ─────────────────────────────────────────────────────────────────────────────

function SecurityCard({ theme, strings, onChangePwd }) {
  const { isRTL } = strings;

  const sessionLabel = new Date().toLocaleString(isRTL ? 'ar-MA' : 'fr-FR', {
    weekday: 'short',
    day:     '2-digit',
    month:   'short',
    year:    'numeric',
    hour:    '2-digit',
    minute:  '2-digit',
  });

  return (
    <ProfileCard title={strings.cardCTitle} icon={ShieldCheck} theme={theme} isRTL={isRTL}>
      <div>
        {/* 2FA */}
        <div className={`flex items-center gap-4 py-3.5 px-5 border-b border-slate-100 hover:bg-slate-50/60 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50">
            <Fingerprint className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
              {strings.label2FA}
            </p>
            <div className={`flex items-center gap-2 flex-wrap ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {strings.status2FAOn}
              </span>
              <span className="text-[10px] text-slate-400 font-mono" dir="ltr">TOTP / RFC 6238</span>
            </div>
          </div>
        </div>

        {/* Session */}
        <div className={`flex items-center gap-4 py-3.5 px-5 border-b border-slate-100 hover:bg-slate-50/60 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${theme.badgeBgLight}`}>
            <Clock className={`w-3.5 h-3.5 ${theme.iconColor}`} />
          </div>
          <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
              {strings.labelLastLogin}
            </p>
            <div className={`flex items-center gap-2 flex-wrap ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                {strings.sessionActive}
              </span>
              <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{sessionLabel}</span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className={`flex items-center gap-4 py-4 px-5 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-rose-50">
            <KeyRound className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
              {strings.quickAction}
            </p>
            <button
              onClick={onChangePwd}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold
                border border-rose-200 text-rose-600 bg-rose-50
                hover:bg-rose-500 hover:text-white hover:border-rose-500
                transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]
                ${isRTL ? 'flex-row-reverse' : ''}
              `}
            >
              <KeyRound className="w-4 h-4" />
              {strings.changePwdBtn}
            </button>
          </div>
        </div>
      </div>

      {/* Security note */}
      <div className={`px-5 py-3 border-t border-slate-100 flex items-start gap-2 bg-slate-50 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
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

  const [toast,       setToast]       = useState({ type: '', text: '', isRTL: false });
  const [showPwdModal, setShowPwdModal] = useState(false);

  const handleChangePwdConfirm = () => {
    setShowPwdModal(false);
    navigate('/forgot-password');
  };

  const BackIcon = isRTL ? ChevronRight : ChevronLeft;

  return (
    <>
      <Toast message={toast} onDismiss={() => setToast({ type: '', text: '', isRTL: false })} />

      {showPwdModal && (
        <ChangePasswordModal
          strings={strings}
          theme={theme}
          onConfirm={handleChangePwdConfirm}
          onClose={() => setShowPwdModal(false)}
        />
      )}

      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        className="flex flex-col flex-1 min-h-0 overflow-y-auto"
        style={{ background: 'linear-gradient(160deg, #EFF6FF 0%, #F0F4F8 50%, #F1F5F9 100%)' }}
      >
        {/* ── Top Nav ─────────────────────────────────────────────────────── */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/70 h-14 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10 shadow-sm">
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
            className={`flex items-center gap-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl px-4 py-1.5 hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50 transition-all duration-150 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <LogOut className="w-3.5 h-3.5" />
            {strings.logout}
          </button>
        </header>

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <main className="flex-1 flex justify-center px-4 sm:px-6 py-8">
          <div className="w-full max-w-2xl space-y-5">
            <HeroCard user={user} role={role} theme={theme} strings={strings} />
            <PersonalInfoCard user={user} role={role} theme={theme} strings={strings} onSaved={setToast} />
            <RoleOrgCard user={user} role={role} theme={theme} strings={strings} />
            <SecurityCard theme={theme} strings={strings} onChangePwd={() => setShowPwdModal(true)} />

            <p
              className={`text-center text-[10px] text-slate-400 pb-4 ${isRTL ? 'font-medium' : ''}`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {strings.footer}
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
