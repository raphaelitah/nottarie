import { useState, type CSSProperties, type ReactNode } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { FieldNode } from './fieldNode'
import { FieldFormModal } from './FieldFormModal'
import { extractVariablesFromDoc } from './extractVariables'
import type { SectionVariable } from '../../../types/database'

interface ContentEditorProps {
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>, variables: SectionVariable[]) => void
}

export function ContentEditor({ content, onChange }: ContentEditorProps) {
  const [fieldModalOpen, setFieldModalOpen] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit, FieldNode],
    content: Object.keys(content).length ? content : { type: 'doc', content: [{ type: 'paragraph' }] },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      onChange(json, extractVariablesFromDoc(json))
    },
  })

  if (!editor) return null

  const existingKeys = (() => {
    const keys: string[] = []
    editor.state.doc.descendants((n) => {
      if (n.type.name === 'champ' && typeof n.attrs.key === 'string') keys.push(n.attrs.key)
    })
    return keys
  })()

  return (
    <div>
      <div style={toolbarStyle}>
        <ToolbarButton label="Gras" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>B</ToolbarButton>
        <ToolbarButton label="Italique" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></ToolbarButton>
        <ToolbarButton label="Liste à puces" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>•</ToolbarButton>
        <div style={{ width: '1px', background: 'var(--border-default)', margin: '0 4px' }} />
        <button type="button" onClick={() => setFieldModalOpen(true)} style={insertFieldBtnStyle}>+ champ</button>
      </div>
      <EditorContent editor={editor} style={editorContentStyle} />
      <FieldFormModal
        open={fieldModalOpen}
        existingKeys={existingKeys}
        onSave={(attrs) => {
          editor.chain().focus().insertChamp(attrs).run()
          setFieldModalOpen(false)
        }}
        onClose={() => setFieldModalOpen(false)}
      />
    </div>
  )
}

function ToolbarButton({ label, active, onClick, children }: { label: string; active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" title={label} onClick={onClick} style={{ ...toolbarBtnStyle, ...(active ? toolbarBtnActiveStyle : {}) }}>
      {children}
    </button>
  )
}

const toolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '6px 8px',
  border: '1px solid var(--border-default)',
  borderBottom: 'none',
  borderRadius: '6px 6px 0 0',
  background: 'var(--n-100)',
}

const toolbarBtnStyle: CSSProperties = {
  width: '28px',
  height: '28px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--font-sans)',
  fontSize: '13px',
  fontWeight: 700,
  color: 'var(--n-700)',
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: '4px',
  cursor: 'pointer',
}

const toolbarBtnActiveStyle: CSSProperties = {
  background: '#FFFFFF',
  borderColor: 'var(--border-default)',
  color: 'var(--color-ink)',
}

const insertFieldBtnStyle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--color-ink)',
  background: '#FFFFFF',
  border: '1px solid var(--border-default)',
  borderRadius: '4px',
  padding: '4px 10px',
  cursor: 'pointer',
}

const editorContentStyle: CSSProperties = {
  border: '1px solid var(--border-default)',
  borderRadius: '0 0 6px 6px',
  padding: '12px',
  minHeight: '160px',
  fontFamily: 'var(--font-sans)',
  fontSize: '14px',
  color: 'var(--n-900)',
  lineHeight: 1.6,
}
