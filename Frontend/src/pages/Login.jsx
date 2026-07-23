import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login({ onForgotPassword }) {
  const { login, verifyTwoFactor } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  // Store the server-echoed email (normalized/lowercased by the backend)
  const [pendingEmail, setPendingEmail] = useState('');
  // Store the Base32 TOTP secret returned from the login response
  const [pendingSecret, setPendingSecret] = useState('');
  const [copied, setCopied] = useState(false);

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

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(pendingSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: select the text
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-900 font-sans antialiased text-slate-100">
      <div className="w-full max-w-md p-8 bg-slate-800 rounded-xl shadow-2xl border border-slate-700">

        {/* الشعار / العنوان */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-blue-600/10 rounded-full text-blue-500 mb-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">نظام المراسلات الداخلي</h1>
          <p className="text-sm text-blue-400 font-mono mt-0.5">CSPJ Mail</p>
          <p className="text-xs text-slate-400 mt-1">منصة المراسلات المهنية الداخلية</p>
        </div>

        {/* رسالة الخطأ */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* النموذج */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!showTwoFactor ? (
            <>
              <div dir="ltr">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 text-right" dir="rtl">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cspj.ma"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  disabled={isSubmitting}
                  dir="ltr"
                />
              </div>

              <div dir="ltr">
                <div className="flex justify-between items-center mb-2" dir="rtl">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    كلمة المرور
                  </label>
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-xs text-blue-500 hover:text-blue-400 hover:underline transition"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  disabled={isSubmitting}
                  dir="ltr"
                />
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* TOTP Onboarding Panel */}
              <div className="bg-slate-900/60 border border-slate-600 rounded-xl p-4 space-y-3">
                {/* Shield icon + title */}
                <div className="flex items-center gap-2 text-blue-400">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-sm font-semibold text-white">التحقق بخطوتين — Authenticator App</span>
                </div>

                {/* Step 1: Setup instructions */}
                <p className="text-xs text-slate-400 leading-relaxed" dir="rtl">
                  افتح تطبيق <strong className="text-slate-200">Google Authenticator</strong> أو <strong className="text-slate-200">Microsoft Authenticator</strong> أو <strong className="text-slate-200">Authy</strong>، ثم اضغط على <strong className="text-slate-200">+</strong> واختر <strong className="text-slate-200">إدخال مفتاح الإعداد</strong>.
                </p>

                {/* Secret key box */}
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">مفتاح الإعداد (Base32 Secret Key)</p>
                  <div className="flex items-center gap-2">
                    <code
                      id="totp-secret-display"
                      className="flex-1 block bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-emerald-400 tracking-widest break-all select-all"
                      dir="ltr"
                    >
                      {pendingSecret}
                    </code>
                    <button
                      type="button"
                      id="copy-secret-btn"
                      onClick={handleCopySecret}
                      title="Copy secret key"
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all duration-200
                        ${copied
                          ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white'
                        }`}
                    >
                      {copied ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Account name hint */}
                <p className="text-xs text-slate-500" dir="rtl">
                  اسم الحساب: <span className="text-slate-300 font-mono">{pendingEmail}</span>
                </p>
              </div>

              {/* Step 2: Enter code */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  أدخل الرمز المكوّن من 6 أرقام الذي يظهر في التطبيق
                </label>
                <input
                  id="totp-code-input"
                  type="text"
                  inputMode="numeric"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-center tracking-[0.6em] text-xl font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  disabled={isSubmitting}
                  dir="ltr"
                  autoComplete="one-time-code"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            id="login-submit-btn"
            className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {showTwoFactor ? 'جارٍ التحقق...' : 'جارٍ تسجيل الدخول...'}
              </>
            ) : (
              showTwoFactor ? 'تحقق والدخول' : 'تسجيل الدخول'
            )}
          </button>

          {showTwoFactor && (
            <button
              type="button"
              onClick={() => { setShowTwoFactor(false); setTwoFactorCode(''); setError(''); }}
              className="w-full text-xs text-slate-500 hover:text-slate-400 transition text-center"
            >
              ← العودة إلى تسجيل الدخول
            </button>
          )}
        </form>
      </div>
    </div>
  );
}