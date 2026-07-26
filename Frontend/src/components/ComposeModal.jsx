import React, { useState } from "react";
import { useMail } from "../context/MailContext";
import { useAuth } from "../context/AuthContext";
import TiptapEditor from "./TiptapEditor";

// ── Role → Arabic label helper ───────────────────────────────────────────
const getRoleArabicLabel = (role) => {
  if (!role) return '';
  const lower = role.toString().toLowerCase();
  if (lower === 'fonctionnaire') return 'موظف';
  if (lower === 'association')   return 'جمعية';
  if (lower === 'admin' || lower === 'administrateur') return 'مدير النظام';
  return role;
};

export default function ComposeModal({ onClose }) {
  const { user } = useAuth();
  const { contacts, sendNewMessage } = useMail();

  /* ── الوضع: "individuel" | "diffusion" | "groupe" ── */
  const [messageMode, setMessageMode] = useState("individuel");

  /* ── الحالة المشتركة ── */
  const [subject,      setSubject]      = useState("");
  const [body,         setBody]         = useState("");
  const [attachments,  setAttachments]  = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSending,    setIsSending]    = useState(false);

  /* ── فردي ── */
  const [receiverId, setReceiverId] = useState("");

  /* ── بث + مجموعة ── */
  const [groupName,      setGroupName]      = useState("");
  const [selectedIds,    setSelectedIds]    = useState([]);
  const [contactSearch,  setContactSearch]  = useState("");

  const filteredContacts = contacts.filter((c) =>
    `${c.nomComplet} ${c.email} ${c.entrepriseNom}`
      .toLowerCase()
      .includes(contactSearch.toLowerCase())
  );

  const toggleContact = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /* ── تحديد الكل / إلغاء تحديد الكل ── */
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

  /* ── تبديل الوضع: إعادة ضبط حالة التحديد ── */
  const switchMode = (mode) => {
    setMessageMode(mode);
    setErrorMessage("");
    setSelectedIds([]);
    setContactSearch("");
    setGroupName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    } else {
      // مجموعة
      if (selectedIds.length < 2) {
        setErrorMessage("يرجى تحديد مشاركَين على الأقل لإنشاء مجموعة.");
        return;
      }
      if (!groupName.trim()) {
        setErrorMessage("يرجى إدخال اسم للمجموعة.");
        return;
      }
      if (!subject.trim() || !body.trim()) {
        setErrorMessage("يرجى ملء جميع الحقول المطلوبة.");
        return;
      }
    }

    setIsSending(true);
    try {
      await sendNewMessage({
        subject: subject.trim(),
        body: body.trim(),
        receiverId: messageMode === "individuel" ? receiverId : undefined,
        receiverIds:
          messageMode === "individuel" ? [receiverId] : selectedIds,
        titreGroupe: messageMode === "groupe" ? groupName.trim() : undefined,
        estDiffusion: messageMode === "diffusion",
        attachments,
      });
      onClose();
    } catch (err) {
      setErrorMessage(err.message || "حدث خطأ أثناء إرسال الرسالة.");
    } finally {
      setIsSending(false);
    }
  };

  /* ── نمط علامات التبويب ── */
  const modeTabClass = (mode) =>
    `flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition-all duration-150 rounded-lg cursor-pointer ${
      messageMode === mode
        ? "bg-white text-blue-700 shadow-sm border border-blue-200/80"
        : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
    }`;

  /* ── أيقونة العنوان حسب الوضع ── */
  const headerIcon =
    messageMode === "groupe" ? (
      <svg className="w-4 h-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ) : messageMode === "diffusion" ? (
      <svg className="w-4 h-4 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );

  const headerTitle =
    messageMode === "groupe"
      ? "إنشاء مجموعة نقاش"
      : messageMode === "diffusion"
      ? "إرسال متعدد — بث جماعي"
      : "رسالة داخلية جديدة";

  /* ── لوحة التحديد المتعدد (مشتركة بين البث والمجموعة) ── */
  const MultiSelectPanel = ({ requireMin, label }) => (
    <>
      {/* صف التسمية + شارة العداد */}
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">
          {label}
          {requireMin && (
            <span className="normal-case font-normal text-slate-400 mr-1">(الحد الأدنى: {requireMin})</span>
          )}
        </label>
        {selectedIds.length > 0 && (
          <span className="text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200/80 px-2.5 py-0.5 rounded-full">
            {selectedIds.length} جهة اتصال محددة
          </span>
        )}
      </div>

      {/* أزرار تحديد الكل / إلغاء التحديد */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={selectAll}
          disabled={isSending || allFilteredSelected}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg active:scale-95 transition-all duration-150 shadow-sm cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          تحديد الكل
        </button>
        <button
          type="button"
          onClick={deselectAll}
          disabled={isSending || selectedIds.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg active:scale-95 transition-all duration-150 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          إلغاء التحديد
        </button>
      </div>

      {/* شريط البحث */}
      <div className="relative mb-2">
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="البحث عن جهة اتصال..."
          value={contactSearch}
          onChange={(e) => setContactSearch(e.target.value)}
          className="w-full pr-8 pl-4 py-2 border border-slate-200/80 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-150"
          disabled={isSending}
        />
      </div>

      {/* الوسوم المحددة */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedIds.map((id) => {
            const c = contacts.find((x) => x.id === id);
            return c ? (
              <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-600 text-white text-xs font-medium rounded-full shadow-sm">
                {c.nomComplet}
                <button
                  type="button"
                  onClick={() => toggleContact(id)}
                  className="hover:text-violet-200 active:scale-90 transition-all duration-100 mr-0.5 cursor-pointer"
                >✕</button>
              </span>
            ) : null;
          })}
        </div>
      )}

      {/* قائمة جهات الاتصال */}
      <div className="border border-slate-200/80 rounded-xl overflow-hidden max-h-44 overflow-y-auto bg-white/90">
        {filteredContacts.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">لا توجد جهات اتصال.</div>
        ) : (
          filteredContacts.map((contact) => {
            const isSelected = selectedIds.includes(contact.id);
            return (
              <label
                key={contact.id}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all duration-150 select-none border-b border-slate-100/80 last:border-0 ${
                  isSelected ? "bg-violet-50/80" : "hover:bg-slate-50/80"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleContact(contact.id)}
                  className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                  disabled={isSending}
                />
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold uppercase flex-shrink-0 shadow-sm ${
                  isSelected ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-600"
                }`}>
                  {contact.nomComplet.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{contact.nomComplet}</p>
                  <p className="text-[10px] text-slate-400 truncate">{getRoleArabicLabel(contact.role)} — {contact.entrepriseNom}</p>
                </div>
              </label>
            );
          })
        )}
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden m-4 max-h-[92vh] flex flex-col">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              {headerIcon}
            </div>
            <h3 className="font-bold tracking-wide text-sm">{headerTitle}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSending}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white active:scale-95 transition-all duration-150 outline-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* ── Mode tabs ── */}
        <div className="px-6 pt-4 pb-2 flex-shrink-0">
          <div className="flex bg-slate-100/80 rounded-xl p-1 gap-1">
            <button type="button" className={modeTabClass("individuel")} onClick={() => switchMode("individuel")} disabled={isSending}>
              ✉️ رسالة فردية
            </button>
            <button type="button" className={modeTabClass("diffusion")} onClick={() => switchMode("diffusion")} disabled={isSending}>
              📣 إرسال متعدد
            </button>
            <button type="button" className={modeTabClass("groupe")} onClick={() => switchMode("groupe")} disabled={isSending}>
              👥 إنشاء مجموعة
            </button>
          </div>
        </div>

        {/* ── Diffusion info banner ── */}
        {messageMode === "diffusion" && (
          <div className="mx-6 mb-1 px-4 py-2.5 bg-violet-50/80 border border-violet-200/80 rounded-xl flex items-start gap-2.5">
            <svg className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[11px] text-violet-700 leading-snug">
              <strong>الإرسال الجماعي:</strong> يتلقى كل مستلم رسالة فردية مستقلة — لا يرى المستلمون بعضهم البعض.
            </p>
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4 overflow-y-auto flex-1" dir="rtl">

          {errorMessage && (
            <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errorMessage}
            </div>
          )}

          {/* ── وضع الرسالة الفردية ── */}
          {messageMode === "individuel" && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 tracking-wider">
                المرسل إليه *
              </label>
              <select
                required
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200/80 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-150 cursor-pointer"
                disabled={isSending}
              >
                <option value="">اختر جهة اتصال...</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.nomComplet} ({getRoleArabicLabel(contact.role)} — {contact.entrepriseNom})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ── وضع البث ── */}
          {messageMode === "diffusion" && (
            <div>
              <MultiSelectPanel
                requireMin={null}
                label="المستلمون *"
              />
            </div>
          )}

          {/* ── وضع المجموعة ── */}
          {messageMode === "groupe" && (
            <>
              {/* اسم المجموعة */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 tracking-wider">
                  اسم المجموعة *
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="مثال: فريق الموارد البشرية، مشروع الشراكة..."
                  className="w-full px-4 py-2.5 border border-slate-200/80 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-150"
                  disabled={isSending}
                />
              </div>

              {/* تحديد جهات الاتصال */}
              <div>
                <MultiSelectPanel
                  requireMin={2}
                  label="المشاركون *"
                />
              </div>
            </>
          )}

          {/* ── الموضوع ── */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 tracking-wider">
              الموضوع *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="مثال: متابعة ملف الشراكة / تصحيح صلاحيات الوصول"
              className="w-full px-4 py-2.5 border border-slate-200/80 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-150"
              disabled={isSending}
            />
          </div>

          {/* ── الرسالة ── */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 tracking-wider">
              الرسالة *
            </label>
            <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all duration-150">
              <TiptapEditor
                content={body}
                onChange={setBody}
                placeholder="اكتب رسالتك المهنية هنا..."
                attachments={attachments}
                onAttachmentsChange={setAttachments}
              />
            </div>
          </div>

          {/* ── Footer actions ── */}
          <div className="flex items-center justify-start pt-4 border-t border-slate-100/80 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl active:scale-95 transition-all duration-150 cursor-pointer"
              disabled={isSending}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md active:scale-95 transition-all duration-150 flex items-center gap-2 cursor-pointer disabled:opacity-60 ${
                messageMode === "diffusion"
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-violet-500/25"
                  : "bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 shadow-slate-900/20"
              }`}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  جارٍ الإرسال...
                </>
              ) : messageMode === "groupe" ? (
                "إنشاء المجموعة"
              ) : messageMode === "diffusion" ? (
                `📣 إرسال${selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}`
              ) : (
                "إرسال الرسالة"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
