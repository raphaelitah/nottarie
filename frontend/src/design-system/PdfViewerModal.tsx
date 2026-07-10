import { Modal } from './Modal'

interface PdfViewerModalProps {
  open: boolean
  onClose: () => void
  title: string
  url: string | null
}

export function PdfViewerModal({ open, onClose, title, url }: PdfViewerModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="xl">
      {url ? (
        <iframe
          src={url}
          title={title}
          style={{ width: '100%', height: '80vh', border: 'none', display: 'block' }}
        />
      ) : (
        <p>Chargement…</p>
      )}
    </Modal>
  )
}
