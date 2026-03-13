"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Heading1,
  Heading2,
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({ content, onChange, placeholder }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[200px] max-h-[400px] overflow-y-auto p-4 bg-white rounded-2xl border-2 border-transparent font-medium text-brand-navy",
      },
    },
  });

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="w-full bg-brand-cream/50 rounded-3xl border-2 border-brand-navy/5 overflow-hidden focus-within:border-brand-orange transition-all">
      <div className="flex flex-wrap gap-1 p-2 bg-brand-navy/5 border-b border-brand-navy/5">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive("bold") ? "bg-brand-navy text-white" : "text-brand-navy/60 hover:bg-brand-navy/10"}`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive("italic") ? "bg-brand-navy text-white" : "text-brand-navy/60 hover:bg-brand-navy/10"}`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-brand-navy/10 mx-1 self-center" />
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive("heading", { level: 1 }) ? "bg-brand-navy text-white" : "text-brand-navy/60 hover:bg-brand-navy/10"}`}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive("heading", { level: 2 }) ? "bg-brand-navy text-white" : "text-brand-navy/60 hover:bg-brand-navy/10"}`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-brand-navy/10 mx-1 self-center" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive("bulletList") ? "bg-brand-navy text-white" : "text-brand-navy/60 hover:bg-brand-navy/10"}`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive("orderedList") ? "bg-brand-navy text-white" : "text-brand-navy/60 hover:bg-brand-navy/10"}`}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive("blockquote") ? "bg-brand-navy text-white" : "text-brand-navy/60 hover:bg-brand-navy/10"}`}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-brand-navy/10 mx-1 self-center" />
        <button
          onClick={setLink}
          className={`p-2 rounded-lg transition-colors ${editor.isActive("link") ? "bg-brand-navy text-white" : "text-brand-navy/60 hover:bg-brand-navy/10"}`}
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-brand-navy/10 mx-1 self-center" />
        <button
          onClick={() => editor.chain().focus().undo().run()}
          className="p-2 rounded-lg text-brand-navy/60 hover:bg-brand-navy/10 transition-colors"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          className="p-2 rounded-lg text-brand-navy/60 hover:bg-brand-navy/10 transition-colors"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
