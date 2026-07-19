import React, { useRef, useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import BulletList from '@tiptap/extension-bullet-list';
import { ListItem } from '@tiptap/extension-list-item';
import TextAlign from '@tiptap/extension-text-align';
import { Bold, Italic, Underline as UnderlineIcon, List, Paperclip, X } from 'lucide-react';

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
const ToolbarButton = ({ onClick, isActive, icon: Icon, title }) => (
  <button
    type="button"
    onMouseDown={(e) => {
      // Use onMouseDown + preventDefault so the editor never loses focus,
      // which also makes the active state update feel completely instant.
      e.preventDefault();
      onClick();
    }}
    className={`p-1.5 rounded transition-colors ${
      isActive
        ? 'bg-blue-100 text-blue-700'
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
        class: 'tiptap prose prose-sm max-w-none focus:outline-none min-h-[100px] px-3 py-2',
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

  if (!editor) return null;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      {/* ── Bulletproof list-style overrides ── */}
      {/* Tailwind Preflight resets list-style and padding to none/0 globally.  */}
      {/* This <style> tag re-applies browser-native bullets scoped to .tiptap.  */}
      <style>{`
        .tiptap ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .tiptap ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .tiptap li {
          display: list-item !important;
        }
        .tiptap li p {
          margin: 0 !important;
        }
      `}</style>
      {/* ── Barre d'outils ── */}
      <div className="flex items-center gap-1 px-3 py-2 bg-slate-50 border-b border-slate-200">
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
        <div className="w-px h-5 bg-slate-200 mx-2" />
        <ToolbarButton
          onClick={() => runCommand(() => editor.chain().focus().toggleBulletList().run())}
          isActive={editor.isActive('bulletList')}
          icon={List}
          title="Liste à puces"
        />
        <div className="w-px h-5 bg-slate-200 mx-2" />

        {/* Paperclip – triggers the hidden file input */}
        <button
          type="button"
          onClick={handlePaperclipClick}
          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition"
          title="Ajouter une pièce jointe"
        >
          <Paperclip size={16} />
        </button>

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
      <div className="relative min-h-[120px] max-h-[300px] overflow-y-auto">
        <EditorContent editor={editor} className="min-h-[120px]" />

        {/* Placeholder personnalisé */}
        {editor.isEmpty && (
          <div className="absolute top-3 left-3 pointer-events-none text-slate-400 text-sm">
            {placeholder}
          </div>
        )}
      </div>

      {/* ── Liste des pièces jointes ── */}
      {attachments.length > 0 && (
        <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/60 flex flex-col gap-1">
          {attachments.map((file, i) => (
            <div
              key={`${file.name}-${file.size}-${i}`}
              className="flex items-center justify-between bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-sm text-[11px] text-slate-600"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Paperclip size={11} className="text-slate-400 shrink-0" />
                <span className="truncate max-w-[220px]">{file.name}</span>
                <span className="text-slate-400 shrink-0">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className="ml-2 text-slate-400 hover:text-rose-500 transition shrink-0"
                title="Retirer"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TiptapEditor;
