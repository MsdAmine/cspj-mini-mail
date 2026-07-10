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

  // Send a brand new message thread
  const sendNewMessage = async ({ subject, body, receiverId }) => {
    try {
      await api.post('/messages/thread', {
        objet: subject.trim(),
        corps: body.trim(),
        destinataireId: parseInt(receiverId, 10)
      });
      await loadMailbox();
    } catch (err) {
      const msg = err.response?.data || "Erreur lors de l'envoi du message.";
      throw new Error(msg);
    }
  };

  // Reply inside an existing conversation thread
  const replyToThread = async (threadId, body) => {
    try {
      await api.post(`/messages/thread/${threadId}/reply`, {
        corps: body.trim()
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