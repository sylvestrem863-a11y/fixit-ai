'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function NewProblemPage() {
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setAnalysis(null)
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, category: category || undefined }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Analyse impossible')
      setAnalysis(data.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally { setLoading(false) }
  }

  return (
    <main className="container">
      <nav className="nav"><Link href="/" className="logo">FixIt<span style={{color:'#78a7ff'}}>.</span></Link><Link href="/dashboard" className="muted">← Dashboard</Link></nav>
      <section className="problem-form card">
        <span className="badge">Nouveau problème</span>
        <h1>Décris ce qui t’arrive</h1>
        <p className="muted">Écris simplement la situation avec tes mots. FixIt va la transformer en plan d’action.</p>
        <form onSubmit={submit} className="form-stack">
          <label>Catégorie
            <select className="problem-input" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Choisir une catégorie</option><option>Administratif</option><option>Logement</option><option>Finances</option><option>Travail</option><option>Auto</option><option>Informatique</option><option>Réparation</option><option>Autre</option>
            </select>
          </label>
          <label>Ton problème
            <textarea className="problem-input large-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex. J’ai reçu une facture beaucoup plus élevée que d’habitude..." minLength={10} required />
          </label>
          <button className="button" type="submit" disabled={loading}>{loading ? 'Analyse en cours…' : 'Analyser avec FixIt →'}</button>
        </form>
        {error && <div className="notice">{error}</div>}
      </section>

      {analysis && <section className="analysis card">
        <span className="badge">Plan FixIt</span>
        <h2>{analysis.title}</h2>
        <p>{analysis.summary}</p>
        <p><strong>Priorité :</strong> {analysis.priority}</p>
        <h3>Actions recommandées</h3>
        <ol>{analysis.recommended_actions.map((item: string) => <li key={item}>{item}</li>)}</ol>
        <h3>Checklist</h3>
        <ul>{analysis.checklist.map((item: string) => <li key={item}>☐ {item}</li>)}</ul>
        {analysis.warnings?.length > 0 && <><h3>À surveiller</h3><ul>{analysis.warnings.map((item: string) => <li key={item}>{item}</li>)}</ul></>}
      </section>}
    </main>
  )
}
