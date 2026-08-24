import React, { useRef, useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import BulletList from '@tiptap/extension-bullet-list';
import { ListItem } from '@tiptap/extension-list-item';
import TextAlign from '@tiptap/extension-text-align';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Quote, Undo, Redo, Paperclip, X } from 'lucide-react';

/**
 * TiptapEditor
 *
 * Props:
 *  - content       {string}   - HTML content (controlled)
 *  - onChange      {fn}       - called with the new HTML string on every update
 *  - placeholder   {string}   - placeholder text shown when editor is empty
 *  - attachments   {File[]}   - list of currently selected files (controlled from parent)
 *  - onAttachmentsChange {fn} - called with the new File[] whenever files are added/removed
 */

// Defined at module scope so React always sees the same component reference.
// If defined inside TiptapEditor, every `onTransaction` re-render would create
// a new component type → React unmounts + remounts the buttons → sluggish lag.
const ToolbarButton = ({ onClick, isActive, icon: Icon, title, disabled = false }) => (
  <button
    type="button"
    disabled={disabled}
    onMouseDown={(e) => {
      // Use onMouseDown + preventDefault so the editor never loses focus,
      // which also makes the active state update feel completely instant.
      e.preventDefault();
      onClick();
    }}
    className={`p-1.5 rounded transition-colors ${
      isActive
        ? 'bg-blue-100 text-blue-700'
        : disabled
        ? 'text-slate-300 cursor-not-allowed'
        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
    }`}
    title={title}
  >
    <Icon size={16} />
  </button>
);

