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
      setError('يرجى إدخال عنوان بريدك الإلكتروني.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSubmitted(true);
    } catch {
      // Always show success to prevent enumeration — only show error on network failures
      setError('حدث خطأ في الشبكة. يرجى المحاولة مجددًا.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-900 font-sans antialiased text-slate-100">
      <div className="w-full max-w-md p-8 bg-slate-800 rounded-xl shadow-2xl border border-slate-700">

        {/* العنوان */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-blue-600/10 rounded-full text-blue-500 mb-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">نسيت كلمة المرور</h1>
          <p className="text-sm text-slate-400 mt-1">CSPJ Mini Mail · استعادة الحساب</p>
        </div>

        {submitted ? (
          /* ── حالة النجاح ── */
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-full border border-emerald-500/20 mx-auto">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">تم إرسال البريد الإلكتروني!</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                إذا كان الحساب مرتبطًا بالعنوان{' '}
                <span className="text-slate-200 font-medium">{email}</span>، فقد تم إرسال رابط إعادة التعيين. تحقق من مجلد الرسائل غير المرغوب فيها أيضًا.
              </p>
              <p className="text-xs text-slate-500 mt-3">
                ينتهي الرابط خلال <span className="text-slate-400">15 دقيقة</span>.
              </p>
            </div>
            <button
              onClick={onBack}
              className="w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              العودة إلى تسجيل الدخول
            </button>
          </div>
        ) : (
          /* ── نموذج الإدخال ── */
          <>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              أدخل عنوان بريدك الإلكتروني أدناه. إذا كان هناك حساب مرتبط به، ستتلقى رابط إعادة تعيين صالحًا لمدة <span className="text-slate-300">15 دقيقة</span>.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="مثال: vous@cspj.ma"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  disabled={isSubmitting}
                  autoFocus
                  dir="ltr"
                />
              </div>

              <button
                id="forgot-submit"
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  'إرسال رابط إعادة التعيين'
                )}
              </button>

              <button
                type="button"
                onClick={onBack}
                className="w-full py-2 text-sm text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                العودة إلى تسجيل الدخول
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
