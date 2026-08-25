import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useMail } from "../context/MailContext";
import { useAuth } from "../context/AuthContext";
import TiptapEditor from "../components/TiptapEditor";
import Sidebar from "../components/Sidebar";

// ── Role → Arabic label helper ───────────────────────────────────────────────
const getRoleArabicLabel = (role) => {
  if (!role) return '';
  const lower = role.toString().toLowerCase();
  if (lower === 'fonctionnaire') return 'موظف';
  if (lower === 'association')   return 'جمعية';
  if (lower === 'admin' || lower === 'administrateur') return 'مدير النظام';
  return role;
};

// ── Toast component ──────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onClose }) {
  const bgClass = type === 'success'
    ? 'bg-emerald-600 border-emerald-500'
    : 'bg-rose-600 border-rose-500';

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl shadow-black/30 text-white text-sm font-semibold backdrop-blur-sm animate-slide-up ${bgClass}`}
      dir="rtl"
    >
      {type === 'success' ? (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <span>{message}</span>
      <button onClick={onClose} className="mr-1 opacity-70 hover:opacity-100 transition-opacity cursor-pointer">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ── SVG icon components ──────────────────────────────────────────────────────
const IconMail = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const IconBroadcast = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
  </svg>
);

const IconBack = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const IconSend = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const IconDraft = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const IconSearch = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const IconCheckCircle = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconXCircle = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconInfo = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconError = () => (
  <svg className="w-4 h-4 flex-shrink-0 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const IconHelp = () => (
  <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export default function ComposePage() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user }   = useAuth();
  const { contacts, sendNewMessage, saveDraft, deleteDraft } = useMail();

  const isAdmin = user?.role === 'Administrateur' || user?.role === 'Admin' || user?.role === 'Administrator';

  // ── Client-side safeguard: filter out Administrator accounts for non-admin callers ──
  const availableContacts = useMemo(() => {
    if (isAdmin) return contacts;
    return contacts.filter(
      (c) => c.role !== 'Administrateur' && c.role !== 'Admin' && c.role !== 'Administrator'
    );
  }, [contacts, isAdmin]);

  // ── Draft being edited (passed via navigate state or recovered from local backup) ──
  const incomingDraft = location.state?.draft ?? null;

  // Local storage recovery fallback if not editing an explicit incoming draft
  const recoveredBackup = useMemo(() => {
    // If user opened an existing draft from Drafts folder, ignore localStorage completely
    if (incomingDraft) return null;
    try {
      const raw = localStorage.getItem('draft_backup') || localStorage.getItem('cspj_draft_backup');
      if (raw) {
        const parsed = JSON.parse(raw);
        const cleanBody = (parsed.body || '').replace(/<[^>]*>?/gm, '').trim();
        const hasMeaningfulContent = Boolean(
          (parsed.subject && parsed.subject.trim()) ||
          cleanBody ||
          (parsed.messageMode === 'individuel' ? parsed.receiverId : (parsed.selectedIds?.length > 0 || parsed.recipientIds?.length > 0))
        );
        if (hasMeaningfulContent) return parsed;
      }
    } catch {
      // Ignore parse error
    }
    return null;
  }, [incomingDraft]);

  const activeInitialDraft = incomingDraft || recoveredBackup;

  const initialMode = activeInitialDraft
    ? (activeInitialDraft.messageMode || (activeInitialDraft.recipientIds?.length > 1 ? "diffusion" : "individuel"))
    : "individuel";

  const initialReceiverId = activeInitialDraft?.receiverId 
    ?? (activeInitialDraft?.recipientIds?.length === 1 ? String(activeInitialDraft.recipientIds[0]) : "");

  const initialSelectedIds = activeInitialDraft?.selectedIds 
    ?? (activeInitialDraft?.recipientIds ?? []);

  const [messageMode, setMessageMode] = useState(initialMode);
  const [subject,      setSubject]     = useState(activeInitialDraft?.subject     ?? "");
  const [body,         setBody]        = useState(activeInitialDraft?.body        ?? "");
  const [attachments,  setAttachments] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSending,    setIsSending]   = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Track the draftId of the currently open draft (so "save again" updates the same record)
  const [currentDraftId, setCurrentDraftId] = useState(activeInitialDraft?.id ?? activeInitialDraft?.draftId ?? null);

  // ── Auto-save status state ('idle' | 'saving' | 'saved' | 'error') & timestamp ──
  const [autoSaveStatus, setAutoSaveStatus] = useState(activeInitialDraft ? 'saved' : 'idle');
  const [lastSavedTime, setLastSavedTime]   = useState(activeInitialDraft ? new Date() : null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [receiverId,    setReceiverId]    = useState(initialReceiverId);
  const [selectedIds,   setSelectedIds]   = useState(initialSelectedIds);
  const [contactSearch, setContactSearch] = useState("");

  // ── Refs for stable event listener & async callback access ──────────────────
  const isMountedRef         = useRef(true);
  const isSentRef            = useRef(false);
  const isSavingDraftRef     = useRef(false);
  const currentDraftIdRef    = useRef(currentDraftId);
  const localBackupTimerRef  = useRef(null);
  const hasUnsavedChangesRef = useRef(false);
  const isInitialMountRef    = useRef(true);

  // Keep current draft ID ref in sync
  useEffect(() => {
    currentDraftIdRef.current = currentDraftId;
  }, [currentDraftId]);

  // Keep hasUnsavedChanges ref in sync
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Compute clean serialized state payload for equality checking and background saves
  const getCurrentPayload = useCallback(() => {
    const recipientIds = messageMode === "individuel" 
      ? (receiverId ? [Number(receiverId)] : [])
      : selectedIds.map(Number);

    return {
      draftId: currentDraftIdRef.current,
      messageMode,
      receiverId,
      selectedIds,
      recipientIds,
      subject: subject.trim(),
      body: body.trim(),
      attachmentNames: attachments.map(f => f.name),
    };
  }, [messageMode, receiverId, selectedIds, subject, body, attachments]);

  // Track the last successfully saved payload string to avoid redundant auto-saves
  const lastSavedPayloadStrRef = useRef(
    JSON.stringify({
      messageMode: initialMode,
      receiverId: initialReceiverId,
      selectedIds: initialSelectedIds,
      subject: (activeInitialDraft?.subject ?? "").trim(),
      body: (activeInitialDraft?.body ?? "").trim(),
      attachmentNames: [],
    })
  );

  // ── Toast state ──────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null); // { message, type }
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), duration);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    if (recoveredBackup && !incomingDraft) {
      showToast("تمت استعادة المسودة تلقائيًا من الحفظ المؤقت ✓", 'success', 4000);
    }
    return () => {
      isMountedRef.current = false;
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (localBackupTimerRef.current) clearTimeout(localBackupTimerRef.current);
    };
  }, []);

  // ── Perform Server-Side Draft Save ───────────────────────────────────────
  const performServerSave = useCallback(async () => {
    if (isSentRef.current || !isMountedRef.current || isSavingDraftRef.current) return;

    const payload = getCurrentPayload();
    const cleanBodyText = (payload.body || '').replace(/<[^>]*>?/gm, '').trim();
    const hasAnyContent = Boolean(
      payload.subject ||
      cleanBodyText ||
      (payload.messageMode === 'individuel' ? payload.receiverId : payload.selectedIds.length > 0) ||
      payload.attachmentNames.length > 0
    );

    if (!hasAnyContent) {
      setHasUnsavedChanges(false);
      hasUnsavedChangesRef.current = false;
      return;
    }

    try {
      isSavingDraftRef.current = true;

      const savedDraftId = await saveDraft({
        draftId: currentDraftIdRef.current,
        recipientIds: payload.recipientIds,
        subject: payload.subject,
        body: payload.body,
      });

      if (!isMountedRef.current || isSentRef.current) return;

      if (savedDraftId) {
        setCurrentDraftId(savedDraftId);
        currentDraftIdRef.current = savedDraftId;
      }

      // Update baseline to current saved payload
      lastSavedPayloadStrRef.current = JSON.stringify({
        messageMode: payload.messageMode,
        receiverId: payload.receiverId,
        selectedIds: payload.selectedIds,
        subject: payload.subject,
        body: payload.body,
        attachmentNames: payload.attachmentNames,
      });

      // Sync local storage backup with confirmed server draftId
      localStorage.setItem('draft_backup', JSON.stringify({
        ...payload,
        draftId: savedDraftId || currentDraftIdRef.current,
        updatedAt: Date.now(),
      }));
      localStorage.setItem('draft_backup_time', Date.now().toString());
      localStorage.removeItem('cspj_draft_backup');

      setHasUnsavedChanges(false);
      hasUnsavedChangesRef.current = false;
      setAutoSaveStatus('saved');
      setLastSavedTime(new Date());
    } catch {
      // Quiet background failure, keeps local backup safe
      if (isMountedRef.current) {
        setAutoSaveStatus('error');
      }
    } finally {
      isSavingDraftRef.current = false;
    }
  }, [getCurrentPayload, saveDraft]);

  // ── Local Storage Crash Backup (2s Debounce - Zero Server Hits) ──────────
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    if (isSentRef.current) return;

    const payload = getCurrentPayload();
    const currentPayloadStr = JSON.stringify({
      messageMode: payload.messageMode,
      receiverId: payload.receiverId,
      selectedIds: payload.selectedIds,
      subject: payload.subject,
      body: payload.body,
      attachmentNames: payload.attachmentNames,
    });

    const cleanBodyText = (payload.body || '').replace(/<[^>]*>?/gm, '').trim();
    const hasAnyContent = Boolean(
      payload.subject ||
      cleanBodyText ||
      (payload.messageMode === 'individuel' ? payload.receiverId : payload.selectedIds.length > 0) ||
      payload.attachmentNames.length > 0
    );

    const isChanged = currentPayloadStr !== lastSavedPayloadStrRef.current;

    if (!isChanged) {
      return;
    }

    if (hasAnyContent) {
      setHasUnsavedChanges(true);
      hasUnsavedChangesRef.current = true;

      // Debounce saving to localStorage (2 seconds)
      if (localBackupTimerRef.current) clearTimeout(localBackupTimerRef.current);
      localBackupTimerRef.current = setTimeout(() => {
        try {
          localStorage.setItem('draft_backup', JSON.stringify({
            ...payload,
            draftId: currentDraftIdRef.current,
            updatedAt: Date.now(),
          }));
          localStorage.setItem('draft_backup_time', Date.now().toString());
        } catch {
          // Ignore local storage quota errors
        }
      }, 2000);
    } else {
      setHasUnsavedChanges(false);
      hasUnsavedChangesRef.current = false;
      if (localBackupTimerRef.current) clearTimeout(localBackupTimerRef.current);
    }

    return () => {
      if (localBackupTimerRef.current) clearTimeout(localBackupTimerRef.current);
    };
  }, [messageMode, receiverId, selectedIds, subject, body, attachments, getCurrentPayload]);

  // ── Periodic Server Sync (Every 60 Seconds) ──────────────────────────────
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (hasUnsavedChangesRef.current && !isSentRef.current && !isSavingDraftRef.current) {
        performServerSave();
      }
    }, 60000);

    return () => clearInterval(syncInterval);
  }, [performServerSave]);

  // ── Browser Tab / Window Closure & Visibility Protection ─────────────────
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChangesRef.current && !isSentRef.current) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const handleVisibilityOrPageHide = () => {
      if (isSentRef.current) return;

      const payload = getCurrentPayload();
      const cleanBodyText = (payload.body || '').replace(/<[^>]*>?/gm, '').trim();
      const hasAnyContent = Boolean(
        payload.subject ||
        cleanBodyText ||
        (payload.messageMode === 'individuel' ? payload.receiverId : payload.selectedIds.length > 0) ||
        payload.attachmentNames.length > 0
      );

      if (!hasAnyContent) return;

      // 1. Sync to local storage
      try {
        localStorage.setItem('draft_backup', JSON.stringify({
          ...payload,
          draftId: currentDraftIdRef.current,
          updatedAt: Date.now(),
        }));
        localStorage.setItem('draft_backup_time', Date.now().toString());
      } catch {
        // Ignore quota / storage errors
      }

      // 2. Dispatch background keepalive fetch to server if there are unsaved changes
      if (hasUnsavedChangesRef.current) {
        try {
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5182/api';
          const draftId = currentDraftIdRef.current;
          const url = draftId ? `${baseUrl}/drafts/${draftId}` : `${baseUrl}/drafts`;
          const method = draftId ? 'PUT' : 'POST';
          const saveDto = {
            recipientIds: payload.recipientIds,
            subject: payload.subject || '',
            body: payload.body || '',
          };

          fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saveDto),
            credentials: 'include',
            keepalive: true,
          }).catch(() => {});
        } catch {
          // Ignore network errors on unload
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleVisibilityOrPageHide);
    document.addEventListener('visibilitychange', handleVisibilityOrPageHide);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleVisibilityOrPageHide);
      document.removeEventListener('visibilitychange', handleVisibilityOrPageHide);
    };
  }, [getCurrentPayload]);

  // ── Contact filtering ────────────────────────────────────────────────────
  const filteredContacts = availableContacts.filter((c) =>
    `${c.nomComplet} ${c.email} ${c.institutionNom}`
      .toLowerCase()
      .includes(contactSearch.toLowerCase())
  );

  const toggleContact = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const allFilteredIds = filteredContacts.map((c) => c.id);
  const allFilteredSelected =
    allFilteredIds.length > 0 &&
    allFilteredIds.every((id) => selectedIds.includes(id));

  const selectAll = () => {
    setSelectedIds((prev) => {
      const newSet = new Set([...prev, ...allFilteredIds]);
      return Array.from(newSet);
    });
  };

  const deselectAll = () => {
    setSelectedIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
  };

  const switchMode = (mode) => {
    setMessageMode(mode);
    setErrorMessage("");
    setSelectedIds([]);
    setContactSearch("");
  };

  // ── Send ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e?.preventDefault();
    setErrorMessage("");

    if (messageMode === "individuel") {
      if (!receiverId || !subject.trim() || !body.trim()) {
        setErrorMessage("يرجى ملء جميع الحقول المطلوبة.");
        return;
      }
    } else if (messageMode === "diffusion") {
      if (selectedIds.length < 1) {
        setErrorMessage("يرجى تحديد مستلم واحد على الأقل للإرسال الجماعي.");
        return;
      }
      if (!subject.trim() || !body.trim()) {
        setErrorMessage("يرجى ملء جميع الحقول المطلوبة.");
        return;
      }
    }

    // Cancel pending local backup debounce
    if (localBackupTimerRef.current) clearTimeout(localBackupTimerRef.current);

    setIsSending(true);
    try {
      await sendNewMessage({
        subject: subject.trim(),
        body: body.trim(),
        receiverId: messageMode === "individuel" ? receiverId : undefined,
        receiverIds: messageMode === "individuel" ? [receiverId] : selectedIds,
        estDiffusion: messageMode === "diffusion",
        attachments,
      });

      // Mark as sent so beforeunload and background sync do not trigger
      isSentRef.current = true;
      hasUnsavedChangesRef.current = false;
      setHasUnsavedChanges(false);

      // Clean up localStorage backup
      localStorage.removeItem('draft_backup');
      localStorage.removeItem('draft_backup_time');
      localStorage.removeItem('cspj_draft_backup');

      // If this was a draft or auto-saved draft, remove it from backend now that it's sent
      const draftIdToDelete = currentDraftIdRef.current || currentDraftId;
      if (draftIdToDelete) {
        deleteDraft(draftIdToDelete).catch(() => {});
      }

      navigate('/dashboard');
    } catch (err) {
      setIsSending(false);
      setErrorMessage(err.message || "حدث خطأ أثناء إرسال الرسالة.");
    }
  };

  // ── Save as Draft (Manual) ───────────────────────────────────────────────
  const handleSaveDraft = async () => {
    if (localBackupTimerRef.current) clearTimeout(localBackupTimerRef.current);
    setIsSavingDraft(true);
    try {
      const recipientIds = messageMode === "individuel" 
        ? (receiverId ? [Number(receiverId)] : [])
        : selectedIds.map(Number);

      const draftPayload = {
        draftId: currentDraftIdRef.current || currentDraftId,
        messageMode,
        subject,
        body,
        receiverId,
        selectedIds,
        recipientIds,
        attachmentNames: attachments.map(f => f.name),
      };

      const newId = await saveDraft(draftPayload);
      setCurrentDraftId(newId);
      currentDraftIdRef.current = newId;

      lastSavedPayloadStrRef.current = JSON.stringify({
        messageMode,
        receiverId,
        selectedIds,
        subject: subject.trim(),
        body: body.trim(),
        attachmentNames: attachments.map(f => f.name),
      });

      localStorage.setItem('draft_backup', JSON.stringify({
        ...draftPayload,
        draftId: newId,
        updatedAt: Date.now(),
      }));
      localStorage.setItem('draft_backup_time', Date.now().toString());
      localStorage.removeItem('cspj_draft_backup');

      setHasUnsavedChanges(false);
      hasUnsavedChangesRef.current = false;
      setAutoSaveStatus('saved');
      setLastSavedTime(new Date());

      showToast("تم حفظ المسودة بنجاح ✓", 'success');

      // Navigate after the toast is visible
      setTimeout(() => {
        if (isMountedRef.current) navigate('/dashboard');
      }, 1200);
    } catch {
      showToast("حدث خطأ أثناء حفظ المسودة.", 'error');
    } finally {
      if (isMountedRef.current) setIsSavingDraft(false);
    }
  };

  const segTabClass = (mode) =>
    `flex items-center justify-center gap-2 py-2 px-6 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer w-48 ${
      messageMode === mode
        ? "bg-slate-800 text-white shadow-md"
        : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
    }`;

  const MultiSelectPanel = () => (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            المستلمون ({selectedIds.length})
          </label>
        </div>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={selectAll}
            disabled={isSending || allFilteredSelected}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all duration-150 cursor-pointer shadow-sm"
          >
            <IconCheckCircle /> تحديد الكل
          </button>
          <button
            type="button"
            onClick={deselectAll}
            disabled={isSending || selectedIds.length === 0}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all duration-150 cursor-pointer shadow-sm"
          >
            <IconXCircle /> إلغاء التحديد
          </button>
        </div>
        <div className="relative">
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center">
            <IconSearch />
          </span>
          <input
            type="text"
            dir="rtl"
            placeholder="البحث عن جهة اتصال..."
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-150"
            disabled={isSending}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {filteredContacts.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">لا توجد جهات اتصال مطابقة.</div>
        ) : (
          <div className="space-y-1 pb-4">
            {filteredContacts.map((contact) => {
              const isSelected = selectedIds.includes(contact.id);
              return (
                <label
                  key={contact.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 select-none ${
                    isSelected ? "bg-blue-50/60 border border-blue-100" : "hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleContact(contact.id)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    disabled={isSending}
                  />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold uppercase flex-shrink-0 ${
                    isSelected ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600"
                  }`}>
                    {contact.nomComplet.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{contact.nomComplet}</p>
                    <p className="text-[10px] text-slate-500 truncate">{getRoleArabicLabel(contact.role)} — {contact.institutionNom}</p>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const isEditingDraft = !!incomingDraft;

  return (
    <div dir="rtl" className="flex h-screen w-full bg-[#f8fafc] overflow-hidden font-sans text-slate-800">
      {/* Sidebar for consistency */}
      <Sidebar
        onComposeOpen={() => {}}
        isAdminView={user?.role === 'Administrateur'}
        setIsAdminView={() => {}}
        adminTab={'stats'}
        setAdminTab={() => {}}
      />

      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 flex-shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-sm font-medium"
            >
              <IconBack />
              العودة
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              {isEditingDraft ? 'تحرير المسودة' : 'رسالة جديدة'}
            </h1>

            {/* Auto-save status in header */}
            {lastSavedTime ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <IconCheckCircle />
                تم حفظ المسودة تلقائيًا ({lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </span>
            ) : isEditingDraft ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                <IconDraft />
                مسودة
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {/* Save as Draft button */}
            <button
              onClick={handleSaveDraft}
              disabled={isSending || isSavingDraft}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer border border-slate-200/80 hover:border-slate-300"
            >
              {isSavingDraft ? <Spinner /> : <IconDraft />}
              حفظ كمسودة
            </button>
            {/* Send button */}
            <button
              onClick={handleSubmit}
              disabled={isSending || isSavingDraft}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
            >
              {isSending ? (
                <><Spinner /> جاري الإرسال...</>
              ) : (
                <><IconSend /> إرسال</>
              )}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col relative">

          {/* Draft restore notice */}
          {isEditingDraft && incomingDraft?.attachmentNames?.length > 0 && (
            <div className="mx-8 mt-4 p-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 flex-shrink-0">
              <IconInfo />
              <span>
                المرفقات السابقة لا يمكن استعادتها تلقائيًا. يرجى إعادة إرفاق:
                <strong className="mx-1">{incomingDraft.attachmentNames.join('، ')}</strong>
              </span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex justify-center pt-6 pb-4 flex-shrink-0">
            <div className="flex bg-white p-1 rounded-full border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
              <button
                type="button"
                className={segTabClass("individuel")}
                onClick={() => switchMode("individuel")}
                disabled={isSending}
              >
                <IconMail /> رسالة فردية
              </button>
              <button
                type="button"
                className={segTabClass("diffusion")}
                onClick={() => switchMode("diffusion")}
                disabled={isSending}
              >
                <IconBroadcast /> إرسال متعدد
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mx-8 mb-4 p-3 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 flex-shrink-0">
              <IconError />
              {errorMessage}
            </div>
          )}

          {/* Form Layout */}
          <form id="compose-form" onSubmit={handleSubmit} className="flex-1 overflow-hidden flex px-8 pb-8 gap-6 max-w-7xl mx-auto w-full">

            {/* Editor Area (Flex Grow) */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative min-h-0">
              <div className="p-5 border-b border-slate-100 space-y-4 flex-shrink-0 bg-slate-50/30">
                {/* Single Recipient Selector */}
                {messageMode === "individuel" && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider">إلى *</label>
                    <select
                      required
                      value={receiverId}
                      onChange={(e) => setReceiverId(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-150 cursor-pointer shadow-sm"
                      disabled={isSending}
                    >
                      <option value="">اختر جهة اتصال...</option>
                      {availableContacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.nomComplet} ({getRoleArabicLabel(contact.role)} — {contact.institutionNom})
                        </option>
                      ))}
                    </select>

                    {/* Support note for non-admin users */}
                    {!isAdmin && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-800 text-[11px] leading-relaxed">
                        <IconHelp />
                        <span>
                          لطلب المساعدة التقنية أو الإبلاغ عن مشكلة في المنصة، يرجى التوجه إلى قسم{" "}
                          <Link to="/support" className="font-bold underline hover:text-indigo-950">
                            الدعم الفني
                          </Link>
                          .
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-wider">الموضوع *</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="موضوع الرسالة..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-150 shadow-sm"
                    disabled={isSending}
                  />
                </div>
              </div>

              {/* Tiptap Editor (Full Height) */}
              <div className="flex-1 overflow-y-auto flex flex-col bg-white [&_.tiptap]:min-h-[350px]">
                <TiptapEditor
                  content={body}
                  onChange={setBody}
                  placeholder="اكتب رسالتك هنا..."
                  attachments={attachments}
                  onAttachmentsChange={setAttachments}
                />
              </div>

              {/* Editor Footer / Auto-save Status Bar */}
              <div className="px-5 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
                <div className="flex items-center gap-2">
                  {lastSavedTime ? (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <IconCheckCircle />
                      <span>تم حفظ المسودة تلقائيًا ({lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                    </div>
                  ) : autoSaveStatus === 'error' ? (
                    <div className="flex items-center gap-1.5 text-rose-600 font-medium">
                      <IconError />
                      <span>تعذر المزامنة مع الخادم (محفوظ محلياً)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <IconDraft />
                      <span>الحفظ التلقائي مفعّل (كل 60 ثانية)</span>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 font-mono">
                  {currentDraftId ? `مسودة #${currentDraftId}` : 'مسودة جديدة'}
                </div>
              </div>
            </div>

            {/* Sidebar for Multiple Recipients (Right Side in RTL) */}
            {messageMode === "diffusion" && (
              <div className="w-[320px] flex-shrink-0 flex flex-col min-h-0 animate-fade-in">
                <MultiSelectPanel />
              </div>
            )}

          </form>

        </div>
      </div>

      {/* ── Toast Notification ── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ── Inline keyframe for toast slide-up animation ── */}
      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translate(-50%, 1.5rem); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
      `}</style>
    </div>
  );
}
