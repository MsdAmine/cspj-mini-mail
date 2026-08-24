import React, { useState, useEffect } from "react";
import { useMail } from "../context/MailContext";
import { useAuth } from "../context/AuthContext";
import {
  Trash2,
  Star,
  Archive,
  CheckCheck,
  Mail,
  MailOpen,
  X,
  AlertTriangle,
  Loader2,
  CheckSquare,
  Square,
  MinusSquare
} from "lucide-react";
import api from "../services/api";

export default function MailList() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedThreadIds, setSelectedThreadIds] = useState([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const {
    messages,
    activeFolder,
    selectedMessage,
    setSelectedMessage,
    loading,
    searchQuery,
    setSearchQuery,
    deleteThread,
    toggleArchiveMessage,
    bulkMarkAsRead,
    bulkArchive,
    bulkDelete,
  } = useMail();

  const [localStarred, setLocalStarred] = useState(new Set());
  const [localUnstarred, setLocalUnstarred] = useState(new Set());

  // Clear selection on folder, search, or status filter change
  useEffect(() => {
    setSelectedThreadIds([]);
    setIsDeleteConfirmOpen(false);
  }, [activeFolder, searchQuery, statusFilter]);

  const getIsStarred = (msg) => {
    if (localStarred.has(msg.threadId)) return true;
    if (localUnstarred.has(msg.threadId)) return false;
    return msg.isStarred;
  };

  const handleStar = async (e, threadId, currentlyStarred) => {
    e.stopPropagation();
    const willBeStarred = !currentlyStarred;
    if (willBeStarred) {
      setLocalStarred(new Set([...localStarred, threadId]));
      setLocalUnstarred(new Set([...localUnstarred].filter(id => id !== threadId)));
    } else {
      setLocalUnstarred(new Set([...localUnstarred, threadId]));
      setLocalStarred(new Set([...localStarred].filter(id => id !== threadId)));
    }
    try {
      await api.put(`/messages/thread/${threadId}/star`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (e, threadId) => {
    e.stopPropagation();
    try {
      if (toggleArchiveMessage) {
        await toggleArchiveMessage(threadId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e, threadId) => {
    e.stopPropagation();
    try {
      await deleteThread(threadId);
    } catch {
      // errors logged in deleteThread
    }
  };

  const handleSelectMessage = (msg) => {
    setSelectedMessage(msg);
  };

  const filteredMessages = messages.filter((msg) => {
    if (msg.estGroupe) return false;

    if (statusFilter === 'unread' && !msg.aDesMessagesNonLus) return false;
    if (statusFilter === 'read' && msg.aDesMessagesNonLus) return false;
    if (statusFilter === 'starred' && !getIsStarred(msg)) return false;

    if (!searchQuery?.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    
    const subjectMatch = msg.objet?.toLowerCase().includes(q);
    const senderMatch = msg.dernierExpediteurNom?.toLowerCase().includes(q) || msg.titreGroupe?.toLowerCase().includes(q);
    const contentMatch = msg.dernierMessageCorps?.toLowerCase().includes(q);
    
    return subjectMatch || senderMatch || contentMatch;
  });

  // ── Multi-select Handlers ───────────────────────────────────────────────
  const handleToggleSelect = (e, threadId) => {
    e.stopPropagation();
    setSelectedThreadIds((prev) =>
      prev.includes(threadId)
        ? prev.filter((id) => id !== threadId)
        : [...prev, threadId]
    );
  };

  const handleToggleSelectAll = () => {
    const allFilteredIds = filteredMessages.map((m) => m.threadId);
    if (selectedThreadIds.length === allFilteredIds.length && allFilteredIds.length > 0) {
      setSelectedThreadIds([]);
    } else {
      setSelectedThreadIds(allFilteredIds);
    }
  };

  const isAllSelected =
    filteredMessages.length > 0 &&
    selectedThreadIds.length === filteredMessages.length;
  const isPartiallySelected =
    selectedThreadIds.length > 0 && !isAllSelected;

  // ── Bulk Actions ────────────────────────────────────────────────────────
  const handleBulkMarkRead = async (isRead = true) => {
    if (selectedThreadIds.length === 0 || bulkLoading) return;
    setBulkLoading(true);
    try {
      await bulkMarkAsRead(selectedThreadIds, isRead);
      setSelectedThreadIds([]);
    } catch (err) {
      console.error(err);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedThreadIds.length === 0 || bulkLoading) return;
    setBulkLoading(true);
    try {
      const willArchive = activeFolder !== 'archived';
      await bulkArchive(selectedThreadIds, willArchive);
      setSelectedThreadIds([]);
    } catch (err) {
      console.error(err);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedThreadIds.length === 0 || bulkLoading) return;
    setBulkLoading(true);
    try {
      await bulkDelete(selectedThreadIds);
      setSelectedThreadIds([]);
      setIsDeleteConfirmOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white/95 backdrop-blur-md overflow-hidden relative">
      {/* ── Contextual Top Bulk Actions Bar (Shown when items are selected) ── */}
      {selectedThreadIds.length > 0 ? (
        <div className="px-4 py-3 bg-indigo-600 text-white flex items-center justify-between gap-2 flex-shrink-0 shadow-md animate-fade-in z-20">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="p-1 rounded-md hover:bg-white/20 transition-colors cursor-pointer text-white flex items-center justify-center"
              title={isAllSelected ? "إلغاء تحديد الكل" : "تحديد الكل"}
            >
              {isAllSelected ? (
                <CheckSquare size={16} className="text-white" />
              ) : isPartiallySelected ? (
                <MinusSquare size={16} className="text-white" />
              ) : (
                <Square size={16} className="text-white" />
              )}
            </button>
            <span className="text-xs font-bold whitespace-nowrap">
              {selectedThreadIds.length} محددة
            </span>
          </div>

          {/* Bulk Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Mark as Read */}
            <button
              type="button"
              disabled={bulkLoading}
              onClick={() => handleBulkMarkRead(true)}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
              title="تعيين كـ مقروء"
            >
              <MailOpen size={15} />
              <span className="hidden xl:inline text-[11px]">مقروء</span>
            </button>

            {/* Mark as Unread */}
            <button
              type="button"
              disabled={bulkLoading}
              onClick={() => handleBulkMarkRead(false)}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
              title="تعيين كـ غير مقروء"
            >
              <Mail size={15} />
              <span className="hidden xl:inline text-[11px]">غير مقروء</span>
            </button>

            {/* Archive / Unarchive */}
            <button
              type="button"
              disabled={bulkLoading}
              onClick={handleBulkArchive}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
              title={activeFolder === "archived" ? "إلغاء الأرشفة" : "أرشفة"}
            >
              <Archive size={15} />
              <span className="hidden xl:inline text-[11px]">
                {activeFolder === "archived" ? "استعادة" : "أرشفة"}
              </span>
            </button>

            {/* Delete button (with confirmation popover) */}
            <div className="relative">
              <button
                type="button"
                disabled={bulkLoading}
                onClick={() => setIsDeleteConfirmOpen(!isDeleteConfirmOpen)}
                className="p-1.5 rounded-lg hover:bg-rose-500 text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
                title="حذف المحدد"
              >
                <Trash2 size={15} />
                <span className="hidden xl:inline text-[11px]">حذف</span>
              </button>

              {/* Confirmation Popover */}
              {isDeleteConfirmOpen && (
                <div
                  dir="rtl"
                  className="absolute top-full left-0 mt-2 w-60 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 p-3 z-30 animate-scale-up"
                >
                  <p className="text-xs font-semibold mb-1 text-slate-900">
                    هل أنت متأكد من حذف {selectedThreadIds.length} محادثة؟
                  </p>
                  <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
                    سيتم إخفاء هذه المحادثات من بريدك بشكل نهائي.
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsDeleteConfirmOpen(false)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      disabled={bulkLoading}
                      onClick={handleBulkDelete}
                      className="px-3 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {bulkLoading ? <Loader2 size={12} className="animate-spin" /> : null}
                      تأكيد الحذف
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-[1px] h-4 bg-white/30 mx-1" />

            {/* Deselect button */}
            <button
              type="button"
              onClick={() => {
                setSelectedThreadIds([]);
                setIsDeleteConfirmOpen(false);
              }}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="إلغاء التحديد"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      ) : (
        /* ── Standard Panel Header ── */
        <div className="px-4 py-3 border-b border-slate-100 bg-white flex flex-col gap-3 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              {/* Select All master checkbox */}
              {filteredMessages.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="p-1 -mr-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="تحديد الكل"
                >
                  <Square size={15} />
                </button>
              )}
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-indigo-500 to-violet-600" />
              <span className="text-xs font-bold text-slate-800 tracking-wide">
                {activeFolder === "inbox" && "العلبة الواردة"}
                {activeFolder === "sent" && "الرسائل المرسلة"}
                {activeFolder === "archived" && "المحادثات المؤرشفة"}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-bold bg-slate-50 border border-slate-200 shadow-sm px-2 py-0.5 rounded-full">
              {filteredMessages.length}
            </span>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2 w-full">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-1.5 px-2 pr-6 bg-slate-50/50 border border-slate-200/80 rounded-lg focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all cursor-pointer text-slate-600"
              dir="rtl"
            >
              <option value="all">الكل</option>
              <option value="unread">غير مقروءة</option>
              <option value="read">مقروءة</option>
              <option value="starred">المميزة بنجمة</option>
            </select>

            {/* Search Input */}
            <div className="relative flex items-center flex-1">
              <input
                type="text"
                dir="rtl"
                placeholder="البحث في الرسائل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-right placeholder:text-right pr-4 pl-9 py-2 bg-slate-50/50 border border-slate-200/80 rounded-lg text-xs focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors flex items-center justify-center cursor-pointer"
                  title="مسح البحث"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Scrollable list ── */}
      <div className="flex-1 overflow-y-auto">
        {loading && messages.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center gap-3 text-slate-400">
            <svg className="animate-spin h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs font-medium">جارٍ التحميل...</span>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center gap-2 text-slate-400 text-center">
            <svg className="w-10 h-10 text-slate-200 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m13-4l-5 5-5-5" />
            </svg>
            <p className="text-xs font-medium">
              {searchQuery ? "لا توجد نتائج تطابق بحثك" : "لا توجد محادثات."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/80">
            {filteredMessages.map((msg) => {
              const isSelected    = selectedMessage?.threadId === msg.threadId;
              const isItemChecked = selectedThreadIds.includes(msg.threadId);
              const showUnreadDot = msg.aDesMessagesNonLus;
              const isGroup       = msg.estGroupe;

              return (
                <div
                  key={msg.threadId}
                  onClick={() => handleSelectMessage(msg)}
                  className={`
                    group relative flex items-start gap-3 py-3.5 px-4 cursor-pointer
                    transition-all duration-200 border-b border-slate-100/80 last:border-0 select-none
                    ${isItemChecked
                      ? "bg-indigo-50/80 border-r-[3px] border-r-indigo-600 shadow-xs"
                      : isSelected
                      ? "bg-indigo-50/40 border-r-[3px] border-r-indigo-500 shadow-inner"
                      : "hover:bg-slate-50/80 border-r-[3px] border-r-transparent"
                    }
                  `}
                >
                  {/* Glowing unread dot */}
                  {showUnreadDot && (
                    <span className="absolute top-4 left-2.5 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] flex-shrink-0" />
                  )}

                  {/* Row Checkbox */}
                  <div
                    onClick={(e) => handleToggleSelect(e, msg.threadId)}
                    className="flex items-center justify-center p-1 rounded-md text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer mt-1 flex-shrink-0"
                    title={isItemChecked ? "إلغاء التحديد" : "تحديد"}
                  >
                    {isItemChecked ? (
                      <CheckSquare size={16} className="text-indigo-600" />
                    ) : (
                      <Square size={16} className="text-slate-300 group-hover:text-slate-400" />
                    )}
                  </div>

                  {/* Avatar / Group icon */}
                  <div
                    className={`
                      w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center
                      text-xs font-bold uppercase mt-0.5 shadow-sm
                      ${isGroup
                        ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white border border-violet-300/40"
                        : isItemChecked || isSelected
                        ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white border border-indigo-300/40"
                        : "bg-slate-100 text-slate-700 border border-slate-200/60"
                      }
                    `}
                  >
                    {isGroup ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : (
                      msg.dernierExpediteurNom?.charAt(0) ?? "?"
                    )}
                  </div>

                  {/* Preview content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {isGroup && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 border border-violet-200/80 flex-shrink-0">
                            مجموعة
                          </span>
                        )}
                        <h4 className={`text-sm truncate ${showUnreadDot ? "font-bold text-slate-900" : isSelected ? "font-bold text-indigo-900" : "font-semibold text-slate-800"}`}>
                          {isGroup
                            ? msg.titreGroupe || "محادثة جماعية"
                            : msg.dernierExpediteurNom}
                        </h4>
                      </div>
                      {/* Date, Actions Swap, and Persistent Star */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Swap Container */}
                        <div className="flex items-center justify-end min-w-[55px] h-6">
                          {/* Date (Default State) */}
                          <span className={`block group-hover:hidden text-[10px] font-mono whitespace-nowrap ${showUnreadDot ? "font-bold text-indigo-600" : "font-medium text-slate-400"}`}>
                            {new Date(msg.derniereActivite).toLocaleDateString("ar-MA", {
                              month: "short",
                              day:   "numeric",
                            })}
                          </span>

                          {/* Quick Actions (Hovered State) */}
                          <div className="hidden group-hover:flex items-center gap-1">
                            <button onClick={(e) => handleArchive(e, msg.threadId)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors" title="أرشفة">
                              <Archive size={14} />
                            </button>
                            <button onClick={(e) => handleDelete(e, msg.threadId)} className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="حذف">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Persistent Star Icon */}
                        <button 
                          onClick={(e) => handleStar(e, msg.threadId, getIsStarred(msg))}
                          className={`p-1 flex items-center justify-center rounded-md transition-colors ${getIsStarred(msg) ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'}`}
                          title="تفضيل"
                        >
                          <Star size={16} className={getIsStarred(msg) ? 'fill-amber-400 text-amber-400' : ''} />
                        </button>
                      </div>
                    </div>

                    {isGroup && msg.nombreParticipants > 0 && (
                      <p className="text-[10px] font-semibold text-violet-600 mb-1">
                        {msg.nombreParticipants} مشارك
                      </p>
                    )}

                    <p className={`text-xs truncate mb-1 ${showUnreadDot ? "font-bold text-slate-800" : "font-medium text-slate-600"}`}>
                      {msg.objet}
                    </p>

                    <div className="flex items-center justify-between gap-3 mt-1.5">
                      <p className="text-[11px] text-slate-400 truncate leading-relaxed flex-1">
                        {msg.dernierMessageCorps
                          ? msg.dernierMessageCorps.replace(/<[^>]*>?/gm, "")
                          : ""}
                      </p>
                      
                      {/* Status Badges */}
                      {msg.statutAcheminement && msg.statutAcheminement !== 'N/A' && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border flex-shrink-0 ${
                          msg.statutAcheminement === 'En cours' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200/80' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${msg.statutAcheminement === 'En cours' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          {msg.statutAcheminement === 'En cours' ? 'En cours' : 'Traité'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Old Per-row Delete button removed (now in quick actions toolbar) */}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
