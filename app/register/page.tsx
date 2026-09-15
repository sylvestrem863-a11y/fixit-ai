'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function RegisterPage() {
  const [message, setMessage] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('Création de compte Supabase sera activée dans la prochaine étape.')
  }

  return (
    <main className="container auth-page">
      <Link href="/" className="logo">FixIt<span style={{color:'#78a7ff'}}>.</span></Link>
      <div className="auth-card card">
        <span className="badge">Commence gratuitement</span>
        <h1>Créer ton compte</h1>
        <p className="muted">Retrouve tes problèmes et tes plans d’action au même endroit.</p>
        <form onSubmit={submit} className="form-stack">
          <label>Nom<input className="problem-input" type="text" name="name" required /></label>
          <label>Email<input className="problem-input" type="email" name="email" required /></label>
          <label>Mot de passe<input className="problem-input" type="password" name="password" minLength={8} required /></label>
          <button className="button" type="submit">Créer mon compte</button>
        </form>
        {message && <p className="muted">{message}</p>}
        <p className="muted">Déjà inscrit ? <Link href="/login">Se connecter</Link></p>
      </div>
    </main>
  )
}