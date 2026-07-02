import { useState } from 'react'
import { TrameTypePicker } from './TrameTypePicker'
import { TrameDetailPage } from './TrameDetailPage'

export function TrameLibraryPage() {
  const [typeActe, setTypeActe] = useState<string | null>(null)

  return typeActe
    ? <TrameDetailPage typeActe={typeActe} onBack={() => setTypeActe(null)} />
    : <TrameTypePicker onSelect={setTypeActe} />
}
