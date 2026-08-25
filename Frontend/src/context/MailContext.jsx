import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';
import draftsApi from '../services/draftsApi';

const MailContext = createContext();

const defaultAdvancedFilters = {
  startDate: '',
  endDate: '',
  institutionId: '',
  hasAttachment: null,
  isRead: null,
};

export const MailProvider = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [activeFolder, setActiveFolder] = useState('inbox'); // 'inbox' | 'sent' | 'archived' | 'groups' | 'direct' | 'drafts'
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState(defaultAdvancedFilters);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [drafts, setDrafts] = useState([]);

  const hasActiveAdvancedFilters = Boolean(
    advancedFilters.startDate ||
    advancedFilters.endDate ||
    advancedFilters.institutionId ||
    advancedFilters.hasAttachment !== null ||
    advancedFilters.isRead !== null
  );

  const clearAdvancedFilters = useCallback(() => {
    setAdvancedFilters(defaultAdvancedFilters);
  }, []);

  // ── Unread message count ───────────────────────────────────────────────
  const refreshUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const response = await api.get('/messages/unread-count');
      setUnreadCount(response.data?.unreadCount ?? 0);
    } catch {
      // Graceful fallback when server is restarting or offline
      setUnreadCount(0);
    }
  }, [user]);

  // ── Server-Side Drafts ──────────────────────────────────────────────────
  const loadDrafts = useCallback(async () => {
    if (!user) {
      setDrafts([]);
      return;
    }
    try {
      const data = await draftsApi.getDrafts();
      const draftsList = data || [];
      setDrafts(draftsList);
      // If server has no drafts, clear local draft backup
      if (draftsList.length === 0) {
        localStorage.removeItem('draft_backup');
        localStorage.removeItem('draft_backup_time');
        localStorage.removeItem('cspj_draft_backup');
      }
    } catch {
      // Fallback
    }
  }, [user]);

  // Reload drafts & unread count when user changes
  useEffect(() => {
    loadDrafts();
    refreshUnreadCount();
  }, [user?.id, loadDrafts, refreshUnreadCount]);

  // Load threads depending on folder / search query / advanced filters
  const loadMailbox = async () => {
    if (!user) return;
    if (activeFolder === 'drafts') {
      setMessages([]);
      return;
    }
    setLoading(true);
    try {
      let endpoint = '/messages/inbox';
      const isSearchActive = searchQuery.trim() || hasActiveAdvancedFilters;

      if (isSearchActive) {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.append('query', searchQuery.trim());
        if (advancedFilters.startDate) params.append('startDate', advancedFilters.startDate);
        if (advancedFilters.endDate) params.append('endDate', advancedFilters.endDate);
        if (advancedFilters.institutionId) params.append('institutionId', advancedFilters.institutionId);
        if (advancedFilters.hasAttachment !== null) params.append('hasAttachment', advancedFilters.hasAttachment);
        if (advancedFilters.isRead !== null) params.append('isRead', advancedFilters.isRead);

        endpoint = `/messages/search?${params.toString()}`;
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
      refreshUnreadCount();
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
    refreshUnreadCount();
  }, [activeFolder, searchQuery, advancedFilters, user, refreshUnreadCount]);

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
      refreshUnreadCount();
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
   * Upsert a draft via server-side API.
   */
  const saveDraft = async (draftData) => {
    if (!user) return null;
    const isUpdate = draftData.draftId && !isNaN(Number(draftData.draftId));
    try {
      const recipientIds = draftData.recipientIds?.length 
        ? draftData.recipientIds 
        : (draftData.selectedIds?.length 
            ? draftData.selectedIds 
            : (draftData.receiverId ? [Number(draftData.receiverId)] : []));

      const payload = {
        recipientIds,
        subject: draftData.subject || '',
        body: draftData.body || ''
      };

      if (isUpdate) {
        const updated = await draftsApi.updateDraft(Number(draftData.draftId), payload);
        setDrafts(prev => {
          const exists = prev.some(d => d.id === updated.id || d.draftId === updated.id);
          if (exists) {
            return prev.map(d => (d.id === updated.id || d.draftId === updated.id) ? updated : d);
          }
          return [updated, ...prev];
        });
        return updated.id;
      } else {
        const created = await draftsApi.createDraft(payload);
        setDrafts(prev => [created, ...prev]);
        return created.id;
      }
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du brouillon :", err);
      throw err;
    }
  };

  /** Remove a draft by its ID via server-side API. */
  const deleteDraft = async (draftId) => {
    if (!draftId) return;
    try {
      if (!isNaN(Number(draftId))) {
        await draftsApi.deleteDraft(Number(draftId));
      }
      setDrafts(prev => prev.filter(d => String(d.id) !== String(draftId) && String(d.draftId) !== String(draftId)));
      // Always remove local draft backup when a draft is deleted
      localStorage.removeItem('draft_backup');
      localStorage.removeItem('draft_backup_time');
      localStorage.removeItem('cspj_draft_backup');
    } catch (err) {
      console.error("Erreur lors de la suppression du brouillon :", err);
      throw err;
    }
  };

  // ── Bulk operations ──────────────────────────────────────────────────
  const bulkMarkAsRead = async (threadIds, isRead = true) => {
    if (!threadIds || threadIds.length === 0) return;
    try {
      // Optimistic update
      setMessages(prev => prev.map(m => {
        if (threadIds.includes(m.threadId)) {
          return { ...m, aDesMessagesNonLus: !isRead };
        }
        return m;
      }));
      await api.post('/messages/bulk-read', { threadIds, isRead });
      await refreshUnreadCount();
    } catch (err) {
      console.error("Erreur lors de la mise à jour par lot (lecture) :", err);
      await loadMailbox();
      throw err;
    }
  };

  const bulkArchive = async (threadIds, isArchived = true) => {
    if (!threadIds || threadIds.length === 0) return;
    try {
      if (activeFolder === 'inbox' || activeFolder === 'sent') {
        setMessages(prev => prev.filter(m => !threadIds.includes(m.threadId)));
      } else if (activeFolder === 'archived' && !isArchived) {
        setMessages(prev => prev.filter(m => !threadIds.includes(m.threadId)));
      }
      if (selectedMessage && threadIds.includes(selectedMessage.threadId)) {
        setSelectedMessage(null);
      }
      await api.post('/messages/bulk-archive', { threadIds, isArchived });
      await refreshUnreadCount();
      await loadMailbox();
    } catch (err) {
      console.error("Erreur lors de l'archivage par lot :", err);
      await loadMailbox();
      throw err;
    }
  };

  const bulkDelete = async (threadIds) => {
    if (!threadIds || threadIds.length === 0) return;
    try {
      setMessages(prev => prev.filter(m => !threadIds.includes(m.threadId)));
      if (selectedMessage && threadIds.includes(selectedMessage.threadId)) {
        setSelectedMessage(null);
      }
      await api.post('/messages/bulk-delete', { threadIds });
      await refreshUnreadCount();
    } catch (err) {
      console.error("Erreur lors de la suppression par lot :", err);
      await loadMailbox();
      throw err;
    }
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
      advancedFilters,
      setAdvancedFilters,
      clearAdvancedFilters,
      hasActiveAdvancedFilters,
      sendNewMessage,
      createGroupThread,
      replyToThread,
      toggleArchiveMessage,
      deleteThread,
      markAsReadMessage,
      bulkMarkAsRead,
      bulkArchive,
      bulkDelete,
      drafts,
      saveDraft,
      deleteDraft,
      contacts,
      loading,
      unreadCount,
      refreshUnreadCount,
      refreshMailbox: loadMailbox
    }}>
      {children}
    </MailContext.Provider>
  );
};

export const useMail = () => useContext(MailContext);