'use client'

import { useState } from 'react'

type Note = { id: string; content: string; created_at: string }

export function Notes({ problemId, initialNotes }: { problemId: string; initialNotes: Note[] }) {
  const [notes, setNotes] = useState(initialNotes)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function addNote(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true); setError('')
    try {
      const response = await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ problemId, content }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Impossible d’ajouter la note.')
      setNotes(current => [data.note, ...current]); setContent('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Erreur.') }
    finally { setSaving(false) }
  }

  async function remove(id: string) {
    const response = await fetch(`/api/notes?id=${id}`, { method: 'DELETE' })
    if (response.ok) setNotes(current => current.filter(note => note.id !== id))
    else { const data = await response.json(); setError(data.error || 'Suppression impossible.') }
  }

  return <div>
    <form onSubmit={addNote} className="note-form">
      <textarea className="problem-input note-input" value={content} onChange={e => setContent(e.target.value)} placeholder="Ajoute une note, un appel, une information importante…" maxLength={5000} />
      <button className="button" disabled={saving || !content.trim()}>{saving ? 'Enregistrement…' : 'Ajouter la note'}</button>
    </form>
    {error && <p className="error-text">{error}</p>}
    {notes.length ? <div className="note-list">{notes.map(note => <article className="note-item" key={note.id}><div><p>{note.content}</p><span className="muted">{new Date(note.created_at).toLocaleString('fr-CA')}</span></div><button className="text-button" onClick={() => remove(note.id)}>Supprimer</button></article>)}</div> : <p className="muted">Aucune note pour le moment.</p>}
  </div>
}
