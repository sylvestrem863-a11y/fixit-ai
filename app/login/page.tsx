'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMessage('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return setMessage(error.message)
      router.push('/dashboard'); router.refresh()
    } catch { setMessage('Configuration Supabase indisponible. Vérifie les variables de connexion.') }
    finally { setLoading(false) }
  }

  return (
    <main className="container auth-page">
      <Link href="/" className="logo">FixIt<span style={{color:'#78a7ff'}}>.</span></Link>
      <div className="auth-card card">
        <span className="badge">Bienvenue</span><h1>Connexion</h1>
        <p className="muted">Accède à tes problèmes, checklists et plans d’action.</p>
        <form onSubmit={submit} className="form-stack">
          <label>Email<input className="problem-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
          <label>Mot de passe<input className="problem-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
          <button className="button" type="submit" disabled={loading}>{loading ? 'Connexion…' : 'Se connecter'}</button>
        </form>
        {message && <p className="error-text">{message}</p>}
        <p className="muted">Pas encore de compte ? <Link href="/register">Créer un compte</Link></p>
      </div>
    </main>
  )
}