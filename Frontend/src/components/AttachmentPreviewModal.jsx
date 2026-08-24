import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  FileText,
  FileSpreadsheet,
  FileArchive,
  File as FileIcon,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';

/**
 * Formats bytes to readable Ko / Mo string
 */
const formatFileSize = (bytes) => {
  if (!bytes || bytes <= 0) return '0 Ko';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  }
  return `${(bytes / 1024).toFixed(1)} Ko`;
};

/**
 * Determines file category from contentType and filename extension
 */
const getFileTypeInfo = (file) => {
  const name = file?.nomFichier || '';
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const mime = file?.typeContenu?.toLowerCase() || '';

  if (
    mime.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'].includes(ext)
  ) {
    return { category: 'image', ext, isImage: true, isPdf: false, isText: false };
  }

  if (mime === 'application/pdf' || ext === 'pdf') {
    return { category: 'pdf', ext, isImage: false, isPdf: true, isText: false };
  }

  if (
    mime.startsWith('text/') ||
    ['txt', 'log', 'csv', 'json', 'xml'].includes(ext)
  ) {
    return { category: 'text', ext, isImage: false, isPdf: false, isText: true };
  }

  if (['doc', 'docx', 'rtf', 'odt'].includes(ext) || mime.includes('word')) {
    return { category: 'word', ext, isImage: false, isPdf: false, isText: false };
  }

  if (['xls', 'xlsx', 'csv'].includes(ext) || mime.includes('spreadsheet') || mime.includes('excel')) {
    return { category: 'excel', ext, isImage: false, isPdf: false, isText: false };
  }

  if (['ppt', 'pptx'].includes(ext) || mime.includes('presentation') || mime.includes('powerpoint')) {
    return { category: 'powerpoint', ext, isImage: false, isPdf: false, isText: false };
  }

  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mime.includes('zip') || mime.includes('compressed')) {
    return { category: 'archive', ext, isImage: false, isPdf: false, isText: false };
  }

  return { category: 'other', ext, isImage: false, isPdf: false, isText: false };
};

