import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';

/* ─── Step indicator ─────────────────────────────────────────────────────── */
function StepIndicator({ current, isRTL }) {
  const steps = [
    { id: 'email',       labelAr: 'البريد',  labelFr: 'E-mail'       },
    { id: 'otp',         labelAr: 'الرمز',   labelFr: 'Code TOTP'    },
    { id: 'newPassword', labelAr: 'الكلمة',  labelFr: 'Mot de passe' },
  ];
  const order = ['email', 'otp', 'newPassword', 'success'];
  const currentIdx = order.indexOf(current);

  return (
    <div className="flex items-center justify-center gap-0 mb-8 select-none" dir="ltr">
      {steps.map((step, idx) => {
        const stepIdx  = order.indexOf(step.id);
        const isDone   = stepIdx < currentIdx;
        const isActive = stepIdx === currentIdx;
        const isFuture = stepIdx > currentIdx;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isDone   ? 'bg-emerald-500 text-white shadow-sm' :
                  isActive ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-300' :
                             'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                {isDone ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                ) : idx + 1}
              </div>
              <span className={`text-[9px] font-medium ${isActive ? 'text-slate-800' : isFuture ? 'text-slate-300' : 'text-emerald-600'}`}>
                {isRTL ? step.labelAr : step.labelFr}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`h-px w-10 mb-4 transition-all duration-500 ${stepIdx < currentIdx ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── OTP Input Row (always LTR) ─────────────────────────────────────────── */
function OtpInput({ value, onChange, disabled }) {
  const inputsRef = useRef([]);
  const digits = Array.from({ length: 6 }, (_, i) => (value && value[i]) || '');

  const handleKey = (e, idx) => {
    const { key } = e;

    if (key === 'Backspace') {
      e.preventDefault();
      const next = [...digits];
      if (next[idx]) {
        next[idx] = '';
        onChange(next.join(''));
      } else if (idx > 0) {
        next[idx - 1] = '';
        onChange(next.join(''));
        inputsRef.current[idx - 1]?.focus();
      }
      return;
    }

    if (key === 'ArrowLeft' && idx > 0)  { inputsRef.current[idx - 1]?.focus(); return; }
    if (key === 'ArrowRight' && idx < 5) { inputsRef.current[idx + 1]?.focus(); return; }

    if (!/^\d$/.test(key)) return;
    e.preventDefault();

    const next = [...digits];
    next[idx] = key;
    onChange(next.join(''));
    if (idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    onChange(pasted);
    const targetIdx = Math.min(pasted.length, 5);
    inputsRef.current[targetIdx]?.focus();
  };

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      const next = [...digits];
      next[idx] = '';
      onChange(next.join(''));
      return;
    }
    const next = [...digits];
    next[idx] = val.slice(-1);
    onChange(next.join(''));
    if (idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  useEffect(() => {
    const firstEmpty = digits.findIndex(d => !d);
    const targetIdx = firstEmpty === -1 ? 0 : firstEmpty;
    inputsRef.current[targetIdx]?.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="flex flex-row gap-2.5 justify-center"
      dir="ltr"
      style={{ direction: 'ltr', flexDirection: 'row' }}
    >
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={el => (inputsRef.current[idx] = el)}
          id={`otp-digit-${idx}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          dir="ltr"
          value={digits[idx]}
          onChange={e => handleChange(e, idx)}
          onKeyDown={e => handleKey(e, idx)}
          onPaste={handlePaste}
          disabled={disabled}
          style={{ direction: 'ltr', textAlign: 'center' }}
          className={`
            w-11 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-150
            bg-slate-50 text-slate-900 caret-transparent
            focus:outline-none focus:border-slate-800 focus:bg-white focus:shadow-md
            disabled:opacity-50 disabled:cursor-not-allowed
            ${digits[idx] ? 'border-slate-400 bg-white' : 'border-slate-200'}
          `}
        />
      ))}
    </div>
  );
}

