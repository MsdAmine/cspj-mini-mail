import React, { useState, useEffect } from 'react';
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  Search,
  Calendar,
  Building2,
  Paperclip,
  Mail,
  MailOpen,
  Check,
  Filter
} from 'lucide-react';
import { useMail } from '../context/MailContext';
import api from '../services/api';

export default function SearchFilterDrawer({ isOpen, onClose }) {
  const {
    searchQuery,
    setSearchQuery,
    advancedFilters,
    setAdvancedFilters,
    clearAdvancedFilters,
    hasActiveAdvancedFilters
  } = useMail();

  // Local draft state for the form inside drawer
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [localStartDate, setLocalStartDate] = useState(advancedFilters.startDate || '');
  const [localEndDate, setLocalEndDate] = useState(advancedFilters.endDate || '');
  const [localInstitutionId, setLocalInstitutionId] = useState(advancedFilters.institutionId || '');
  const [localHasAttachment, setLocalHasAttachment] = useState(advancedFilters.hasAttachment);
  const [localIsRead, setLocalIsRead] = useState(advancedFilters.isRead);

  const [institutions, setInstitutions] = useState([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);

  // Sync with context when drawer opens
  useEffect(() => {
    if (isOpen) {
      setLocalQuery(searchQuery);
      setLocalStartDate(advancedFilters.startDate || '');
      setLocalEndDate(advancedFilters.endDate || '');
      setLocalInstitutionId(advancedFilters.institutionId || '');
      setLocalHasAttachment(advancedFilters.hasAttachment);
      setLocalIsRead(advancedFilters.isRead);
    }
  }, [isOpen, searchQuery, advancedFilters]);

  // Load institutions list
  useEffect(() => {
    if (isOpen && institutions.length === 0) {
      setLoadingInstitutions(true);
      api
        .get('/messages/institutions')
        .then((res) => {
          setInstitutions(res.data || []);
        })
        .catch((err) => {
          console.error('Failed to load institutions for filter:', err);
        })
        .finally(() => {
          setLoadingInstitutions(false);
        });
    }
  }, [isOpen, institutions.length]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApply = (e) => {
    e.preventDefault();
    setSearchQuery(localQuery.trim());
    setAdvancedFilters({
      startDate: localStartDate,
      endDate: localEndDate,
      institutionId: localInstitutionId,
      hasAttachment: localHasAttachment,
      isRead: localIsRead
    });
    onClose();
  };

  const handleReset = () => {
    setLocalQuery('');
    setLocalStartDate('');
    setLocalEndDate('');
    setLocalInstitutionId('');
    setLocalHasAttachment(null);
    setLocalIsRead(null);
    setSearchQuery('');
    clearAdvancedFilters();
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 overflow-hidden flex justify-start bg-slate-900/50 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* ── Slide-Over Panel ── */}
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-hidden animate-slide-left">
        
        {/* ── Drawer Header ── */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">بحث وتصفية متقدمة</h3>
              <p className="text-[11px] text-slate-400">تخصيص معايير البحث في المحادثات</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Drawer Form Body ── */}
        <form onSubmit={handleApply} className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* 1. Keyword Query */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-indigo-500" />
              <span>الكلمة المفتاحية أو العبارة</span>
            </label>
            <input
              type="text"
              dir="rtl"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="ابحث في الموضوع، النص، أو اسم المرسل..."
              className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 text-slate-700"
            />
          </div>

          {/* 2. Date Range */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>النطاق الزمني (تاريخ الإنشاء)</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <span className="block text-[10px] text-slate-400 mb-1">من تاريخ:</span>
                <input
                  type="date"
                  value={localStartDate}
                  onChange={(e) => setLocalStartDate(e.target.value)}
                  className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 mb-1">إلى تاريخ:</span>
                <input
                  type="date"
                  value={localEndDate}
                  onChange={(e) => setLocalEndDate(e.target.value)}
                  className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                />
              </div>
            </div>
          </div>

          {/* 3. Institution */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>المؤسسة أو الهيئة القضائية</span>
            </label>
            <select
              value={localInstitutionId}
              onChange={(e) => setLocalInstitutionId(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-700 cursor-pointer"
            >
              <option value="">جميع المؤسسات والهيئات</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.nom} {inst.estAssociation ? '(جمعية)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Has Attachments Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
              <span>المرفقات</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setLocalHasAttachment(null)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  localHasAttachment === null
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => setLocalHasAttachment(true)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  localHasAttachment === true
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Paperclip className="w-3 h-3" />
                <span>تحتوي</span>
              </button>
              <button
                type="button"
                onClick={() => setLocalHasAttachment(false)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  localHasAttachment === false
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                بدون
              </button>
            </div>
          </div>

          {/* 5. Read Status Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-500" />
              <span>حالة القراءة</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setLocalIsRead(null)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  localIsRead === null
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => setLocalIsRead(false)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  localIsRead === false
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail className="w-3 h-3" />
                <span>غير مقروءة</span>
              </button>
              <button
                type="button"
                onClick={() => setLocalIsRead(true)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  localIsRead === true
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MailOpen className="w-3 h-3" />
                <span>مقروءة</span>
              </button>
            </div>
          </div>
        </form>

        {/* ── Drawer Footer Actions ── */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-indigo-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>تطبيق الفلاتر</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="py-2.5 px-3.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="إعادة ضبط جميع المعايير"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>إعادة ضبط</span>
          </button>
        </div>
      </div>
    </div>
  );
}