export default function AttachmentPreviewModal({ attachment, onClose, onDirectDownload }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Image manipulation state
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFitToScreen, setIsFitToScreen] = useState(true);

  const fileInfo = attachment ? getFileTypeInfo(attachment) : null;
  const overlayRef = useRef(null);

  // ── 1. Fetch authenticated file blob ───────────────────────────────────────
  const loadAttachmentBlob = useCallback(async () => {
    if (!attachment?.id) return;

    setLoading(true);
    setError(null);
    setZoom(1);
    setRotation(0);
    setIsFitToScreen(true);
    setTextContent('');

    try {
      const response = await api.get(`/messages/attachments/download/${attachment.id}`, {
        responseType: 'blob',
      });

      const blob = response.data;
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);

      // If text file, read text for display
      if (fileInfo?.isText) {
        try {
          const text = await blob.text();
          setTextContent(text);
        } catch {
          // ignore text parse error
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to load attachment preview:', err);
      setError(
        err.response?.status === 403
          ? 'ليس لديك صلاحية الوصول إلى هذا المرفق.'
          : err.response?.status === 404
          ? 'المرفق المطلوب غير موجود على الخادم.'
          : 'تعذّر تحميل معاينة المرفق. يرجى المحاولة لاحقاً.'
      );
      setLoading(false);
    }
  }, [attachment?.id, fileInfo?.isText]);

  useEffect(() => {
    if (attachment) {
      loadAttachmentBlob();
    }

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
    };
  }, [attachment?.id]);

  // ── 2. Keyboard listeners (ESC to close, + / - to zoom) ───────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (fileInfo?.isImage && !loading && !error) {
        if (e.key === '+' || e.key === '=') {
          setZoom((prev) => Math.min(prev + 0.25, 4));
          setIsFitToScreen(false);
        } else if (e.key === '-') {
          setZoom((prev) => Math.max(prev - 0.25, 0.5));
          setIsFitToScreen(false);
        } else if (e.key === '0') {
          setZoom(1);
          setRotation(0);
          setIsFitToScreen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Lock background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose, fileInfo?.isImage, loading, error]);

  if (!attachment) return null;

  // ── 3. Download Trigger ───────────────────────────────────────────────────
  const handleDownload = async () => {
    if (onDirectDownload) {
      onDirectDownload(attachment);
      return;
    }

    if (blobUrl) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = attachment.nomFichier || 'attachment';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      try {
        const response = await api.get(`/messages/attachments/download/${attachment.id}`, {
          responseType: 'blob',
        });
        const url = URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.nomFichier || 'attachment';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        alert('تعذّر تنزيل الملف.');
      }
    }
  };

  const handleOpenInNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 4));
    setIsFitToScreen(false);
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
    setIsFitToScreen(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleResetView = () => {
    setZoom(1);
    setRotation(0);
    setIsFitToScreen(true);
  };

  const handleWheel = (e) => {
    if (!fileInfo?.isImage || loading || error) return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    }
  };

  // ── File Icon helper for fallback card ────────────────────────────────────
  const renderFallbackIcon = () => {
    switch (fileInfo.category) {
      case 'word':
        return <FileText className="w-16 h-16 text-blue-500" />;
      case 'excel':
        return <FileSpreadsheet className="w-16 h-16 text-emerald-500" />;
      case 'powerpoint':
        return <FileText className="w-16 h-16 text-orange-500" />;
      case 'archive':
        return <FileArchive className="w-16 h-16 text-amber-500" />;
      default:
        return <FileIcon className="w-16 h-16 text-slate-400" />;
    }
  };

  return (
    <div
      ref={overlayRef}
      dir="rtl"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-md animate-fade-in select-none"
    >
      {/* ── Top Bar ── */}
      <header className="h-16 px-4 md:px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4 text-white flex-shrink-0 z-10">
        {/* Left (in RTL = Right side): File Details */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-indigo-400 flex-shrink-0">
            {fileInfo.isImage ? (
              <ImageIcon className="w-5 h-5" />
            ) : fileInfo.isPdf ? (
              <FileText className="w-5 h-5 text-rose-400" />
            ) : (
              <FileIcon className="w-5 h-5 text-indigo-400" />
            )}
          </div>
          <div className="min-w-0">
            <h3
              className="text-sm font-semibold text-slate-100 truncate max-w-xs md:max-w-md lg:max-w-lg"
              title={attachment.nomFichier}
            >
              {attachment.nomFichier}
            </h3>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
              <span>{formatFileSize(attachment.tailleOctets)}</span>
              <span>•</span>
              <span className="uppercase text-slate-300 font-sans font-semibold bg-slate-800 px-1.5 py-0.2 rounded text-[10px]">
                {fileInfo.ext || 'ملف'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Image / PDF controls */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl p-1">
          {fileInfo.isImage && !loading && !error && (
            <>
              <button
                type="button"
                onClick={handleZoomIn}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors cursor-pointer"
                title="تكبير (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors cursor-pointer"
                title="تصغير (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors cursor-pointer"
                title="تدوير 90 درجة"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetView}
                className="px-2.5 h-8 rounded-lg flex items-center justify-center text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors cursor-pointer"
                title="إعادة تعيين الحجم (0)"
              >
                {Math.round(zoom * 100)}%
              </button>
            </>
          )}

          {fileInfo.isPdf && !loading && !error && blobUrl && (
            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="px-3 h-8 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors cursor-pointer"
              title="فتح في تبويب مستقل"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>فتح بنافذة جديدة</span>
            </button>
          )}
        </div>

        {/* Right (in RTL = Left side): Download & Close */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
            title="تنزيل الملف"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">تنزيل</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700/80"
            title="إغلاق (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Main Viewport Area ── */}
      <main
        onWheel={handleWheel}
        className="flex-1 min-h-0 relative flex items-center justify-center p-3 md:p-6 overflow-auto"
      >
        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center gap-3 text-slate-300">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
            <p className="text-sm font-medium">جاري تحميل المعاينة...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-center text-slate-200 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">تعذّر عرض المعاينة</h4>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">{error}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={loadAttachmentBlob}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                إعادة المحاولة
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-md shadow-indigo-600/30"
              >
                <Download className="w-3.5 h-3.5" />
                تنزيل الملف مباشرة
              </button>
            </div>
          </div>
        )}

        {/* ── Image Viewport ── */}
        {!loading && !error && fileInfo.isImage && blobUrl && (
          <div className="w-full h-full flex items-center justify-center overflow-hidden">
            <div
              className="relative transition-transform duration-200 ease-out flex items-center justify-center"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
            >
              <img
                src={blobUrl}
                alt={attachment.nomFichier}
                className={`max-w-full max-h-[calc(100vh-140px)] object-contain rounded-lg shadow-2xl transition-all duration-200 select-none ${
                  isFitToScreen ? 'h-auto w-auto' : ''
                }`}
                draggable={false}
              />
            </div>
          </div>
        )}

        {/* ── PDF Viewport ── */}
        {!loading && !error && fileInfo.isPdf && blobUrl && (
          <div className="w-full h-full max-w-6xl max-h-[calc(100vh-100px)] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 flex flex-col">
            <iframe
              src={`${blobUrl}#toolbar=1&navpanes=0`}
              title={attachment.nomFichier}
              className="w-full h-full border-0 bg-slate-900"
            />
          </div>
        )}

        {/* ── Plain Text Viewport ── */}
        {!loading && !error && fileInfo.isText && (
          <div className="w-full max-w-4xl max-h-[calc(100vh-140px)] bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono">{attachment.nomFichier}</span>
              <span>{textContent.length} حرف</span>
            </div>
            <pre
              dir="ltr"
              className="p-5 overflow-auto text-xs font-mono text-slate-200 leading-relaxed max-h-[calc(100vh-200px)] whitespace-pre-wrap selection:bg-indigo-500/30"
            >
              {textContent || 'الملف فارغ أو يتعذر استخراج النص.'}
            </pre>
          </div>
        )}

        {/* ── Fallback Viewport for Unsupported Files (Word, Excel, PowerPoint, ZIP, etc.) ── */}
        {!loading && !error && !fileInfo.isImage && !fileInfo.isPdf && !fileInfo.isText && (
          <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center text-slate-200 shadow-2xl animate-scale-up">
            <div className="w-24 h-24 rounded-3xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto mb-5 shadow-inner">
              {renderFallbackIcon()}
            </div>

            <h4
              className="text-lg font-bold text-white mb-1 truncate px-2"
              title={attachment.nomFichier}
            >
              {attachment.nomFichier}
            </h4>

            <p className="text-xs text-slate-400 font-mono mb-4">
              {formatFileSize(attachment.tailleOctets)} •{' '}
              <span className="uppercase text-slate-300 font-semibold">{fileInfo.ext}</span>
            </p>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3.5 text-xs text-slate-300 mb-6 leading-relaxed">
              لا تدعم المتصفحات المعاينة المباشرة لهذا النوع من الملفات داخل النافذة. يمكنك تنزيل
              الملف بأمان إلى جهازك لفتحه في التطبيق المخصص.
            </div>

            <button
              type="button"
              onClick={handleDownload}
              className="w-full py-3 px-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/25 active:scale-98 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تنزيل الملف ({formatFileSize(attachment.tailleOctets)})</span>
            </button>
          </div>
        )}
      </main>

      {/* ── Footer Keyboard Hints ── */}
      <footer className="h-8 px-4 bg-slate-900/60 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 select-none flex-shrink-0">
        <div className="flex items-center gap-3">
          {fileInfo.isImage && !loading && !error && (
            <>
              <span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 font-mono">
                  +
                </kbd>{' '}
                /{' '}
                <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 font-mono">
                  -
                </kbd>{' '}
                للتكبير والتصغير
              </span>
              <span>•</span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 font-mono">
                  0
                </kbd>{' '}
                إعادة ضبط
              </span>
            </>
          )}
        </div>
        <div>
          <span>
            اضغط{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 font-mono">
              Esc
            </kbd>{' '}
            للإغلاق
          </span>
        </div>
      </footer>
    </div>
  );
}
