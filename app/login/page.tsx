'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('Connexion Supabase sera activée dans la prochaine étape.')
  }

  return (
    <main className="container auth-page">
      <Link href="/" className="logo">FixIt<span style={{color:'#78a7ff'}}>.</span></Link>
      <div className="auth-card card">
        <span className="badge">Bienvenue</span>
        <h1>Connexion</h1>
        <p className="muted">Accède à tes problèmes, checklists et plans d’action.</p>
        <form onSubmit={submit} className="form-stack">
          <label>Email<input className="problem-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
          <label>Mot de passe<input className="problem-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
          <button className="button" type="submit">Se connecter</button>
        </form>
        {message && <p className="muted">{message}</p>}
        <p className="muted">Pas encore de compte ? <Link href="/register">Créer un compte</Link></p>
      </div>
    </main>
  )
}