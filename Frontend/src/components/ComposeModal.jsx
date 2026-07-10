import React, { useState } from 'react';
import { useMail } from '../context/MailContext';
import { useAuth } from '../context/AuthContext';

export default function ComposeModal({ onClose }) {
  const { user } = useAuth();
  const { contacts, sendNewMessage } = useMail();

  // États du formulaire
  const [receiverId, setReceiverId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!receiverId || !subject.trim() || !body.trim()) {
      setErrorMessage("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setIsSending(true);
    try {
      await sendNewMessage({
        subject: subject.trim(),
        body: body.trim(),
        receiverId: receiverId
      });
      onClose();
    } catch (err) {
      setErrorMessage(err.message || "Une erreur est survenue lors de l'envoi.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden m-4">
        
        {/* Header du Modal */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold tracking-wide text-sm uppercase">Nouveau Message Interne</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition text-xl outline-none"
            disabled={isSending}
          >
            ✕
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMessage && (
            <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Destinataire */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">
              Destinataire *
            </label>
            <select
              required
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
              disabled={isSending}
            >
              <option value="">Sélectionnez un contact...</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.nomComplet} ({contact.role} - {contact.entrepriseNom})
                </option>
              ))}
            </select>
          </div>

          {/* Objet */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">
              Objet du message *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Suivi du dossier de partenariat / Rectification des accès"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
              disabled={isSending}
            />
          </div>

          {/* Corps du message */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">
              Message *
            </label>
            <textarea
              required
              rows="8"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Écrivez votre message professionnel ici..."
              className="w-full p-4 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition"
              disabled={isSending}
            />
          </div>

          {/* Footer du Modal */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {/* Bouton Fichier Joint (Simulé ou pour la suite) */}
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-400 font-sans">
              <span>Pièces jointes gérées par le système</span>
            </div>

            {/* Actions d'envoi */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                disabled={isSending}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-2"
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Envoi...
                  </>
                ) : (
                  'Envoyer le message'
                )}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}