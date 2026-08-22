import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const MailContext = createContext();

export const MailProvider = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [activeFolder, setActiveFolder] = useState('inbox'); // 'inbox' | 'sent' | 'archived' | 'groups' | 'direct' | 'drafts'
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  // ── Drafts (per-user localStorage) ──────────────────────────────────────
  const getDraftKey = (uid) => `cspj_drafts__${uid ?? 'guest'}`;

  const readDrafts = (uid) => {
    try {
      const raw = localStorage.getItem(getDraftKey(uid));
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  };

  const [drafts, setDrafts] = useState(() => readDrafts(null));

  // Reload drafts when the logged-in user changes
  useEffect(() => {
    setDrafts(readDrafts(user?.id));
  }, [user?.id]);

  // Load threads depending on folder / search query
  const loadMailbox = async () => {
    if (!user) return;
    if (activeFolder === 'drafts') {
      setMessages([]);
      return;
    }
    setLoading(true);
    try {
      let endpoint = '/messages/inbox';
      if (searchQuery.trim()) {
        endpoint = `/messages/search?searchTerm=${encodeURIComponent(searchQuery)}`;
      } else if (activeFolder === 'sent') {
        endpoint = '/messages/sent';
      } else if (activeFolder === 'archived') {
        endpoint = '/messages/archive';
      } else if (activeFolder === 'groups') {
        endpoint = '/messages/groups';
      } else if (activeFolder === 'direct') {
        endpoint = '/messages/direct';
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

  // Clear the selected message whenever the active folder changes so the
  // reading pane never shows a thread that belongs to a different folder.
  useEffect(() => {
    setSelectedMessage(null);
  }, [activeFolder]);

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
        receiverIds.forEach(id => formData.append('destinataireIds', id));
        if (isGroup && titreGroupe) formData.append('titreGroupe', titreGroupe.trim());
        if (isBroadcast)            formData.append('estDiffusion', 'true');
      } else {
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

  // Create a group thread via the dedicated JSON endpoint (Groups page)
  const createGroupThread = async ({ groupTitle, corps, participantIds }) => {
    try {
      const response = await api.post('/messages/groups/create', {
        groupTitle: groupTitle.trim(),
        corps: corps.trim(),
        participantIds
      });
      await loadMailbox();
      return response.data;
    } catch (err) {
      const msg = err.response?.data || "حدث خطأ أثناء إنشاء المجموعة.";
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
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

  // Soft-delete a thread for the current user only
  const deleteThread = async (threadId) => {
    try {
      await api.delete(`/messages/thread/${threadId}`);
      // Remove immediately from local state (optimistic update)
      setMessages(prev => prev.filter(m => m.threadId !== threadId));
      // Clear the detail view if the deleted thread is currently selected
      setSelectedMessage(prev => (prev?.threadId === threadId ? null : prev));
    } catch (err) {
      console.error("Erreur lors de la suppression de la discussion :", err);
      throw err; // re-throw so the caller can show a toast
    }
  };

  const markAsReadMessage = () => {
    // Handled automatically on the backend upon fetching details
  };

  /**
   * Upsert a draft. Pass a `draftId` to update an existing one; omit to create new.
   * Returns the draftId so ComposePage can track which draft is being edited.
   */
  const saveDraft = (draftData) => {
    const uid = user?.id;
    const existing = readDrafts(uid);
    const isUpdate = draftData.draftId && existing.some(d => d.draftId === draftData.draftId);

    const entry = {
      ...draftData,
      draftId: draftData.draftId || `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      savedAt: new Date().toISOString(),
    };

    const updated = isUpdate
      ? existing.map(d => d.draftId === entry.draftId ? entry : d)
      : [entry, ...existing];

    localStorage.setItem(getDraftKey(uid), JSON.stringify(updated));
    setDrafts(updated);
    return entry.draftId;
  };

  /** Remove a draft by its draftId. */
  const deleteDraft = (draftId) => {
    const uid = user?.id;
    const updated = readDrafts(uid).filter(d => d.draftId !== draftId);
    localStorage.setItem(getDraftKey(uid), JSON.stringify(updated));
    setDrafts(updated);
  };

  return (
    <MailContext.Provider value={{
      messages,
      activeFolder,
      setActiveFolder,
      selectedMessage,
      setSelectedMessage: selectMessage,
      searchQuery,
      setSearchQuery,
      sendNewMessage,
      createGroupThread,
      replyToThread,
      toggleArchiveMessage,
      deleteThread,
      markAsReadMessage,
      drafts,
      saveDraft,
      deleteDraft,
      contacts,
      loading,
      refreshMailbox: loadMailbox
    }}>
      {children}
    </MailContext.Provider>
  );
};

export const useMail = () => useContext(MailContext);