import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { FieldFillNodeView } from './FieldFillNodeView'
import type { Comparant } from '../../types/database'

// Same node name ("champ") as the admin authoring extension, but a different
// Tiptap editor instance — this one renders a resolved/fillable value instead
// of exposing key/label/type editing.
export interface FillChampAttrs {
  key: string
  label: string
  fieldType: 'auto' | 'manuel'
  source?: string | null
  value: string
}

declare module '@tiptap/core' {
  interface Storage {
    champ: { comparants: Comparant[] }
  }
}

export const FillFieldNode = Node.create({
  name: 'champ',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addStorage() {
    return { comparants: [] as Comparant[] }
  },

  addAttributes() {
    return {
      key: { default: '' },
      label: { default: '' },
      fieldType: { default: 'auto' },
      source: { default: null },
      value: { default: '' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-champ]',
        getAttrs: (el) => {
          const element = el as HTMLElement
          return {
            key: element.getAttribute('data-key') ?? '',
            label: element.getAttribute('data-label') ?? '',
            fieldType: element.getAttribute('data-field-type') ?? 'auto',
            source: element.getAttribute('data-source') || null,
            value: element.getAttribute('data-value') ?? '',
          }
        },
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-champ': '',
        'data-key': node.attrs.key,
        'data-label': node.attrs.label,
        'data-field-type': node.attrs.fieldType,
        'data-source': node.attrs.source ?? '',
        'data-value': node.attrs.value ?? '',
      }),
      node.attrs.value || `{{ ${node.attrs.key} }}`,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FieldFillNodeView)
  },
})
