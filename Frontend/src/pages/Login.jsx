import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';

export default function Login({ onForgotPassword }) {
  const { login, verifyTwoFactor } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  // Store the server-echoed email (normalized/lowercased by the backend)
  const [pendingEmail, setPendingEmail] = useState('');
  // Store the Base32 TOTP secret returned only on first-time setup
  const [pendingSecret, setPendingSecret] = useState('');
  // Whether this is the very first TOTP enrolment for this user
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!showTwoFactor) {
      if (!email.trim() || !password.trim()) {
        setError('يرجى ملء جميع الحقول المطلوبة.');
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await login(email, password);
        if (result && result.requiresTwoFactor) {
          setPendingEmail(result.email || email.trim());
          setPendingSecret(result.twoFactorSecret || '');
          setIsFirstTimeSetup(result.isFirstTimeSetup ?? false);
          setShowTwoFactor(true);
        }
      } catch (err) {
        setError(err.message || 'حدث خطأ أثناء تسجيل الدخول.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!twoFactorCode.trim()) {
        setError('يرجى إدخال رمز التحقق.');
        return;
      }

      setIsSubmitting(true);
      try {
        await verifyTwoFactor(pendingEmail, twoFactorCode);
      } catch (err) {
        setError(err.message || 'رمز التحقق غير صالح.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Standard OTPAuth URI — used exclusively to render the QR code
  const otpAuthUrl = pendingSecret
    ? `otpauth://totp/CSPJ%20Mail:${encodeURIComponent(pendingEmail)}?secret=${pendingSecret}&issuer=CSPJ%20Mail`
    : '';

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-slate-50 font-sans antialiased overflow-hidden selection:bg-slate-200">
      
      {/* ── Top Accent Border ── */}
      <div className="absolute top-0 inset-x-0 h-1 bg-slate-800" />
      
      <div className="relative w-full max-w-md p-8 sm:p-10 bg-white border border-slate-200 shadow-xl rounded-2xl m-4 z-10">

        {/* ── Branding Header ── */}
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-900 shadow-sm mb-5">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3">CSPJ Mail</h1>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            Plateforme Officielle de Messagerie institutionnelle
          </span>
        </div>

        {/* ── Error Alert ── */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-start gap-3 animate-fade-in" dir="rtl">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!showTwoFactor ? (
            <>
              <div dir="ltr" className="space-y-4">
                {/* Email Field */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-800 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Adresse e-mail (admin@cspj.ma)"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all duration-200"
                    disabled={isSubmitting}
                    dir="ltr"
                  />
                </div>

                {/* Password Field */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-800 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mot de passe"
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50/50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all duration-200"
                    disabled={isSubmitting}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
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

                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {isFirstTimeSetup ? (
                /* ── First-time setup: full onboarding panel ─────────────────── */
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4">
                  {/* Shield icon + title */}
                  <div className="flex items-center gap-3 text-slate-800 border-b border-slate-200 pb-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-900">إعداد التحقق بخطوتين</span>
                  </div>

                  {/* Step 1: Setup instructions */}
                  <p className="text-xs text-slate-600 leading-relaxed text-right" dir="rtl">
                    امسح رمز QR أدناه باستخدام تطبيق <strong className="text-slate-900">Google Authenticator</strong> أو <strong className="text-slate-900">Microsoft Authenticator</strong> أو <strong className="text-slate-900">Authy</strong>.
                  </p>

                  {/* QR Code */}
                  {otpAuthUrl && (
                    <div className="flex justify-center my-2 p-3 bg-white rounded-lg border border-slate-200 w-fit mx-auto">
                      <QRCodeSVG
                        value={otpAuthUrl}
                        size={160}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* ── Returning user: minimal header only ─────────────────────── */
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                  <svg className="w-5 h-5 flex-shrink-0 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-sm font-semibold text-slate-900">التحقق بخطوتين</span>
                </div>
              )}

              {/* Enter code — shown in both branches */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 text-right" dir="rtl">
                  {isFirstTimeSetup
                    ? 'أدخل الرمز المكوّن من 6 أرقام الذي يظهر في التطبيق'
                    : 'أدخل الرمز من تطبيق المصادقة الخاص بك'}
                </label>
                <input
                  id="totp-code-input"
                  type="text"
                  inputMode="numeric"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-300 rounded-lg text-slate-900 text-center tracking-[0.6em] text-xl font-mono focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all duration-200"
                  disabled={isSubmitting}
                  dir="ltr"
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            id="login-submit-btn"
            className="w-full mt-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {showTwoFactor ? 'جارٍ التحقق...' : 'Connexion en cours...'}
              </>
            ) : (
              showTwoFactor ? 'تحقق والدخول' : 'Se connecter'
            )}
          </button>

          {showTwoFactor && (
            <button
              type="button"
              onClick={() => { setShowTwoFactor(false); setTwoFactorCode(''); setError(''); }}
              className="w-full text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors text-center mt-4"
            >
              ← Retour à la connexion
            </button>
          )}
        </form>
      </div>
    </div>
  );
}