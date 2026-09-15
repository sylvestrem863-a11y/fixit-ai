import Link from 'next/link'

const features = [
  ['🧠', 'Comprend ton problème', 'Décris simplement ce qui t’arrive. FixIt transforme ta situation en étapes concrètes.'],
  ['⚡', 'Priorise les actions', 'Identifie ce qui est urgent, ce qui peut attendre et ce qu’il faut surveiller.'],
  ['📋', 'Crée une checklist', 'Obtiens une liste d’actions, de documents et d’informations à préparer.'],
  ['🔒', 'Tes données restent privées', 'Tes problèmes et documents sont conçus pour rester accessibles uniquement à ton compte.'],
]

export default function Home() {
  return (
    <main className="container">
      <nav className="nav">
        <div className="logo">FixIt<span style={{color:'#78a7ff'}}>.</span></div>
        <Link href="/login" className="muted">Connexion</Link>
      </nav>

      <section className="hero">
        <span className="badge">Assistant personnel pour les problèmes du quotidien</span>
        <h1>Tu as un problème.<br /><span>FixIt te dit quoi faire.</span></h1>
        <p>Décris une situation, une lettre, une facture, une réparation, un problème informatique ou une démarche. FixIt t’aide à comprendre la situation et à passer à l’action.</p>

        <div className="card">
          <textarea className="problem-input" placeholder="Ex. J’ai reçu une lettre que je ne comprends pas et je dois répondre dans 10 jours…" />
          <Link href="/problems/new" className="button">Analyser mon problème →</Link>
        </div>
      </section>

      <section className="grid">
        {features.map(([icon,title,text]) => (
          <article className="feature" key={title}>
            <div style={{fontSize:28}}>{icon}</div>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section style={{padding:'80px 0'}}>
        <p className="muted">FixIt fournit de l’information et de l’aide à l’organisation. Pour les situations médicales, juridiques ou financières importantes, il faut confirmer les informations auprès d’un professionnel qualifié.</p>
      </section>
    </main>
  )
}
