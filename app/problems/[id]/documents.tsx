'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type DocumentItem = { id: string; file_name: string; mime_type: string | null; size_bytes: number | null; created_at: string }

export function Documents({ problemId, initialDocuments }: { problemId: string; initialDocuments: DocumentItem[] }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [documents, setDocuments] = useState(initialDocuments)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function upload(file?: File) {
    if (!file) return
    setLoading(true); setMessage('')
    const form = new FormData(); form.append('problemId', problemId); form.append('file', file)
    try {
      const response = await fetch('/api/documents', { method: 'POST', body: form })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Upload impossible')
      setDocuments(current => [data.document, ...current])
      router.refresh()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Upload impossible.') }
    finally { setLoading(false); if (inputRef.current) inputRef.current.value = '' }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce document ?')) return
    const response = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    if (response.ok) setDocuments(current => current.filter(x => x.id !== id))
    else setMessage((await response.json()).error || 'Suppression impossible.')
  }

  const size = (bytes: number | null) => bytes == null ? '' : `${(bytes / 1024 / 1024).toFixed(1)} Mo`
  return <div className="documents-box">
    <input ref={inputRef} hidden type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e => upload(e.target.files?.[0])} />
    <button className="button secondary" disabled={loading} onClick={() => inputRef.current?.click()}>{loading ? 'Téléversement…' : '+ Ajouter un document'}</button>
    <p className="muted">PDF, JPG, PNG ou WEBP · maximum 10 Mo · stockage privé</p>
    {message && <p className="error-text">{message}</p>}
    {documents.length > 0 && <div className="document-list">{documents.map(doc => <div className="document-row" key={doc.id}><div><strong>{doc.file_name}</strong><span className="muted">{size(doc.size_bytes)}</span></div><div className="document-actions"><a className="text-button" href={`/api/documents/${doc.id}/download`} target="_blank" rel="noreferrer">Ouvrir</a><button className="text-button" onClick={() => remove(doc.id)}>Supprimer</button></div></div>)}</div>}
  </div>
}
