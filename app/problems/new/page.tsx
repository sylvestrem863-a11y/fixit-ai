'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function NewProblemPage() {
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('Ton problème est prêt pour l’analyse IA. La connexion Supabase sera branchée ensuite.')
  }

  return (
    <main className="container">
      <nav className="nav"><Link href="/" className="logo">FixIt<span style={{color:'#78a7ff'}}>.</span></Link><Link href="/dashboard" className="muted">← Dashboard</Link></nav>
      <section className="problem-form card">
        <span className="badge">Nouveau problème</span>
        <h1>Décris ce qui t’arrive</h1>
        <p className="muted">Pas besoin de savoir comment l’expliquer. Écris simplement la situation avec tes mots.</p>
        <form onSubmit={submit} className="form-stack">
          <label>Catégorie
            <select className="problem-input" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Choisir une catégorie</option><option>Administratif</option><option>Logement</option><option>Finances</option><option>Travail</option><option>Auto</option><option>Informatique</option><option>Réparation</option><option>Autre</option>
            </select>
          </label>
          <label>Ton problème
            <textarea className="problem-input large-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex. J’ai reçu une facture beaucoup plus élevée que d’habitude..." minLength={10} required />
          </label>
          <button className="button" type="submit">Analyser avec FixIt →</button>
        </form>
        {message && <div className="notice">{message}</div>}
      </section>
    </main>
  )
}