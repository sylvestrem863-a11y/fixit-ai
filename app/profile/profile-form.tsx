'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function ProfileForm({ initialName }: { initialName: string }) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true); setMessage(''); setError('')
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Enregistrement impossible.')
      setMessage('Profil enregistré.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible.')
    } finally { setSaving(false) }
  }

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return <>
    <form onSubmit={save} className="card detail-section">
      <h2>Informations personnelles</h2>
      <label className="field"><span>Nom affiché</span><input value={name} onChange={e => setName(e.target.value)} maxLength={120} /></label>
      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}
      <button className="button" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
    </form>
    <section className="card detail-section">
      <h2>Session</h2>
      <p className="muted">Tu peux te déconnecter de FixIt depuis cet appareil.</p>
      <button className="button secondary" onClick={logout}>Se déconnecter</button>
    </section>
  </>
}
