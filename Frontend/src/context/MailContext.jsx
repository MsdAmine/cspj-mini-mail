import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const MailContext = createContext();

export const MailProvider = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [activeFolder, setActiveFolder] = useState('inbox'); // 'inbox' | 'sent' | 'archived'
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load threads depending on folder / search query
  const loadMailbox = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let endpoint = '/messages/inbox';
      if (searchQuery.trim()) {
        endpoint = `/messages/search?searchTerm=${encodeURIComponent(searchQuery)}`;
      } else if (activeFolder === 'sent') {
        endpoint = '/messages/sent';
      } else if (activeFolder === 'archived') {
        endpoint = '/messages/archive';
      }
      
      const response = await api.get(endpoint);
      setMessages(response.data);
    } catch (err) {
      console.error("Erreur lors du chargement des discussions :", err);
    } finally {
      setLoading(false);
    }
  };

  // Load contacts for composing messages
  const loadContacts = async () => {
    if (!user) return;
    try {
      const response = await api.get('/messages/contacts');
      setContacts(response.data);
    } catch (err) {
      console.error("Erreur lors du chargement des contacts :", err);
    }
  };

  useEffect(() => {
    loadMailbox();
    loadContacts();
  }, [activeFolder, searchQuery, user]);

  // View thread details (also marks messages as read on the backend)
  const selectMessage = async (msg) => {
    if (!msg) {
      setSelectedMessage(null);
      return;
    }
    const threadId = msg.threadId;
    try {
      const response = await api.get(`/messages/thread/${threadId}`);
      setSelectedMessage(response.data);
      
      // Update unread flag locally in the list
      setMessages(prev => prev.map(m => {
        if (m.threadId === threadId) {
          return { ...m, aDesMessagesNonLus: false };
        }
        return m;
      }));
    } catch (err) {
      console.error("Erreur lors du chargement du fil de discussion :", err);
    }
  };

  // Send a brand new message thread (1-to-1, group, or broadcast diffusion)
  const sendNewMessage = async ({ subject, body, receiverId, receiverIds, titreGroupe, estDiffusion, attachments }) => {
    try {
      const formData = new FormData();
      formData.append('objet', subject.trim());
      formData.append('corps', body.trim());

      const isGroup     = !estDiffusion && receiverIds && receiverIds.length > 1;
      const isBroadcast = estDiffusion  && receiverIds && receiverIds.length >= 1;

      if (isGroup || isBroadcast) {
        // Multi-recipient: append each ID under the array field name
        receiverIds.forEach(id => formData.append('destinataireIds', id));
        if (isGroup && titreGroupe) formData.append('titreGroupe', titreGroupe.trim());
        if (isBroadcast)            formData.append('estDiffusion', 'true');
      } else {
        // 1-to-1: use the singular field
        const singleId = receiverIds?.[0] ?? receiverId;
        formData.append('destinataireId', parseInt(singleId, 10));
      }

      if (attachments && attachments.length > 0) {
        attachments.forEach(file => formData.append('attachments', file));
      }

      await api.post('/messages/thread', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await loadMailbox();
    } catch (err) {
      const msg = err.response?.data || "Erreur lors de l'envoi du message.";
      throw new Error(msg);
    }
  };

  // Reply inside an existing conversation thread
  const replyToThread = async (threadId, body, attachments = []) => {
    try {
      const formData = new FormData();
      formData.append('corps', body.trim());
      
      if (attachments && attachments.length > 0) {
        attachments.forEach(file => formData.append('attachments', file));
      }

      await api.post(`/messages/thread/${threadId}/reply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Re-fetch thread details to display the reply
      const response = await api.get(`/messages/thread/${threadId}`);
      setSelectedMessage(response.data);
      
      // Refresh the threads list
      await loadMailbox();
    } catch (err) {
      console.error("Erreur lors de la réponse au fil :", err);
    }
  };

  // Archive / unarchive conversation thread
  const toggleArchiveMessage = async (threadId) => {
    try {
      await api.put(`/messages/thread/${threadId}/archive`);
      setSelectedMessage(null);
      await loadMailbox();
    } catch (err) {
      console.error("Erreur lors du changement de statut d'archive :", err);
    }
  };

  const markAsReadMessage = () => {
    // Handled automatically on the backend upon fetching details
  };

  return (
    <MailContext.Provider value={{
      messages,
      activeFolder,
      setActiveFolder,
      selectedMessage,
      setSelectedMessage: selectMessage, // Override with API load function
      searchQuery,
      setSearchQuery,
      sendNewMessage,
      replyToThread,
      toggleArchiveMessage,
      markAsReadMessage,
      contacts,
      loading,
      refreshMailbox: loadMailbox
    }}>
      {children}
    </MailContext.Provider>
  );
};

export const useMail = () => useContext(MailContext);