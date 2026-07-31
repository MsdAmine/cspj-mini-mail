import React, { useState } from 'react';
import api from '../services/api';

export default function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('يرجى إدخال عنوان بريدك الإلكتروني / Veuillez saisir votre adresse e-mail.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSubmitted(true);
    } catch {
      // Always show success to prevent enumeration — only show error on network failures
      setError('Erreur réseau / خطأ في الشبكة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-slate-50 font-sans antialiased text-slate-900 overflow-hidden selection:bg-slate-200">
      
      {/* ── Top Accent Border ── */}
      <div className="absolute top-0 inset-x-0 h-1 bg-slate-800" />
      
      <div className="relative w-full max-w-md p-8 sm:p-10 bg-white border border-slate-200 shadow-xl rounded-2xl m-4 z-10">

        {/* Title & Icon */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-100 border border-slate-200 shadow-sm mb-5 text-slate-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mb-1" dir="rtl">إعادة ضبط كلمة المرور</h1>
          <h1 className="text-base font-bold tracking-tight text-slate-700 mb-3">Réinitialisation du mot de passe</h1>
          
          <p className="text-xs text-slate-500 mt-1" dir="rtl">أدخل بريدك الإلكتروني المؤسساتي لاستلام رابط إعادة الضبط.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Saisissez votre adresse e-mail institutionnelle pour recevoir un lien de réinitialisation.</p>
        </div>

        {submitted ? (
          /* ── Success State ── */
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-full border border-emerald-100 mx-auto">
              <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-1" dir="rtl">تم إرسال البريد الإلكتروني!</h2>
              <h2 className="text-sm font-semibold text-slate-700 mb-3">E-mail envoyé !</h2>
              
              <p className="text-xs text-slate-500 leading-relaxed" dir="rtl">
                إذا كان الحساب مرتبطًا بالعنوان <span className="text-slate-800 font-medium" dir="ltr">{email}</span>، فقد تم إرسال رابط إعادة التعيين.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Si un compte est associé à cette adresse, un lien a été envoyé.
              </p>
            </div>
            <button
              onClick={onBack}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
            >
              العودة إلى تسجيل الدخول / Retour
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <>
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-start gap-3 text-center justify-center">
                <span className="leading-relaxed font-semibold">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div dir="ltr">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-800 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Adresse e-mail / البريد الإلكتروني"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all duration-200"
                    disabled={isSubmitting}
                    autoFocus
                  />
                </div>
              </div>

              <button
                id="forgot-submit"
                type="submit"
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    جارٍ الإرسال...
                  </>
                ) : (
                  'إرسال / Envoyer'
                )}
              </button>

              <button
                type="button"
                onClick={onBack}
                className="w-full text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors text-center mt-4 pt-2"
              >
                العودة إلى تسجيل الدخول / Retour à la connexion
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
