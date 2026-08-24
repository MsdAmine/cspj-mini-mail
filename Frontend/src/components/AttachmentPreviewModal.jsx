import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  FileSpreadsheet,
  FileArchive,
  File as FileIcon,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { renderAsync } from 'docx-preview';
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
    return { category: 'image', ext, isImage: true, isPdf: false, isDocx: false, isText: false };
  }

  if (mime === 'application/pdf' || ext === 'pdf') {
    return { category: 'pdf', ext, isImage: false, isPdf: true, isDocx: false, isText: false };
  }

  if (
    ['docx', 'doc'].includes(ext) ||
    mime.includes('word') ||
    mime.includes('officedocument.wordprocessingml')
  ) {
    return { category: 'word', ext, isImage: false, isPdf: false, isDocx: true, isText: false };
  }

  if (
    mime.startsWith('text/') ||
    ['txt', 'log', 'csv', 'json', 'xml'].includes(ext)
  ) {
    return { category: 'text', ext, isImage: false, isPdf: false, isDocx: false, isText: true };
  }

  if (['xls', 'xlsx'].includes(ext) || mime.includes('spreadsheet') || mime.includes('excel')) {
    return { category: 'excel', ext, isImage: false, isPdf: false, isDocx: false, isText: false };
  }

  if (['ppt', 'pptx'].includes(ext) || mime.includes('presentation') || mime.includes('powerpoint')) {
    return { category: 'powerpoint', ext, isImage: false, isPdf: false, isDocx: false, isText: false };
  }

  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mime.includes('zip') || mime.includes('compressed')) {
    return { category: 'archive', ext, isImage: false, isPdf: false, isDocx: false, isText: false };
  }

  return { category: 'other', ext, isImage: false, isPdf: false, isDocx: false, isText: false };
};

