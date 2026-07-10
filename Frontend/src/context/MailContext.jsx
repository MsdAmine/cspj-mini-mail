import React, { createContext, useState, useContext } from 'react';
import { useAuth } from './AuthContext';

const MailContext = createContext();

export const MailProvider = ({ children }) => {
  const { user } = useAuth();
  const [activeFolder, setActiveFolder] = useState('inbox'); // 'inbox' | 'sent' | 'archived'
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Liste initiale calquée sur tes modèles C#
  const [messages, setMessages] = useState([
    {
      id: 101,
      senderId: 2,
      senderName: "Nadia Bennani",
      senderEmail: "n.bennani@cspj.ma",
      receiverId: 5,
      receiverName: "Association des Magistrats",
      subject: "Dossiers de validation - Session Juillet",
      body: "Bonjour,\n\nMerci de trouver ci-joint les pièces requises pour finaliser l'inscription des nouveaux magistrats.\n\nCordialement.",
      dateEnvoi: "2026-07-09T14:30:00Z",
      isRead: false,
      isArchived: false,
      piecesJointes: [{ id: 1, nomFichier: "communique_officiel.pdf", taille: "450 KB" }],
      threads: [
        {
          id: 501,
          messageId: 101,
          senderName: "Association des Magistrats",
          senderEmail: "contact@association-magistrats.ma",
          body: "Bien reçu, nous traitons le dossier dès demain matin. Merci pour votre réactivité.",
          dateReponse: "2026-07-09T15:10:00Z"
        }
      ]
    },
    {
      id: 102,
      senderId: 5,
      senderName: "Association Justice & Progrès",
      senderEmail: "contact@justice-progres.ma",
      receiverId: 1,
      receiverName: "Administration Centrale",
      subject: "Demande d'assistance technique sur les comptes",
      body: "Bonjour,\n\nCertains de nos membres ne reçoivent pas les notifications de l'application interne. Pouvez-vous vérifier le statut ?",
      dateEnvoi: "2026-07-08T09:15:00Z",
      isRead: true,
      isArchived: false,
      piecesJointes: [],
      threads: []
    }
  ]);

  // Action : Envoyer un nouveau message (Nouveau fil)
  // Mis à jour pour accepter l'objet envoyé par ComposeModal
  const sendNewMessage = ({ senderName, senderEmail, receiverEmail, subject, body }) => {
    const newMsg = {
      id: Date.now(),
      senderId: user?.id || 1,
      senderName: senderName || user?.username || "Moi",
      senderEmail: senderEmail || user?.email || "moi@cspj.ma",
      receiverId: 99, 
      receiverName: receiverEmail.split('@')[0], // Extrait le nom avant le @ par défaut
      receiverEmail: receiverEmail,
      subject,
      body,
      dateEnvoi: new Date().toISOString(),
      isRead: true,
      isArchived: false,
      piecesJointes: [],
      threads: []
    };
    
    setMessages(prev => [newMsg, ...prev]);
  };

  // Action : Ajouter un commentaire dans un Thread existant
  const replyToThread = (messageId, body) => {
    const newReply = {
      id: Date.now(),
      messageId: messageId,
      senderName: user?.username || "Moi",
      senderEmail: user?.email || "moi@cspj.ma",
      body,
      dateReponse: new Date().toISOString()
    };

    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, threads: [...msg.threads, newReply] };
      }
      return msg;
    }));

    if (selectedMessage && selectedMessage.id === messageId) {
      setSelectedMessage(prev => ({ ...prev, threads: [...prev.threads, newReply] }));
    }
  };

  const toggleArchiveMessage = (id) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isArchived: !m.isArchived } : m));
    if (selectedMessage?.id === id) setSelectedMessage(null);
  };

  const markAsReadMessage = (id) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
  };

  return (
    <MailContext.Provider value={{
      messages,
      activeFolder,
      setActiveFolder,
      selectedMessage,
      setSelectedMessage,
      searchQuery,
      setSearchQuery,
      sendNewMessage,
      replyToThread,
      toggleArchiveMessage,
      markAsReadMessage
    }}>
      {children}
    </MailContext.Provider>
  );
};

export const useMail = () => useContext(MailContext);