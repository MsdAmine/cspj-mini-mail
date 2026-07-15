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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!showTwoFactor) {
      if (!email.trim() || !password.trim()) {
        setError('Veuillez remplir tous les champs.');
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await login(email, password);
        if (result && result.requiresTwoFactor) {
          setShowTwoFactor(true);
        }
      } catch (err) {
        setError(err.message || 'Une erreur est survenue lors de la connexion.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!twoFactorCode.trim()) {
        setError('Veuillez saisir le code de vérification.');
        return;
      }

      setIsSubmitting(true);
      try {
        await verifyTwoFactor(email, twoFactorCode);
      } catch (err) {
        setError(err.message || 'Code de vérification invalide.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-900 font-sans antialiased text-slate-100">
      <div className="w-full max-w-md p-8 bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
        
        {/* En-tête / Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-blue-600/10 rounded-full text-blue-500 mb-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">CSPJ MINI-MAIL</h1>
          <p className="text-sm text-slate-400 mt-1">Plateforme de messagerie interne professionnelle</p>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!showTwoFactor ? (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Adresse Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: admin@cspj.ma"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-xs text-blue-500 hover:text-blue-400 hover:underline transition"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  disabled={isSubmitting}
                />
              </div>
            </>
          ) : (
            <div>
              <p className="text-sm text-slate-300 mb-4 text-center">
                Un code de vérification a été envoyé à <strong>{email}</strong>.
              </p>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Code à 6 chiffres
              </label>
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-center tracking-[0.5em] text-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                disabled={isSubmitting}
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {showTwoFactor ? 'Vérification...' : 'Connexion en cours...'}
              </>
            ) : (
              showTwoFactor ? 'Vérifier' : 'Se connecter'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}