import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMail } from '../context/MailContext';

// ─────────────────────────────────────────────────────────────────────────────
// Icon primitives
// ─────────────────────────────────────────────────────────────────────────────
const PenIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const TrashIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const AttachIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.586 6.586a6 6 0 108.486 8.486L20 13" />
  </svg>
);

const ClockIcon = ({ className = 'w-3 h-3' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserIcon = ({ className = 'w-3 h-3' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const FileIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PlusIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Delete Confirmation Modal
// ─────────────────────────────────────────────────────────────────────────────
function DeleteConfirmModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" dir="rtl">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm mx-4 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-900/20 border border-slate-200/60 overflow-hidden">
        {/* Top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-rose-400 to-rose-600" />

        <div className="p-7">
          {/* Icon */}
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
            <TrashIcon className="w-6 h-6" />
          </div>

          <h3 className="text-center text-lg font-bold text-slate-900 mb-1">حذف المسودة</h3>
          <p className="text-center text-sm text-slate-500 mb-7 leading-relaxed">
            سيتم حذف هذه المسودة نهائياً ولا يمكن استعادتها.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-150 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 rounded-xl shadow-md shadow-rose-500/25 transition-all duration-150 cursor-pointer"
            >
              حذف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast notification
// ─────────────────────────────────────────────────────────────────────────────
function DraftToast({ message, onClose }) {
  return (
    <div
      dir="rtl"
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-emerald-500/30 shadow-2xl shadow-emerald-900/20 bg-emerald-600/95 backdrop-blur-sm text-white text-sm font-semibold"
      style={{ animation: 'slideUpFade 0.3s ease-out' }}
    >
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span>{message}</span>
      <button onClick={onClose} className="mr-1 w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Recipient avatar pill
// ─────────────────────────────────────────────────────────────────────────────
function RecipientPill({ draft }) {
  const isMulti = draft.messageMode === 'diffusion';
  const name = draft.receiverName || draft.selectedNames?.[0] || null;
  const initials = name
    ? name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : null;

  if (isMulti) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-200/80 leading-none">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
        إرسال متعدد
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/80 leading-none">
      {initials ? (
        <span className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[8px] font-bold flex items-center justify-center flex-shrink-0">
          {initials}
        </span>
      ) : (
        <UserIcon className="w-3 h-3 flex-shrink-0 text-slate-400" />
      )}
      {name || 'بدون مستلم'}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single draft card — glassmorphism
// ─────────────────────────────────────────────────────────────────────────────
function DraftCard({ draft, onEdit, onDelete }) {
  const savedDate = new Date(draft.savedAt);
  const isMulti = draft.messageMode === 'diffusion';

  const bodyPreview = draft.body
    ? draft.body.replace(/<[^>]*>?/gm, '').trim().slice(0, 110)
    : '';

  const dateStr = savedDate.toLocaleDateString('ar-MA', { day: '2-digit', month: 'short' });
  const timeStr = savedDate.toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className="group relative rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.9)',
        boxShadow:
          '0 4px 6px -1px rgba(0,0,0,0.04), 0 10px 15px -3px rgba(0,0,0,0.06), 0 0 0 1px rgba(148,163,184,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
      }}
    >
      {/* Amber top accent bar */}
      <div
        className="absolute top-0 right-0 left-0 h-0.5 rounded-t-3xl"
        style={{ background: 'linear-gradient(to left, #f59e0b, #fbbf24, transparent)' }}
      />

      {/* Card body */}
      <div className="relative p-6">
        {/* ── Row 1: Icon + Recipient/Mode + Timestamp ── */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Draft icon avatar */}
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-amber-600 flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                border: '1px solid rgba(251,191,36,0.3)',
                boxShadow: '0 2px 8px rgba(251,191,36,0.2)',
              }}
            >
              <PenIcon className="w-4 h-4" />
            </div>

            <div className="flex flex-col gap-1.5 min-w-0">
              {/* Recipient pill */}
              <RecipientPill draft={draft} />

              {/* Metadata row: timestamp + type tag */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Timestamp pill */}
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-slate-500 leading-none"
                  style={{
                    background: 'rgba(241,245,249,0.9)',
                    border: '1px solid rgba(226,232,240,0.8)',
                  }}
                >
                  <ClockIcon />
                  {dateStr}&nbsp;•&nbsp;{timeStr}
                </span>

                {/* Message type pill */}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold leading-none ${
                    isMulti ? 'text-violet-700' : 'text-blue-700'
                  }`}
                  style={{
                    background: isMulti ? 'rgba(237,233,254,0.9)' : 'rgba(219,234,254,0.9)',
                    border: isMulti ? '1px solid rgba(196,181,253,0.5)' : '1px solid rgba(191,219,254,0.5)',
                  }}
                >
                  {isMulti ? 'إرسال متعدد' : 'رسالة فردية'}
                </span>
              </div>
            </div>
          </div>

          {/* Draft status badge */}
          <span
            className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-700 uppercase tracking-wide leading-none"
            style={{
              background: 'rgba(254,243,199,0.9)',
              border: '1px solid rgba(251,191,36,0.3)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            مسودة
          </span>
        </div>

        {/* ── Row 2: Subject line ── */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <FileIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">موضوع</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 truncate leading-snug pr-1">
            {draft.subject?.trim() || (
              <span className="font-medium italic text-slate-400">بدون موضوع</span>
            )}
          </h3>
        </div>

        {/* ── Row 3: Body preview ── */}
        {bodyPreview && (
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-4 pr-1">
            {bodyPreview}
            {bodyPreview.length >= 110 && (
              <span className="text-slate-400"> ...</span>
            )}
          </p>
        )}

        {/* ── Attachment notice ── */}
        {draft.attachmentNames?.length > 0 && (
          <div className="flex items-center gap-1.5 mb-4 text-[11px] text-slate-400 pr-1">
            <AttachIcon />
            <span>{draft.attachmentNames.length} مرفق (يحتاج إعادة إرفاق)</span>
          </div>
        )}

        {/* ── Divider ── */}
        <div
          className="my-4 h-px"
          style={{ background: 'linear-gradient(to left, transparent, rgba(226,232,240,0.8), transparent)' }}
        />

        {/* ── Integrated Action Toolbar ── */}
        <div className="flex items-center gap-3 justify-end">
          {/* Edit button */}
          <button
            id={`draft-edit-${draft.draftId}`}
            onClick={() => onEdit(draft)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
            style={{
              color: '#b45309',
              background: 'rgba(255,251,235,0.9)',
              border: '1px solid rgba(251,191,36,0.35)',
              boxShadow: '0 1px 3px rgba(251,191,36,0.12)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(254,243,199,1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(251,191,36,0.2)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,251,235,0.9)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(251,191,36,0.12)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            title="تحرير المسودة"
          >
            <PenIcon className="w-3.5 h-3.5" />
            تحرير
          </button>

          {/* Delete button */}
          <button
            id={`draft-delete-${draft.draftId}`}
            onClick={() => onDelete(draft.draftId)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
            style={{
              color: '#be123c',
              background: 'rgba(255,241,242,0.9)',
              border: '1px solid rgba(254,205,211,0.6)',
              boxShadow: '0 1px 3px rgba(244,63,94,0.08)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,228,230,1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(244,63,94,0.18)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,241,242,0.9)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(244,63,94,0.08)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            title="حذف المسودة"
          >
            <TrashIcon className="w-3.5 h-3.5" />
            حذف
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────
function EmptyDrafts({ onCompose }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 gap-5">
      {/* Layered icon rings */}
      <div className="relative">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(254,243,199,0.5)',
            border: '2px solid rgba(251,191,36,0.15)',
            boxShadow: '0 0 0 12px rgba(254,243,199,0.25)',
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              border: '1px solid rgba(251,191,36,0.25)',
            }}
          >
            <PenIcon className="w-7 h-7 text-amber-500" />
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-base font-bold text-slate-700 mb-1">لا توجد مسودات بعد</p>
        <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
          احفظ رسالة كمسودة وستظهر هنا. يمكنك استكمالها وإرسالها لاحقاً.
        </p>
      </div>

      <button
        onClick={onCompose}
        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all duration-200 cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
          boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(37,99,235,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.35)'; }}
      >
        <PlusIcon className="w-4 h-4" />
        رسالة جديدة
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main DraftsView component
// ─────────────────────────────────────────────────────────────────────────────
export default function DraftsView() {
  const navigate = useNavigate();
  const { drafts, deleteDraft } = useMail();

  const [draftToDelete, setDraftToDelete]       = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [toast, setToast]                         = useState(null);

  const handleEdit = (draft) => {
    navigate('/compose', { state: { draft } });
  };

  const handleConfirmDelete = (draftId) => {
    setDraftToDelete(draftId);
    setIsDeleteModalOpen(true);
  };

  const handleExecuteDelete = () => {
    if (draftToDelete) {
      deleteDraft(draftToDelete);
      setDraftToDelete(null);
      setIsDeleteModalOpen(false);
      setToast({ message: 'تم حذف المسودة بنجاح' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <>
      {/* ── Outer: full height, column layout, no overflow ── */}
      <div
        className="h-full flex flex-col overflow-hidden"
        dir="rtl"
        style={{ background: '#F8FAFC' }}
      >
        {/* ── Sticky frosted-glass header ── */}
        <div
          className="sticky top-0 z-10 flex-shrink-0 px-6 pt-8 pb-5"
          style={{
            background: 'rgba(248,250,252,0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(226,232,240,0.6)',
          }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
              {/* Amber pen icon badge */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-amber-600 flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,251,235,0.95), rgba(254,243,199,0.95))',
                  border: '1px solid rgba(251,191,36,0.25)',
                  boxShadow: '0 4px 12px rgba(251,191,36,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
                }}
              >
                <PenIcon className="w-5 h-5" />
              </div>

              <div>
                <h2
                  className="text-2xl font-black text-slate-900 leading-none mb-1.5"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  المسودات
                </h2>
                <p className="text-sm text-slate-400 font-medium">
                  {drafts.length === 0
                    ? 'لا توجد مسودات محفوظة'
                    : `${drafts.length} ${drafts.length === 1 ? 'مسودة محفوظة' : 'مسودات محفوظة'}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Scrollable cards area ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {/* Subtle decorative blobs — clipped by parent overflow-hidden */}
          <div
            className="absolute top-0 left-0 w-96 h-96 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(251,191,36,0.05) 0%, transparent 70%)',
              transform: 'translate(-40%, -30%)',
            }}
          />
          <div
            className="absolute bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(37,99,235,0.04) 0%, transparent 70%)',
              transform: 'translate(30%, 30%)',
            }}
          />

          <div className="relative max-w-3xl mx-auto px-6 pt-8 pb-24">
            {/* ── Draft cards or empty state ── */}
            {drafts.length === 0 ? (
              <EmptyDrafts onCompose={() => navigate('/compose')} />
            ) : (
              <div className="space-y-4">
                {drafts.map((draft) => (
                  <DraftCard
                    key={draft.draftId}
                    draft={draft}
                    onEdit={handleEdit}
                    onDelete={handleConfirmDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Floating Action Button (FAB) ── */}
        <button
          id="drafts-fab-new-message"
          onClick={() => navigate('/compose')}
          className="fixed bottom-8 left-8 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white transition-all duration-300 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)',
            boxShadow: '0 8px 25px rgba(37,99,235,0.45), 0 3px 10px rgba(37,99,235,0.3)',
            animation: 'fabPulse 3s ease-in-out infinite',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 14px 35px rgba(37,99,235,0.5), 0 5px 15px rgba(37,99,235,0.35)';
            e.currentTarget.style.animation = 'none';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(37,99,235,0.45), 0 3px 10px rgba(37,99,235,0.3)';
            e.currentTarget.style.animation = 'fabPulse 3s ease-in-out infinite';
          }}
          title="رسالة جديدة"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      </div>

      {/* ── Delete confirmation modal ── */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDraftToDelete(null); }}
        onConfirm={handleExecuteDelete}
      />

      {/* ── Toast ── */}
      {toast && <DraftToast message={toast.message} onClose={() => setToast(null)} />}

      {/* ── Keyframe styles ── */}
      <style>{`
        @keyframes fabPulse {
          0%, 100% { box-shadow: 0 8px 25px rgba(37,99,235,0.45), 0 3px 10px rgba(37,99,235,0.3), 0 0 0 0 rgba(37,99,235,0.4); }
          50% { box-shadow: 0 8px 25px rgba(37,99,235,0.45), 0 3px 10px rgba(37,99,235,0.3), 0 0 0 10px rgba(37,99,235,0); }
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}
