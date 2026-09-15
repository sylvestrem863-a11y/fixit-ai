import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function ProblemsPage() {
  const supabase = await createClient()
  const { data: problems } = await supabase
    .from('problems')
    .select('id,title,category,priority,status,created_at')
    .order('created_at', { ascending: false })

  return (
    <main className="container">
      <nav className="nav">
        <Link href="/" className="logo">FixIt<span style={{ color: '#78a7ff' }}>.</span></Link>
        <Link href="/problems/new" className="button">+ Nouveau problème</Link>
      </nav>
      <section className="dashboard-head">
        <span className="badge">Mes problèmes</span>
        <h1>Tout ce qu’on doit régler.</h1>
        <p className="muted">Retrouve tes situations et ouvre leur plan d’action.</p>
      </section>
      <section className="problem-list">
        {problems?.length ? problems.map((problem) => (
          <Link href={`/problems/${problem.id}`} className="card problem-row" key={problem.id}>
            <div>
              <strong>{problem.title}</strong>
              <p className="muted">{problem.category || 'Autre'} · {new Date(problem.created_at).toLocaleDateString('fr-CA')}</p>
            </div>
            <div className="problem-meta"><span className={`priority priority-${problem.priority}`}>{problem.priority}</span><span className="muted">{problem.status}</span></div>
          </Link>
        )) : (
          <div className="card empty-state"><h2>Aucun problème</h2><p className="muted">Crée ton premier problème pour obtenir un plan d’action.</p><Link href="/problems/new" className="button">Commencer →</Link></div>
        )}
      </section>
    </main>
  )
}