/* ─── Password strength bar ──────────────────────────────────────────────── */
function PasswordStrength({ password }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  if (!password) return null;

  const labels = ['', 'Faible / ضعيف', 'Moyen / متوسط', 'Bon / جيد', 'Fort / قوي'];
  const colors  = ['', 'bg-rose-400', 'bg-amber-400', 'bg-sky-400', 'bg-emerald-400'];

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-slate-200'}`} />
        ))}
      </div>
      <p className={`text-[10px] font-medium ${score < 2 ? 'text-rose-500' : score < 3 ? 'text-amber-500' : score < 4 ? 'text-sky-500' : 'text-emerald-500'}`}>
        {labels[score]}
      </p>
    </div>
  );
}

/* ─── Error alert ────────────────────────────────────────────────────────── */
function ErrorAlert({ message, isRTL }) {
  if (!message) return null;
  return (
    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-start gap-2" dir={isRTL ? 'rtl' : 'ltr'}>
      <svg className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function ForgotPassword({ onBack }) {

  /* ── Language ─────────────────────────────────────────────────────────── */
  const [lang, setLang] = useState('fr');
  const isRTL = lang === 'ar';

  // Translation map — mirrors the pattern used in Login.jsx
  const t = {
    // Page titles
    titleEmail:      isRTL ? 'إعادة ضبط كلمة المرور'        : 'Réinitialisation du mot de passe',
    titleOtp:        isRTL ? 'رمز المصادقة'                   : 'Code Authentificateur',
    titlePassword:   isRTL ? 'تعيين كلمة المرور الجديدة'      : 'Définir un nouveau mot de passe',
    titleSuccess:    isRTL ? 'تمّت إعادة الضبط!'              : 'Réinitialisation réussie !',
    subtitleEmail:   isRTL ? 'الخطوة الأولى'                   : 'Étape 1',
    subtitleOtp:     isRTL ? 'رمز المصادقة'                   : 'Code Authentificateur',
    subtitlePwd:     isRTL ? 'كلمة المرور الجديدة'             : 'Nouveau mot de passe',
    subtitleSuccess: isRTL ? 'تمّ بنجاح'                       : 'Succès',

    // Step 1
    step1Desc:       isRTL
      ? 'أدخل بريدك المؤسساتي. ستحتاج إلى تطبيق المصادقة الخاص بك في الخطوة التالية.'
      : 'Saisissez votre adresse e-mail. Vous aurez besoin de votre application d\'authentification à l\'étape suivante.',
    emailPlaceholder: isRTL ? 'البريد الإلكتروني' : 'Adresse e-mail',
    btnNext:          isRTL ? '← التالي'           : 'Suivant →',
    btnNextLoading:   isRTL ? 'جارٍ التحقق...'      : 'Vérification...',
    backToLogin:      isRTL ? 'العودة إلى تسجيل الدخول' : 'Retour à la connexion',

    // Step 2
    step2CardTitle:   isRTL
      ? 'أدخل الرمز الظاهر في تطبيق المصادقة الخاص بك'
      : 'Saisissez le code affiché dans votre application d\'authentification',
    step2CardBody:    isRTL
      ? 'افتح Google Authenticator أو Microsoft Authenticator وأدخل الرمز المكوّن من 6 أرقام الظاهر لحسابك.'
      : 'Ouvrez Google Authenticator ou Microsoft Authenticator et saisissez le code à 6 chiffres affiché pour votre compte.',
    btnVerify:        isRTL ? '← التحقق من الرمز'  : 'Vérifier le code →',
    btnVerifyLoading: isRTL ? 'جارٍ التحقق...'       : 'Vérification...',
    changeEmail:      isRTL ? '← تغيير البريد الإلكتروني' : '← Changer l\'adresse e-mail',

    // Step 3
    step3Desc:        isRTL ? 'اختر كلمة مرور قوية لحسابك.' : 'Choisissez un mot de passe fort pour votre compte.',
    pwdPlaceholder:   isRTL ? 'كلمة المرور الجديدة'          : 'Nouveau mot de passe',
    confirmPlaceholder: isRTL ? 'تأكيد كلمة المرور'         : 'Confirmer le mot de passe',
    btnSave:          isRTL ? '← تعيين كلمة المرور'         : 'Enregistrer le mot de passe →',
    btnSaveLoading:   isRTL ? 'جارٍ الحفظ...'                : 'Enregistrement...',

    // Success
    successTitle: isRTL ? 'تمّ تعيين كلمة المرور بنجاح! 🎉' : 'Mot de passe réinitialisé avec succès ! 🎉',
    successBody:  isRTL ? 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.' : 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
    btnBackLogin: isRTL ? 'العودة إلى تسجيل الدخول'          : 'Retour à la connexion',

    // Errors
    errEmail:    isRTL ? 'يرجى إدخال عنوان بريدك الإلكتروني.' : 'Veuillez saisir votre adresse e-mail.',
    errNoTotp:   isRTL ? 'لا يمكن إتمام طلب إعادة التعيين لهذا الحساب.' : 'Réinitialisation impossible pour ce compte.',
    errNetwork:  isRTL ? 'خطأ في الشبكة. يرجى المحاولة مجدداً.' : 'Erreur réseau. Veuillez réessayer.',
    errOtpLen:   isRTL ? 'يرجى إدخال الرمز المكوّن من 6 أرقام.' : 'Veuillez saisir le code à 6 chiffres.',
    errOtpWrong: isRTL ? 'رمز التحقق غير صحيح أو منتهي الصلاحية.' : 'Code TOTP invalide ou expiré.',
    errPwdLen:   isRTL ? 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل.' : 'Le mot de passe doit contenir au moins 8 caractères.',
    errPwdComplex: isRTL
      ? 'يجب أن تحتوي كلمة المرور على حرف كبير وحرف صغير ورقم وحرف خاص.'
      : 'Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial.',
    errPwdMatch: isRTL ? 'كلمتا المرور غير متطابقتين.' : 'Les mots de passe ne correspondent pas.',
    errGeneric:  isRTL ? 'حدث خطأ. يرجى إعادة المحاولة.' : 'Une erreur est survenue. Veuillez réessayer.',
  };

  /* ── State machine ────────────────────────────────────────────────────── */
  const [step, setStep] = useState('email');

  // Step 1
  const [email, setEmail] = useState('');

  // Step 2
  const [otp, setOtp] = useState('');

  // Step 3
  const [resetToken, setResetToken]           = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw]                   = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);

  // Shared
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState('');

  // Clear error on language switch
  useEffect(() => { setError(''); }, [lang]);

  /* ── Step 1: verify email & TOTP enrollment ───────────────────────────── */
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError(t.errEmail); return; }
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      if (!data?.requiresTotp) { setError(t.errNoTotp); return; }
      setStep('otp');
    } catch {
      setError(t.errNetwork);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Step 2: verify TOTP code ─────────────────────────────────────────── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError(t.errOtpLen); return; }
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email: email.trim(), otpCode: otp });
      setResetToken(data.resetSessionToken);
      setStep('newPassword');
    } catch (err) {
      setError(err?.response?.data?.error || t.errOtpWrong);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Step 3: save new password ────────────────────────────────────────── */
  // Password complexity regex — mirrors the backend [RegularExpression] on ResetPasswordOtpDto.
  // Must contain: ≥1 lowercase, ≥1 uppercase, ≥1 digit, ≥1 special character, 8–128 chars.
  const PWD_COMPLEXITY_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8)            { setError(t.errPwdLen);     return; }
    if (!PWD_COMPLEXITY_RE.test(newPassword)) { setError(t.errPwdComplex); return; }
    if (newPassword !== confirmPassword)   { setError(t.errPwdMatch);   return; }
    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-password-otp', { email: email.trim(), resetToken, newPassword });
      setStep('success');
    } catch (err) {
      setError(err?.response?.data?.error || t.errGeneric);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Shared spinner button ────────────────────────────────────────────── */
  const SubmitButton = ({ label, loadingLabel, id }) => (
    <button
      id={id}
      type="submit"
      disabled={isSubmitting}
      className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSubmitting ? (
        <>
          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {loadingLabel}
        </>
      ) : label}
    </button>
  );

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="relative flex min-h-screen w-screen items-center justify-center bg-slate-50 font-sans antialiased text-slate-900 overflow-hidden selection:bg-slate-200">

      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-1 bg-slate-800" />

      {/* ── Language toggle — mirrors Login.jsx exactly ─────────────────── */}
      <div className={`absolute top-6 ${isRTL ? 'left-6' : 'right-6'} z-20`} dir="ltr">
        <div className="flex bg-white/80 backdrop-blur-md border border-slate-200 rounded-lg p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setLang('fr')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${lang === 'fr' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            FR
          </button>
          <button
            type="button"
            onClick={() => setLang('ar')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${lang === 'ar' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            العربية
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-md mx-4 my-8 z-10">
        <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8 sm:p-10">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="text-center mb-6 flex flex-col items-center">
            <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-100 border border-slate-200 shadow-sm mb-4 text-slate-800">
              {step === 'success' ? (
                <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : step === 'newPassword' ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : step === 'otp' ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              )}
            </div>

            <h1 className="text-xl font-bold tracking-tight text-slate-900 mb-0.5">
              {step === 'success'     ? t.titleSuccess  :
               step === 'newPassword' ? t.titlePassword :
               step === 'otp'         ? t.titleOtp      :
               t.titleEmail}
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {step === 'success'     ? t.subtitleSuccess :
               step === 'newPassword' ? t.subtitlePwd     :
               step === 'otp'         ? t.subtitleOtp     :
               t.subtitleEmail}
            </p>
          </div>

          {/* Step indicator (hide on success) */}
          {step !== 'success' && <StepIndicator current={step} isRTL={isRTL} />}

          <ErrorAlert message={error} isRTL={isRTL} />

          {/* ── STEP 1: Email ──────────────────────────────────────────── */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-xs text-slate-500 text-center mb-4">
                {t.step1Desc}
              </p>

              <div className="relative group" dir="ltr">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-800 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all"
                  disabled={isSubmitting}
                  dir="ltr"
                  autoFocus
                />
              </div>

              <SubmitButton id="send-otp-btn" label={t.btnNext} loadingLabel={t.btnNextLoading} />

              <button
                type="button"
                onClick={onBack}
                className="w-full text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors text-center pt-1"
              >
                {t.backToLogin}
              </button>
            </form>
          )}

          {/* ── STEP 2: TOTP Code ──────────────────────────────────────── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">

              {/* Authenticator app instruction card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 flex items-start gap-3" dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                  <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-3 3h3" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 mb-0.5">
                    {t.step2CardTitle}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {t.step2CardBody}
                  </p>
                </div>
              </div>

              {/* OTP boxes — always LTR regardless of page direction */}
              <OtpInput value={otp} onChange={setOtp} disabled={isSubmitting} />

              <SubmitButton id="verify-otp-btn" label={t.btnVerify} loadingLabel={t.btnVerifyLoading} />

              <div className="flex items-center justify-center text-[11px] font-medium text-slate-500">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                  className="hover:text-slate-800 transition-colors"
                >
                  {t.changeEmail}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 3: New Password ───────────────────────────────────── */}
          {step === 'newPassword' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-xs text-slate-500 text-center">
                {t.step3Desc}
              </p>

              {/* New password */}
              <div className="relative group" dir="ltr">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-800 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <input
                  id="new-password"
                  type={showPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder={t.pwdPlaceholder}
                  className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all"
                  disabled={isSubmitting}
                  dir="ltr"
                  autoFocus
                />
                <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 transition-colors">
                  {showPw ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              <PasswordStrength password={newPassword} />

              {/* Confirm password */}
              <div className="relative group" dir="ltr">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-800 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder={t.confirmPlaceholder}
                  className={`w-full pl-11 pr-11 py-3.5 bg-slate-50 border rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-1 transition-all ${
                    confirmPassword && newPassword !== confirmPassword
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-300'
                      : 'border-slate-300 focus:border-slate-800 focus:ring-slate-800'
                  }`}
                  disabled={isSubmitting}
                  dir="ltr"
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 transition-colors">
                  {showConfirm ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>

              <SubmitButton id="reset-password-btn" label={t.btnSave} loadingLabel={t.btnSaveLoading} />
            </form>
          )}

          {/* ── SUCCESS ────────────────────────────────────────────────── */}
          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 rounded-full border-2 border-emerald-100 mx-auto">
                <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-1">
                  {t.successTitle}
                </h2>
                <p className="text-xs text-slate-400 mt-2">
                  {t.successBody}
                </p>
              </div>
              <button
                id="back-to-login-btn"
                onClick={onBack}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                {t.btnBackLogin}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
