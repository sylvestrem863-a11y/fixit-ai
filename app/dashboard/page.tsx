import Link from 'next/link'

const stats = [
  ['0', 'Problèmes ouverts'],
  ['0', 'Actions à faire'],
  ['0', 'Problèmes résolus'],
]

export default function DashboardPage() {
  return (
    <main className="container">
      <nav className="nav"><Link href="/" className="logo">FixIt<span style={{color:'#78a7ff'}}>.</span></Link><Link href="/problems/new" className="button">+ Nouveau problème</Link></nav>
      <section className="dashboard-head">
        <span className="badge">Tableau de bord</span>
        <h1>Qu’est-ce qu’on règle aujourd’hui ?</h1>
        <p className="muted">Tous tes problèmes, actions et suivis au même endroit.</p>
      </section>
      <section className="grid stats-grid">
        {stats.map(([value,label]) => <article className="feature" key={label}><strong className="stat-value">{value}</strong><p>{label}</p></article>)}
      </section>
      <section className="card empty-state">
        <h2>Aucun problème pour le moment</h2>
        <p className="muted">Décris ta première situation et FixIt préparera un plan d’action.</p>
        <Link href="/problems/new" className="button">Créer mon premier problème →</Link>
      </section>
    </main>
  )
}