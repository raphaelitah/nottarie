import { useState } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { FieldFormModal } from './FieldFormModal'
import type { ChampAttrs } from './fieldNode'

const STYLE_BY_TYPE: Record<string, { background: string; color: string; border: string }> = {
  auto: { background: 'var(--color-ink-10)', color: 'var(--color-ink)', border: 'var(--color-ink-20)' },
  manuel: { background: 'var(--color-seal-10)', color: 'var(--color-seal)', border: 'var(--color-seal-hover)' },
}

export function FieldNodeView({ node, updateAttributes, deleteNode, editor }: NodeViewProps) {
  const [open, setOpen] = useState(false)
  const attrs = node.attrs as ChampAttrs
  const style = STYLE_BY_TYPE[attrs.fieldType] ?? STYLE_BY_TYPE.auto

  const existingKeys = (() => {
    const keys: string[] = []
    editor.state.doc.descendants((n) => {
      if (n.type.name === 'champ' && typeof n.attrs.key === 'string') keys.push(n.attrs.key)
    })
    return keys
  })()

  return (
    <NodeViewWrapper as="span" style={{ display: 'inline' }}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        contentEditable={false}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          fontFamily: "'Sora', system-ui, sans-serif",
          fontSize: '13px',
          fontWeight: 500,
          background: style.background,
          color: style.color,
          border: `1px solid ${style.border}`,
          borderRadius: '4px',
          padding: '1px 6px',
          margin: '0 1px',
          cursor: 'pointer',
        }}
      >
        {attrs.label || attrs.key}
      </button>
      <FieldFormModal
        open={open}
        initialValues={attrs}
        existingKeys={existingKeys}
        onSave={(next) => { updateAttributes(next); setOpen(false) }}
        onDelete={() => { deleteNode(); setOpen(false) }}
        onClose={() => setOpen(false)}
      />
    </NodeViewWrapper>
  )
}
