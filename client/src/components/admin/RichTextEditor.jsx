import { useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Bold, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Quote, Redo2, Undo2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { uploadImage } from '../../services/adminService.js';

function ToolbarButton({ label, active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`grid h-9 w-9 place-items-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40 ${active ? 'bg-brand-100 text-brand-800' : ''}`}
    >
      {children}
    </button>
  );
}

/**
 * Rich text for articles, service pages and the About text. Emits HTML through `onChange`;
 * the server sanitises it again, so only the formatting offered here survives.
 */
export default function RichTextEditor({ value, onChange, label = 'Content', minHeight = '16rem' }) {
  const toast = useToast();
  const picker = useRef(null);

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, autolink: true } }), Image],
    content: value || '',
    onUpdate: ({ editor: current }) => onChange(current.isEmpty ? '' : current.getHTML()),
    editorProps: {
      attributes: { 'aria-label': label, role: 'textbox', 'aria-multiline': 'true', class: 'rich-text focus:outline-none', style: `min-height:${minHeight}` },
    },
  });

  // Keep the editor in sync if the parent replaces the value (e.g. a different record is loaded).
  useEffect(() => {
    if (editor && value !== undefined && value !== (editor.isEmpty ? '' : editor.getHTML())) editor.commands.setContent(value || '', false);
  }, [value, editor]);

  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes('link').href || '';
    const url = window.prompt('Link address (leave empty to remove the link)', previous);
    if (url === null) return;
    if (url === '') editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const url = await uploadImage(file, 'content');
      const alt = window.prompt('Describe the picture for people who cannot see it', '') || '';
      editor.chain().focus().setImage({ src: url, alt }).run();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-300 bg-white focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-200">
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap gap-0.5 border-b border-slate-200 p-1.5">
        <ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" aria-hidden="true" /></ToolbarButton>
        <ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" aria-hidden="true" /></ToolbarButton>
        <ToolbarButton label="Heading" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" aria-hidden="true" /></ToolbarButton>
        <ToolbarButton label="Subheading" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" aria-hidden="true" /></ToolbarButton>
        <ToolbarButton label="Bulleted list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" aria-hidden="true" /></ToolbarButton>
        <ToolbarButton label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" aria-hidden="true" /></ToolbarButton>
        <ToolbarButton label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" aria-hidden="true" /></ToolbarButton>
        <ToolbarButton label="Link" active={editor.isActive('link')} onClick={setLink}><Link2 className="h-4 w-4" aria-hidden="true" /></ToolbarButton>
        <ToolbarButton label="Insert picture" onClick={() => picker.current?.click()}><ImagePlus className="h-4 w-4" aria-hidden="true" /></ToolbarButton>
        <span className="mx-1 w-px bg-slate-200" aria-hidden="true" />
        <ToolbarButton label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-4 w-4" aria-hidden="true" /></ToolbarButton>
        <ToolbarButton label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-4 w-4" aria-hidden="true" /></ToolbarButton>
        <input ref={picker} type="file" accept="image/jpeg,image/png,image/webp" onChange={addImage} className="sr-only" tabIndex={-1} aria-hidden="true" />
      </div>
      <div className="px-4 py-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