export default function AttachmentPreviewModal({ attachment, onClose, onDirectDownload }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [docBuffer, setDocBuffer] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Image manipulation state
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFitToScreen, setIsFitToScreen] = useState(true);

  const fileInfo = attachment ? getFileTypeInfo(attachment) : null;
  const overlayRef = useRef(null);
  const docxContainerRef = useRef(null);

  // ── 1. Fetch authenticated file blob ───────────────────────────────────────
  const loadAttachmentBlob = useCallback(async () => {
    if (!attachment?.id) return;

    setLoading(true);
    setError(null);
    setZoom(1);
    setRotation(0);
    setIsFitToScreen(true);
    setTextContent('');
    setDocBuffer(null);

    try {
      const response = await api.get(`/messages/attachments/download/${attachment.id}`, {
        responseType: 'blob',
      });

      const blob = response.data;
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);

      // If Word document, extract arrayBuffer for docx-preview
      if (fileInfo?.isDocx) {
        try {
          const buffer = await blob.arrayBuffer();
          setDocBuffer(buffer);
        } catch (err) {
          console.error('Failed to read arrayBuffer for DOCX:', err);
        }
      }

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
  }, [attachment?.id, fileInfo?.isDocx, fileInfo?.isText]);

  useEffect(() => {
    if (attachment) {
      loadAttachmentBlob();
    }

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      setDocBuffer(null);
    };
  }, [attachment?.id]);

  // ── 2. Render DOCX using docx-preview ──────────────────────────────────────
  useEffect(() => {
    if (fileInfo?.isDocx && docBuffer && docxContainerRef.current) {
      docxContainerRef.current.innerHTML = '';
      renderAsync(docBuffer, docxContainerRef.current, null, {
        className: 'docx-preview-content',
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        breakPages: true,
      }).catch((err) => {
        console.error('Error rendering DOCX file:', err);
        setError('تعذّر تحليل وتنسيق مستند Word للمعاينة. يمكنك تنزيل الملف الأصلي لفتحه.');
      });
    }
  }, [fileInfo?.isDocx, docBuffer]);

  // ── 3. Keyboard listeners (ESC to close, + / - to zoom) ───────────────────
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
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose, fileInfo?.isImage, loading, error]);

  if (!attachment) return null;

  // ── 4. Download Trigger ───────────────────────────────────────────────────
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
      case 'excel':
        return <FileSpreadsheet className="w-16 h-16 text-emerald-600" />;
      case 'powerpoint':
        return <FileText className="w-16 h-16 text-orange-600" />;
      case 'archive':
        return <FileArchive className="w-16 h-16 text-amber-600" />;
      default:
        return <FileIcon className="w-16 h-16 text-indigo-500" />;
    }
  };

  return (
    <div
      ref={overlayRef}
      dir="rtl"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in select-none"
    >
      {/* ── Main Modal Container (Glassmorphism & Light/Dark Theme matching app) ── */}
      <div className="relative w-full h-full max-w-6xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden">
        
        {/* ── Top Header Bar ── */}
        <header className="h-16 px-4 md:px-6 bg-white/95 border-b border-slate-100 flex items-center justify-between gap-4 text-slate-800 flex-shrink-0 z-10">
          {/* File details */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                fileInfo.isImage
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  : fileInfo.isPdf
                  ? 'bg-rose-50 text-rose-600 border-rose-100'
                  : fileInfo.isDocx
                  ? 'bg-blue-50 text-blue-600 border-blue-100'
                  : 'bg-indigo-50 text-indigo-600 border-indigo-100'
              }`}
            >
              {fileInfo.isImage ? (
                <ImageIcon className="w-5 h-5" />
              ) : fileInfo.isPdf ? (
                <FileText className="w-5 h-5" />
              ) : fileInfo.isDocx ? (
                <FileText className="w-5 h-5" />
              ) : (
                <FileIcon className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0">
              <h3
                className="text-sm font-bold text-slate-800 truncate max-w-xs md:max-w-md lg:max-w-lg"
                title={attachment.nomFichier}
              >
                {attachment.nomFichier}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                <span>{formatFileSize(attachment.tailleOctets)}</span>
                <span>•</span>
                <span className="uppercase text-slate-600 font-sans font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                  {fileInfo.ext || 'ملف'}
                </span>
                {fileInfo.isDocx && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 font-sans font-medium text-[10px]">
                      مستند Word قابل للمعاينة
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Center: Image / PDF controls */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100/80 border border-slate-200/80 rounded-xl p-1">
            {fileInfo.isImage && !loading && !error && (
              <>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer shadow-xs"
                  title="تكبير (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer shadow-xs"
                  title="تصغير (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer shadow-xs"
                  title="تدوير 90 درجة"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResetView}
                  className="px-2.5 h-8 rounded-lg flex items-center justify-center text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer shadow-xs"
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
                className="px-3 h-8 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer shadow-xs"
                title="فتح في تبويب مستقل"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>فتح بنافذة جديدة</span>
              </button>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow-indigo-500/20 active:scale-95 transition-all duration-150 cursor-pointer"
              title="تنزيل الملف"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">تنزيل</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/60"
              title="إغلاق (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ── Main Viewport Area ── */}
        <main
          onWheel={handleWheel}
          className="flex-1 min-h-0 relative flex items-center justify-center p-3 md:p-5 overflow-auto bg-slate-100/60"
        >
          {/* Loading Spinner */}
          {loading && (
            <div className="flex flex-col items-center gap-3 text-slate-600">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
              <p className="text-sm font-semibold">جاري تحميل المعاينة...</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-700 shadow-xl">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">تعذّر عرض المعاينة</h4>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">{error}</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={loadAttachmentBlob}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  إعادة المحاولة
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  تنزيل الملف مباشرة
                </button>
              </div>
            </div>
          )}

          {/* ── DOCX Viewport (docx-preview rendering) ── */}
          {!loading && !error && fileInfo.isDocx && (
            <div className="w-full h-full overflow-auto flex justify-center p-2">
              <div
                ref={docxContainerRef}
                dir="auto"
                className="docx-viewport w-full max-w-4xl bg-white p-4 md:p-8 rounded-xl shadow-md border border-slate-200/80 overflow-auto"
                style={{ minHeight: '100%' }}
              />
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
                  className={`max-w-full max-h-[calc(92vh-150px)] object-contain rounded-xl shadow-xl transition-all duration-200 select-none border border-slate-200/60 bg-white ${
                    isFitToScreen ? 'h-auto w-auto' : ''
                  }`}
                  draggable={false}
                />
              </div>
            </div>
          )}

          {/* ── PDF Viewport ── */}
          {!loading && !error && fileInfo.isPdf && blobUrl && (
            <div className="w-full h-full max-w-5xl rounded-xl overflow-hidden shadow-md border border-slate-200/80 bg-white flex flex-col">
              <iframe
                src={`${blobUrl}#toolbar=1&navpanes=0`}
                title={attachment.nomFichier}
                className="w-full h-full border-0 bg-white"
              />
            </div>
          )}

          {/* ── Plain Text Viewport ── */}
          {!loading && !error && fileInfo.isText && (
            <div className="w-full max-w-4xl max-h-[calc(92vh-150px)] bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden flex flex-col">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="font-mono">{attachment.nomFichier}</span>
                <span>{textContent.length} حرف</span>
              </div>
              <pre
                dir="ltr"
                className="p-5 overflow-auto text-xs font-mono text-slate-800 leading-relaxed max-h-[calc(92vh-210px)] whitespace-pre-wrap selection:bg-indigo-500/20 bg-slate-50/30"
              >
                {textContent || 'الملف فارغ أو يتعذر استخراج النص.'}
              </pre>
            </div>
          )}

          {/* ── Fallback Viewport for Unsupported Files (Excel, PowerPoint, ZIP, etc.) ── */}
          {!loading && !error && !fileInfo.isImage && !fileInfo.isPdf && !fileInfo.isDocx && !fileInfo.isText && (
            <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-700 shadow-xl">
              <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4 shadow-xs">
                {renderFallbackIcon()}
              </div>

              <h4
                className="text-base font-bold text-slate-800 mb-1 truncate px-2"
                title={attachment.nomFichier}
              >
                {attachment.nomFichier}
              </h4>

              <p className="text-xs text-slate-400 font-mono mb-4">
                {formatFileSize(attachment.tailleOctets)} •{' '}
                <span className="uppercase text-slate-600 font-semibold">{fileInfo.ext}</span>
              </p>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-600 mb-6 leading-relaxed">
                لا تدعم المتصفحات المعاينة المباشرة لهذا النوع من الملفات داخل النافذة. يمكنك تنزيل
                الملف بأمان إلى جهازك لفتحه في التطبيق المخصص.
              </div>

              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow-indigo-500/20 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>تنزيل الملف ({formatFileSize(attachment.tailleOctets)})</span>
              </button>
            </div>
          )}
        </main>

        {/* ── Footer Keyboard Hints ── */}
        <footer className="h-9 px-5 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 select-none flex-shrink-0">
          <div className="flex items-center gap-3">
            {fileInfo.isImage && !loading && !error && (
              <>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-600 font-mono">
                    +
                  </kbd>{' '}
                  /{' '}
                  <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-600 font-mono">
                    -
                  </kbd>{' '}
                  للتكبير والتصغير
                </span>
                <span>•</span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-600 font-mono">
                    0
                  </kbd>{' '}
                  إعادة ضبط
                </span>
              </>
            )}
            {fileInfo.isDocx && !loading && !error && (
              <span className="text-slate-500 font-medium">معاينة Word نشطة عبر محرك docx-preview</span>
            )}
          </div>
          <div>
            <span>
              اضغط{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-600 font-mono">
                Esc
              </kbd>{' '}
              للإغلاق
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
