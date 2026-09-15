'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function StatusActions({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function update(nextStatus: 'in_progress' | 'resolved' | 'archived') {
    setLoading(true); setError('')
    try {
      const response = await fetch(`/api/problems/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Mise à jour impossible')
      router.refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Erreur') } finally { setLoading(false) }
  }

  return <div className="status-actions">
    {status !== 'in_progress' && status !== 'resolved' && <button className="button secondary" disabled={loading} onClick={() => update('in_progress')}>Commencer</button>}
    {status !== 'resolved' && <button className="button" disabled={loading} onClick={() => update('resolved')}>✓ Marquer résolu</button>}
    {status === 'resolved' && <button className="button secondary" disabled={loading} onClick={() => update('in_progress')}>Rouvrir</button>}
    {status !== 'archived' && <button className="text-button" disabled={loading} onClick={() => update('archived')}>Archiver</button>}
    {error && <span className="error-text">{error}</span>}
  </div>
}
