import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import type { ParagraphFieldType } from '../../../types/database'
import { FieldNodeView } from './FieldNodeView'

export interface ChampAttrs {
  key: string
  label: string
  fieldType: ParagraphFieldType
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    champ: {
      insertChamp: (attrs: ChampAttrs) => ReturnType
    }
  }
}

export const FieldNode = Node.create({
  name: 'champ',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      key: { default: '' },
      label: { default: '' },
      fieldType: { default: 'auto' },
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
      }),
      `{{ ${node.attrs.key} }}`,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FieldNodeView)
  },

  addCommands() {
    return {
      insertChamp:
        (attrs: ChampAttrs) =>
        ({ chain }) =>
          chain().insertContent({ type: this.name, attrs }).run(),
    }
  },
})
