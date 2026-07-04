import { useState } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { FieldFillModal } from './FieldFillModal'
import type { FillChampAttrs } from './fillFieldNode'

export function FieldFillNodeView({ node, updateAttributes }: NodeViewProps) {
  const [open, setOpen] = useState(false)
  const attrs = node.attrs as FillChampAttrs
  const hasValue = !!attrs.value?.trim()

  return (
    <NodeViewWrapper as="span" style={{ display: 'inline' }}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        contentEditable={false}
        style={hasValue ? filledStyle : emptyStyle}
        title={attrs.label}
      >
        {hasValue ? attrs.value : `+ ${attrs.label}`}
      </button>
      <FieldFillModal
        open={open}
        label={attrs.label}
        value={attrs.value ?? ''}
        onSave={(value) => { updateAttributes({ value }); setOpen(false) }}
        onClose={() => setOpen(false)}
      />
    </NodeViewWrapper>
  )
}

const baseStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  fontFamily: "'Sora', system-ui, sans-serif",
  fontSize: '14px',
  fontWeight: 500,
  borderRadius: '4px',
  padding: '1px 6px',
  margin: '0 1px',
  cursor: 'pointer',
  border: '1px solid transparent',
} as const

const filledStyle = {
  ...baseStyle,
  background: 'transparent',
  color: 'var(--n-900)',
  borderBottom: '1px dotted var(--color-ink)',
  borderRadius: 0,
  padding: '0',
}

const emptyStyle = {
  ...baseStyle,
  background: 'var(--color-seal-10)',
  color: 'var(--color-seal)',
  border: '1px solid var(--color-seal-hover)',
}
