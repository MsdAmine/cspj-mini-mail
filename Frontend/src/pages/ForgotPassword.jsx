import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../services/api';

/* ─── Dev-mode detection ─────────────────────────────────────────────────── */
const IS_DEV = import.meta.env.DEV;

/* ─── Step indicator ─────────────────────────────────────────────────────── */
function StepIndicator({ current }) {
  const steps = [
    { id: 'email',       label: 'البريد', labelFr: 'E-mail'  },
    { id: 'otp',         label: 'الرمز',  labelFr: 'Code OTP' },
    { id: 'newPassword', label: 'الكلمة', labelFr: 'Mot de passe' },
  ];
  const order = ['email', 'otp', 'newPassword', 'success'];
  const currentIdx = order.indexOf(current);

  return (
    <div className="flex items-center justify-center gap-0 mb-8 select-none" dir="ltr">
      {steps.map((step, idx) => {
        const stepIdx = order.indexOf(step.id);
        const isDone    = stepIdx < currentIdx;
        const isActive  = stepIdx === currentIdx;
        const isFuture  = stepIdx > currentIdx;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isDone   ? 'bg-emerald-500 text-white shadow-sm'      :
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
                {step.labelFr}
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

/* ─── OTP Input Row ──────────────────────────────────────────────────────── */
function OtpInput({ value, onChange, disabled }) {
  const inputsRef = useRef([]);
  const digits = value.split('');

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

    if (key === 'ArrowLeft' && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
      return;
    }
    if (key === 'ArrowRight' && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
      return;
    }

    if (!/^\d$/.test(key)) return;
    e.preventDefault();

    const next = [...digits];
    next[idx] = key;
    onChange(next.join(''));

    if (idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    onChange(pasted.padEnd(6, '').slice(0, 6));
    const focusIdx = Math.min(pasted.length, 5);
    inputsRef.current[focusIdx]?.focus();
  };

  const handleChange = (e, idx) => {
    // Handles mobile soft-keyboard input
    const val = e.target.value.replace(/\D/g, '');
    if (!val) return;
    const next = [...digits];
    next[idx] = val.slice(-1);
    onChange(next.join(''));
    if (idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  useEffect(() => {
    // Auto-focus first empty box when component mounts
    const firstEmpty = digits.findIndex(d => !d);
    inputsRef.current[firstEmpty === -1 ? 5 : firstEmpty]?.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex gap-2.5 justify-center" dir="ltr">
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={el => (inputsRef.current[idx] = el)}
          id={`otp-digit-${idx}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[idx] || ''}
          onChange={e => handleChange(e, idx)}
          onKeyDown={e => handleKey(e, idx)}
          onPaste={handlePaste}
          disabled={disabled}
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

/* ─── Countdown timer ────────────────────────────────────────────────────── */
function Countdown({ seconds, onExpired }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) { onExpired?.(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onExpired]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const isUrgent = remaining <= 60;

  return (
    <span className={`font-mono font-semibold tabular-nums transition-colors ${isUrgent ? 'text-rose-500' : 'text-slate-500'}`}>
      {mm}:{ss}
    </span>
  );
}

/* ─── Amber Dev Panel ────────────────────────────────────────────────────── */
function DevOtpPanel({ otp, onFill }) {
  return (
    <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-left" dir="ltr">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-800">
          <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          Dev Mode · وضع التطوير
        </span>
      </div>

      <p className="text-[11px] text-amber-700 mb-3 leading-relaxed">
        No SMS gateway configured — OTP echoed from API for local testing.
      </p>

      <div className="flex items-center gap-3">
        <div className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-2 font-mono text-2xl font-bold tracking-[0.35em] text-amber-800 text-center select-all">
          {otp}
        </div>
        <button
          type="button"
          id="dev-fill-otp"
          onClick={onFill}
          className="flex-shrink-0 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 px-3 py-2 text-[12px] font-bold text-white transition-all shadow-sm"
        >
          Fill Code ⚡
        </button>
      </div>
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

  const labels = ['', 'Faible', 'Moyen', 'Bon', 'Fort'];
  const colors = ['', 'bg-rose-400', 'bg-amber-400', 'bg-sky-400', 'bg-emerald-400'];

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
function ErrorAlert({ message }) {
  if (!message) return null;
  return (
    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-start gap-2 animate-[fadeIn_0.2s_ease]" dir="rtl">
      <svg className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function ForgotPassword({ onBack }) {
  // State machine: email → otp → newPassword → success
  const [step, setStep]                     = useState('email');

  // Step 1 state
  const [email, setEmail]                   = useState('');

  // Step 2 state
  const [otp, setOtp]                       = useState('');
  const [devOtp, setDevOtp]                 = useState(null);
  const [otpExpiry, setOtpExpiry]           = useState(300); // 5 min in seconds
  const [otpExpired, setOtpExpired]         = useState(false);

  // Step 3 state
  const [resetToken, setResetToken]         = useState('');
  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw]                 = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);

  // Shared
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [error, setError]                   = useState('');

  /* ── Step 1: Send OTP ─────────────────────────────────────────────────── */
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('يرجى إدخال عنوان بريدك الإلكتروني / Veuillez saisir votre adresse e-mail.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      if (IS_DEV && data?.devOtp) {
        setDevOtp(data.devOtp);
        console.log('%c[CSPJ Mail — DEV] 🔑 OTP Code', 'color:#f59e0b;font-weight:bold;font-size:13px;');
        console.log(`%c${data.devOtp}`, 'color:#f59e0b;font-size:24px;font-weight:bold;letter-spacing:0.5em;');
      }
      setOtpExpiry(300);
      setOtpExpired(false);
      setStep('otp');
    } catch {
      setError('خطأ في الشبكة. يرجى المحاولة مجدداً / Erreur réseau. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Step 2: Verify OTP ───────────────────────────────────────────────── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) {
      setError('يرجى إدخال الرمز المكوّن من 6 أرقام / Veuillez saisir le code à 6 chiffres.');
      return;
    }
    if (otpExpired) {
      setError('انتهت صلاحية الرمز. يرجى طلب رمز جديد / Le code a expiré. Veuillez en demander un nouveau.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email: email.trim(), otpCode: otp });
      setResetToken(data.resetSessionToken);
      setStep('newPassword');
    } catch (err) {
      const msg = err?.response?.data?.error;
      setError(msg || 'رمز التحقق غير صحيح أو منتهي الصلاحية / Code OTP invalide ou expiré.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Step 3: Reset password ───────────────────────────────────────────── */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل / Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين / Les mots de passe ne correspondent pas.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-password-otp', {
        email:       email.trim(),
        resetToken,
        newPassword,
      });
      setStep('success');
    } catch (err) {
      const msg = err?.response?.data?.error;
      setError(msg || 'حدث خطأ. يرجى إعادة المحاولة / Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Resend OTP ───────────────────────────────────────────────────────── */
  const handleResend = useCallback(async () => {
    setError('');
    setOtp('');
    setDevOtp(null);
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      if (IS_DEV && data?.devOtp) {
        setDevOtp(data.devOtp);
      }
      setOtpExpiry(300);
      setOtpExpired(false);
    } catch {
      setError('خطأ في إعادة الإرسال / Erreur lors du renvoi.');
    } finally {
      setIsSubmitting(false);
    }
  }, [email]);

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
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-slate-50 font-sans antialiased text-slate-900 overflow-hidden selection:bg-slate-200">

      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-slate-700 via-slate-900 to-slate-700" />

      <div className="relative w-full max-w-md mx-4 my-8 z-10">
        <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8 sm:p-10">

          {/* Header */}
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
            <h1 className="text-xl font-bold tracking-tight text-slate-900 mb-0.5" dir="rtl">
              {step === 'success' ? 'تمّت إعادة الضبط!' :
               step === 'newPassword' ? 'تعيين كلمة المرور الجديدة' :
               step === 'otp' ? 'أدخل رمز التحقق' :
               'إعادة ضبط كلمة المرور'}
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {step === 'success' ? 'Mot de passe réinitialisé avec succès' :
               step === 'newPassword' ? 'Définir un nouveau mot de passe' :
               step === 'otp' ? 'Saisir le code de vérification' :
               'Réinitialisation du mot de passe'}
            </p>
          </div>

          {/* Step indicator (hide on success) */}
          {step !== 'success' && <StepIndicator current={step} />}

          <ErrorAlert message={error} />

          {/* ── STEP 1: Email ─────────────────────────────────────────────── */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-xs text-slate-500 text-center mb-4" dir="rtl">
                أدخل بريدك المؤسساتي وسنرسل إليك رمز تحقق مكوّن من 6 أرقام.
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
                  placeholder="Adresse e-mail / البريد الإلكتروني"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
              <SubmitButton
                id="send-otp-btn"
                label="إرسال رمز التحقق →"
                loadingLabel="جارٍ الإرسال..."
              />
              <button
                type="button"
                onClick={onBack}
                className="w-full text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors text-center pt-1"
              >
                العودة إلى تسجيل الدخول / Retour à la connexion
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP Entry ─────────────────────────────────────────── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1" dir="rtl">
                  تم إرسال الرمز إلى <span className="font-semibold text-slate-700 dir-ltr">{email}</span>
                </p>
                <p className="text-[10px] text-slate-400">
                  Code envoyé à {email}
                </p>
              </div>

              <OtpInput value={otp} onChange={setOtp} disabled={isSubmitting || otpExpired} />

              {/* Timer row */}
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {otpExpired ? (
                  <span className="text-rose-500 font-medium">انتهت الصلاحية · Expiré</span>
                ) : (
                  <>
                    الرمز صالح لمدة / Valide pendant&nbsp;
                    <Countdown seconds={otpExpiry} onExpired={() => setOtpExpired(true)} />
                  </>
                )}
              </div>

              {/* Dev panel */}
              {IS_DEV && devOtp && (
                <DevOtpPanel otp={devOtp} onFill={() => { setOtp(devOtp); }} />
              )}

              <SubmitButton
                id="verify-otp-btn"
                label="التحقق من الرمز →"
                loadingLabel="جارٍ التحقق..."
              />

              {/* Resend + back */}
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                  className="hover:text-slate-800 transition-colors"
                >
                  ← تغيير البريد
                </button>
                <button
                  type="button"
                  id="resend-otp-btn"
                  onClick={handleResend}
                  disabled={isSubmitting}
                  className="hover:text-slate-800 transition-colors disabled:opacity-40"
                >
                  إعادة إرسال الرمز / Renvoyer le code
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 3: New Password ──────────────────────────────────────── */}
          {step === 'newPassword' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-xs text-slate-500 text-center" dir="rtl">
                اختر كلمة مرور قوية لحسابك.
              </p>

              {/* New password field */}
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
                  placeholder="Nouveau mot de passe / كلمة المرور الجديدة"
                  className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all"
                  disabled={isSubmitting}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                  tabIndex={-1}
                >
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

              {/* Confirm password field */}
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
                  placeholder="Confirmer le mot de passe / تأكيد كلمة المرور"
                  className={`w-full pl-11 pr-11 py-3.5 bg-slate-50 border rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-1 transition-all ${
                    confirmPassword && newPassword !== confirmPassword
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-300'
                      : 'border-slate-300 focus:border-slate-800 focus:ring-slate-800'
                  }`}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                  tabIndex={-1}
                >
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

              <SubmitButton
                id="reset-password-btn"
                label="تعيين كلمة المرور الجديدة →"
                loadingLabel="جارٍ الحفظ..."
              />
            </form>
          )}

          {/* ── SUCCESS ───────────────────────────────────────────────────── */}
          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 rounded-full border-2 border-emerald-100 mx-auto">
                <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-1" dir="rtl">
                  تمّ تعيين كلمة المرور بنجاح! 🎉
                </h2>
                <p className="text-[12px] text-slate-500">
                  Votre mot de passe a été réinitialisé avec succès.
                </p>
                <p className="text-xs text-slate-400 mt-2" dir="rtl">
                  يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
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
                العودة إلى تسجيل الدخول / Retour à la connexion
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
