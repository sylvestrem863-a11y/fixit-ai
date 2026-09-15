import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Checklist } from './checklist'

export default async function ProblemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: problem } = await supabase.from('problems').select('*').eq('id', id).single()
  if (!problem) notFound()
  const { data: actions } = await supabase.from('action_items').select('id,title,description,completed,position').eq('problem_id', id).order('position')
  const analysis = (problem.ai_analysis || {}) as Record<string, any>

  return (
    <main className="container">
      <nav className="nav"><Link href="/problems" className="muted">← Mes problèmes</Link><Link href="/problems/new" className="button">+ Nouveau</Link></nav>
      <section className="dashboard-head"><span className="badge">Plan FixIt</span><h1>{problem.title}</h1><p className="muted">{problem.description}</p><div className="problem-meta"><span className={`priority priority-${problem.priority}`}>{problem.priority}</span><span>{problem.status}</span></div></section>
      {analysis.summary && <section className="card"><h2>Résumé</h2><p>{analysis.summary}</p></section>}
      <section className="card detail-section"><h2>Plan d’action</h2><Checklist items={actions || []} /></section>
      {(analysis.warnings?.length || analysis.documents_to_keep?.length || analysis.required_information?.length) ? <section className="grid detail-grid">
        {analysis.warnings?.length ? <article className="card"><h2>⚠️ À surveiller</h2><ul>{analysis.warnings.map((x: string) => <li key={x}>{x}</li>)}</ul></article> : null}
        {analysis.documents_to_keep?.length ? <article className="card"><h2>📄 Documents</h2><ul>{analysis.documents_to_keep.map((x: string) => <li key={x}>{x}</li>)}</ul></article> : null}
        {analysis.required_information?.length ? <article className="card"><h2>ℹ️ Informations</h2><ul>{analysis.required_information.map((x: string) => <li key={x}>{x}</li>)}</ul></article> : null}
      </section> : null}
      <section className="card"><h2>Questions à clarifier</h2>{analysis.questions?.length ? <ul>{analysis.questions.map((x: string) => <li key={x}>{x}</li>)}</ul> : <p className="muted">Aucune question supplémentaire.</p>}</section>
      <p className="muted detail-disclaimer">FixIt fournit de l’information générale et une aide à l’organisation. Pour une situation médicale, juridique ou financière importante, confirme les informations auprès d’un professionnel qualifié.</p>
    </main>
  )
}
