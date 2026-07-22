import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function ManageLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionType, setSelectedActionType] = useState('ALL');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get('/admin/audit-logs');
        setLogs(response.data || []);
      } catch (err) {
        console.error("Erreur lors de la récupération des logs d'audit :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);


  // Filter logs based on search and action type
  const filteredLogs = logs.filter(log => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = !query || 
      log.utilisateur?.toLowerCase().includes(query) ||
      log.description?.toLowerCase().includes(query) ||
      log.typeAction?.toLowerCase().includes(query);

    const matchesAction = selectedActionType === 'ALL' || log.typeAction === selectedActionType;

    return matchesQuery && matchesAction;
  });

  // Get unique action types for filter dropdown
  const actionTypes = ['ALL', ...new Set(logs.map(log => log.typeAction))];

  const formatTimestamp = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ar-MA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getActionBadgeColor = (actionType) => {
    switch (actionType) {
      case 'SEND_MESSAGE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'TOGGLE_USER_STATUS':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'UPLOAD_ATTACHMENT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-250';
      case 'DELETE_USER':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'ARCHIVE_DISCUSSION':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="w-full max-w-6xl space-y-6 animate-fade-in pb-12">
      {/* Title & Description */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-xl font-bold text-slate-900">سجل التدقيق والأمان</h2>
        <p className="text-slate-500 text-xs mt-1">
          سجل زمني لأحداث الأمان وإجراءات الإدارة (دون محتوى الرسائل).
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="البحث بالبريد أو الإجراء أو الوصف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-250 rounded-lg text-sm focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition duration-150"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="w-full md:w-60">
          <select
            value={selectedActionType}
            onChange={(e) => setSelectedActionType(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition duration-150 cursor-pointer"
          >
            {actionTypes.map(type => (
              <option key={type} value={type}>
                {type === 'ALL' ? 'جميع الإجراءات' : type}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filter Button */}
        {(searchQuery || selectedActionType !== 'ALL') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedActionType('ALL');
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer flex items-center justify-center"
          >
            إعادة ضبط
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-16 text-center">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="font-semibold text-slate-800 text-sm">لا توجد سجلات</h3>
            <p className="text-slate-400 text-xs mt-1">
              ضبّط فلاتير البحث أو أعد تعيين الحقل.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 uppercase font-bold tracking-wider">
                  <th className="px-6 py-4 w-44">التاريخ / الوقت</th>
                  <th className="px-6 py-4 w-48">نوع الإجراء</th>
                  <th className="px-6 py-4 w-52">المستخدم</th>
                  <th className="px-6 py-4">الوصف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition duration-150">
                    {/* Timestamp */}
                    <td className="px-6 py-4 font-mono font-medium text-slate-500 whitespace-nowrap">
                      {formatTimestamp(log.dateHeure)}
                    </td>

                    {/* Action Type Badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider font-mono ${getActionBadgeColor(log.typeAction)}`}>
                        {log.typeAction}
                      </span>
                    </td>

                    {/* User Email */}
                    <td className="px-6 py-4 font-medium text-slate-700 whitespace-nowrap">
                      {log.utilisateur}
                    </td>

                    {/* Description */}
                    <td className="px-6 py-4 text-slate-600 font-normal leading-relaxed">
                      {log.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
