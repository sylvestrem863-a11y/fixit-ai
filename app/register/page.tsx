'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
    setLoading(false)
    if (error) return setMessage(error.message)
    if (data.session) router.push('/dashboard')
    else setMessage('Compte créé. Vérifie ton courriel pour confirmer ton adresse.')
  }

  return (
    <main className="container auth-page">
      <Link href="/" className="logo">FixIt<span style={{color:'#78a7ff'}}>.</span></Link>
      <div className="auth-card card">
        <span className="badge">Commence gratuitement</span>
        <h1>Créer ton compte</h1>
        <p className="muted">Retrouve tes problèmes et tes plans d’action au même endroit.</p>
        <form onSubmit={submit} className="form-stack">
          <label>Nom<input className="problem-input" type="text" value={name} onChange={e => setName(e.target.value)} required /></label>
          <label>Email<input className="problem-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
          <label>Mot de passe<input className="problem-input" type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required /></label>
          <button className="button" type="submit" disabled={loading}>{loading ? 'Création…' : 'Créer mon compte'}</button>
        </form>
        {message && <p className="muted">{message}</p>}
        <p className="muted">Déjà inscrit ? <Link href="/login">Se connecter</Link></p>
      </div>
    </main>
  )
}