const TiptapEditor = ({
  content,
  onChange,
  placeholder = 'Écrivez votre réponse...',
  attachments = [],
  onAttachmentsChange,
}) => {
  // Force a re-render whenever Tiptap fires a transaction so isActive() stays in sync.
  const [, forceUpdate] = useState(0);
  const fileInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      // Tiptap v3: BulletList and ListItem are no longer bundled inside StarterKit
      // and must be registered explicitly. ListItem is required by BulletList.
      BulletList,
      ListItem,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    // Re-render the React component on every editor transaction so that
    // isActive() reflects mark/node changes immediately (fixes the empty-editor
    // active-state delay).
    onTransaction: () => {
      forceUpdate((n) => n + 1);
    },
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-sm max-w-none focus:outline-none min-h-[100px] px-4 py-3 text-right',
        dir: 'rtl',
      },
    },
  });

  // Wrap each formatting command so it always keeps focus inside the editor
  // AND immediately triggers a re-render so the active class shows at once.
  const runCommand = useCallback(
    (commandFn) => {
      if (!editor) return;
      commandFn();
      // Force a synchronous re-render after the command so isActive() is fresh.
      forceUpdate((n) => n + 1);
    },
    [editor]
  );

  // Paperclip button click → programmatically open the hidden file input.
  const handlePaperclipClick = useCallback((e) => {
    e.preventDefault();
    fileInputRef.current?.click();
  }, []);

  // Merge newly chosen files with the current list (avoid duplicates by name+size).
  const handleFileChange = useCallback(
    (e) => {
      const newFiles = Array.from(e.target.files);
      if (!newFiles.length) return;

      const merged = [...attachments];
      newFiles.forEach((file) => {
        const isDuplicate = merged.some(
          (f) => f.name === file.name && f.size === file.size
        );
        if (!isDuplicate) merged.push(file);
      });

      onAttachmentsChange?.(merged);
      // Reset the input so the same file can be re-added after removal.
      e.target.value = '';
    },
    [attachments, onAttachmentsChange]
  );

  const removeAttachment = useCallback(
    (index) => {
      onAttachmentsChange?.(attachments.filter((_, i) => i !== index));
    },
    [attachments, onAttachmentsChange]
  );

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      const merged = [...attachments];
      newFiles.forEach((file) => {
        const isDuplicate = merged.some(
          (f) => f.name === file.name && f.size === file.size
        );
        if (!isDuplicate) merged.push(file);
      });
      onAttachmentsChange?.(merged);
    }
  }, [attachments, onAttachmentsChange]);

  if (!editor) return null;

  return (
    <div 
      className={`border rounded-xl overflow-hidden bg-white transition-all duration-200 ${isDragging ? 'border-indigo-400 ring-4 ring-indigo-500/20' : 'border-slate-200'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ── Bulletproof list-style overrides ── */}
      {/* Tailwind Preflight resets list-style and padding to none/0 globally.  */}
      {/* This <style> tag re-applies browser-native bullets scoped to .tiptap.  */}
      <style>{`
        .tiptap.ProseMirror {
          direction: rtl;
          text-align: right;
        }
        .tiptap.ProseMirror p.is-editor-empty:first-child::before {
          direction: rtl;
          text-align: right;
          float: right;
        }
        .tiptap ul {
          list-style-type: disc !important;
          padding-inline-start: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .tiptap ol {
          list-style-type: decimal !important;
          padding-inline-start: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .tiptap li {
          display: list-item !important;
        }
        .tiptap li p {
          margin: 0 !important;
        }
        .tiptap pre {
          background-color: #1e293b;
          color: #f8fafc;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-family: monospace;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .tiptap code {
          background-color: #f1f5f9;
          color: #ef4444;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875em;
        }
        .tiptap pre code {
          background-color: transparent;
          color: inherit;
          padding: 0;
        }
        .tiptap blockquote {
          border-inline-start: 3px solid #cbd5e1;
          padding-inline-start: 1rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          color: #64748b;
          font-style: italic;
        }
      `}</style>
      {/* ── Barre d'outils ── */}
      <div className="flex items-center gap-1 px-3 py-2 bg-slate-50 border-b border-slate-200 flex-wrap">
        {/* Attachment */}
        <button
          type="button"
          onClick={handlePaperclipClick}
          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition"
          title="Ajouter une pièce jointe"
        >
          <Paperclip size={16} />
        </button>
        <div className="w-px h-5 bg-slate-300 mx-1" />

        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => runCommand(() => editor.chain().focus().toggleBold().run())}
          isActive={editor.isActive('bold')}
          icon={Bold}
          title="Gras"
        />
        <ToolbarButton
          onClick={() => runCommand(() => editor.chain().focus().toggleItalic().run())}
          isActive={editor.isActive('italic')}
          icon={Italic}
          title="Italique"
        />
        <ToolbarButton
          onClick={() => runCommand(() => editor.chain().focus().toggleUnderline().run())}
          isActive={editor.isActive('underline')}
          icon={UnderlineIcon}
          title="Souligné"
        />
        <div className="w-px h-5 bg-slate-300 mx-1" />

        {/* Lists & Blockquote */}
        <ToolbarButton
          onClick={() => runCommand(() => editor.chain().focus().toggleBulletList().run())}
          isActive={editor.isActive('bulletList')}
          icon={List}
          title="Liste à puces"
        />
        <ToolbarButton
          onClick={() => runCommand(() => editor.chain().focus().toggleOrderedList().run())}
          isActive={editor.isActive('orderedList')}
          icon={ListOrdered}
          title="Liste numérotée"
        />
        <ToolbarButton
          onClick={() => runCommand(() => editor.chain().focus().toggleBlockquote().run())}
          isActive={editor.isActive('blockquote')}
          icon={Quote}
          title="Citation"
        />
        <div className="w-px h-5 bg-slate-300 mx-1" />

        {/* Undo & Redo */}
        <ToolbarButton
          onClick={() => runCommand(() => editor.chain().focus().undo().run())}
          isActive={false}
          disabled={!editor.can().undo()}
          icon={Undo}
          title="Annuler"
        />
        <ToolbarButton
          onClick={() => runCommand(() => editor.chain().focus().redo().run())}
          isActive={false}
          disabled={!editor.can().redo()}
          icon={Redo}
          title="Rétablir"
        />

        {/* Hidden native file input – owned here, triggered by the paperclip */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {/* ── Zone d'édition ── */}
      <div className="relative min-h-[120px] max-h-[300px] overflow-y-auto" dir="rtl">
        <EditorContent editor={editor} className="min-h-[120px] text-right" />

        {/* Placeholder personnalisé */}
        {editor.isEmpty && (
          <div className="absolute top-3 right-4 rtl:right-4 ltr:left-4 pointer-events-none text-slate-400 text-sm text-right leading-relaxed select-none pe-4">
            {placeholder}
          </div>
        )}
      </div>

      {/* ── Liste des pièces jointes (Dropzone style) ── */}
      {(attachments.length > 0 || isDragging) && (
        <div className={`px-4 py-3 border-t transition-colors duration-200 ${isDragging ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50/80 border-slate-200/80'}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">المرفقات</p>
            {isDragging && <p className="text-[10px] font-bold text-indigo-500 animate-pulse">أفلت الملفات هنا...</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {attachments.map((file, i) => (
              <div
                key={`${file.name}-${file.size}-${i}`}
                className="flex items-center justify-between bg-white border border-slate-200/80 p-2 rounded-lg shadow-sm hover:border-indigo-300 transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-500 flex-shrink-0">
                    <Paperclip size={14} />
                  </div>
                  <div className="flex-1 min-w-0 leading-tight">
                    <p className="text-xs font-semibold text-slate-700 truncate" dir="ltr">{file.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors shrink-0"
                  title="Retirer"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TiptapEditor;
