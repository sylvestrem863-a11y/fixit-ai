import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './profile-form'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('full_name,avatar_url').eq('id', user.id).single()

  return <main className="container">
    <nav className="nav">
      <Link href="/dashboard" className="logo">FixIt<span style={{ color: '#78a7ff' }}>.</span></Link>
      <Link href="/problems" className="muted">Mes problèmes</Link>
    </nav>
    <section className="dashboard-head">
      <span className="badge">Mon profil</span>
      <h1>Ton espace personnel.</h1>
      <p className="muted">Gère les informations de ton compte FixIt.</p>
    </section>
    <ProfileForm initialName={profile?.full_name || user.user_metadata?.full_name || ''} />
    <p className="muted detail-disclaimer">Ton adresse courriel actuelle est {user.email || 'non disponible'}. Les informations de profil sont privées.</p>
  </main>
}
