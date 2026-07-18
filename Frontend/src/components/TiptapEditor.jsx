import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import BulletList from '@tiptap/extension-bullet-list';
import TextAlign from '@tiptap/extension-text-align';
import { Bold, Italic, Underline as UnderlineIcon, List, Paperclip } from 'lucide-react';

const TiptapEditor = ({ content, onChange, placeholder = 'Écrivez votre réponse...' }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      BulletList,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[100px] px-3 py-2',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ onClick, isActive, icon: Icon, title }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
      className={`p-1.5 rounded transition ${
        isActive 
          ? 'bg-blue-100 text-blue-700' 
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
      }`}
      title={title}
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white relative">
      {/* Barre d'outils */}
      <div className="flex items-center gap-1 px-3 py-2 bg-slate-50 border-b border-slate-200">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={Bold}
          title="Gras"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={Italic}
          title="Italique"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          icon={UnderlineIcon}
          title="Souligné"
        />
        <div className="w-px h-5 bg-slate-200 mx-2" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          icon={List}
          title="Liste à puces"
        />
        <div className="w-px h-5 bg-slate-200 mx-2" />
        <button 
          type="button" 
          onClick={(e) => e.preventDefault()}
          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition" 
          title="Ajouter une pièce jointe"
        >
          <Paperclip size={16} />
        </button>
      </div>
      
      {/* Zone d'édition */}
      <div className="relative min-h-[120px] max-h-[300px] overflow-y-auto">
        <EditorContent 
          editor={editor} 
          className="min-h-[120px]"
        />
        
        {/* Placeholder personnalisé */}
        {editor.isEmpty && (
          <div className="absolute top-3 left-3 pointer-events-none text-slate-400 text-sm">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
};

export default TiptapEditor;
