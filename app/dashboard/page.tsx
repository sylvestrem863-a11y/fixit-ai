import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: problems } = await supabase.from('problems').select('id,title,priority,status,created_at').order('created_at', { ascending: false })
  const ids = problems?.map(p => p.id) || []
  const { data: actions } = ids.length ? await supabase.from('action_items').select('id,completed').in('problem_id', ids) : { data: [] }
  const open = problems?.filter(p => p.status !== 'resolved' && p.status !== 'archived').length || 0
  const pending = actions?.filter(a => !a.completed).length || 0
  const resolved = problems?.filter(p => p.status === 'resolved').length || 0

  return (
    <main className="container">
      <nav className="nav"><Link href="/" className="logo">FixIt<span style={{color:'#78a7ff'}}>.</span></Link><div className="nav-actions"><Link href="/problems" className="muted">Mes problèmes</Link><Link href="/problems/new" className="button">+ Nouveau problème</Link></div></nav>
      <section className="dashboard-head"><span className="badge">Tableau de bord</span><h1>Qu’est-ce qu’on règle aujourd’hui ?</h1><p className="muted">Tous tes problèmes, actions et suivis au même endroit.</p></section>
      <section className="grid stats-grid">
        {[[open,'Problèmes ouverts'],[pending,'Actions à faire'],[resolved,'Problèmes résolus']].map(([value,label]) => <article className="feature" key={label}><strong className="stat-value">{value}</strong><p>{label}</p></article>)}
      </section>
      <section className="problem-list">
        {problems?.length ? problems.slice(0, 5).map(problem => <Link href={`/problems/${problem.id}`} className="card problem-row" key={problem.id}><div><strong>{problem.title}</strong><p className="muted">{new Date(problem.created_at).toLocaleDateString('fr-CA')}</p></div><span className={`priority priority-${problem.priority}`}>{problem.priority}</span></Link>) : <div className="card empty-state"><h2>Aucun problème pour le moment</h2><p className="muted">Décris ta première situation et FixIt préparera un plan d’action.</p><Link href="/problems/new" className="button">Créer mon premier problème →</Link></div>}
      </section>
    </main>
  )
}
