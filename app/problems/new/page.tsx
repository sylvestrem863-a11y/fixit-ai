'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewProblemPage() {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const response = await fetch('/api/problems', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description, category }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Création impossible')
      router.push(`/problems/${data.id}`)
    } catch (err) { setError(err instanceof Error ? err.message : 'Une erreur est survenue.'); setLoading(false) }
  }

  return (
    <main className="container">
      <nav className="nav"><Link href="/" className="logo">FixIt<span style={{color:'#78a7ff'}}>.</span></Link><Link href="/dashboard" className="muted">← Dashboard</Link></nav>
      <section className="problem-form card">
        <span className="badge">Nouveau problème</span><h1>Décris ce qui t’arrive</h1>
        <p className="muted">Écris simplement la situation avec tes mots. FixIt va l’analyser, créer ton plan et l’enregistrer.</p>
        <form onSubmit={submit} className="form-stack">
          <label>Catégorie<select className="problem-input" value={category} onChange={e => setCategory(e.target.value)}><option value="">Choisir une catégorie</option><option>Administratif</option><option>Logement</option><option>Finances</option><option>Travail</option><option>Auto</option><option>Informatique</option><option>Réparation</option><option>Autre</option></select></label>
          <label>Ton problème<textarea className="problem-input large-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex. J’ai reçu une facture beaucoup plus élevée que d’habitude..." minLength={10} required /></label>
          <button className="button" type="submit" disabled={loading}>{loading ? 'Création du plan…' : 'Analyser et créer mon plan →'}</button>
        </form>
        {error && <div className="notice">{error}</div>}
      </section>
    </main>
  )
}
