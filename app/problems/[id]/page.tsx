import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Checklist } from './checklist'
import { StatusActions } from './status-actions'
import { Documents } from './documents'
import { Notes } from './notes'

export default async function ProblemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: problem } = await supabase.from('problems').select('*').eq('id', id).eq('user_id', user.id).single()
  if (!problem) notFound()
  const [{ data: actions }, { data: history }, { data: documents }, { data: notes }] = await Promise.all([
    supabase.from('action_items').select('id,title,description,completed,position').eq('problem_id', id).eq('user_id', user.id).order('position'),
    supabase.from('problem_history').select('id,event_type,created_at').eq('problem_id', id).eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('documents').select('id,file_name,mime_type,size_bytes,created_at,ai_analysis,analysis_status,analyzed_at').eq('problem_id', id).eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('notes').select('id,content,created_at').eq('problem_id', id).eq('user_id', user.id).order('created_at', { ascending: false }),
  ])
  const analysis = (problem.ai_analysis || {}) as Record<string, any>

  return (
    <main className="container">
      <nav className="nav"><Link href="/problems" className="muted">← Mes problèmes</Link><Link href="/problems/new" className="button">+ Nouveau</Link></nav>
      <section className="dashboard-head"><span className="badge">Plan FixIt</span><h1>{problem.title}</h1><p className="muted">{problem.description}</p><div className="problem-meta"><span className={`priority priority-${problem.priority}`}>{problem.priority}</span><span>{problem.status}</span></div><StatusActions id={id} status={problem.status} /></section>
      {analysis.summary && <section className="card"><h2>Résumé</h2><p>{analysis.summary}</p></section>}
      <section className="card detail-section"><h2>Plan d’action</h2><Checklist items={actions || []} /></section>
      <section className="card detail-section"><h2>Notes</h2><Notes problemId={id} initialNotes={notes || []} /></section>
      <section className="card detail-section"><h2>Documents & analyse IA</h2><Documents problemId={id} initialDocuments={documents || []} /></section>
      {(analysis.warnings?.length || analysis.documents_to_keep?.length || analysis.required_information?.length) ? <section className="grid detail-grid">
        {analysis.warnings?.length ? <article className="card"><h2>⚠️ À surveiller</h2><ul>{analysis.warnings.map((x: string) => <li key={x}>{x}</li>)}</ul></article> : null}
        {analysis.documents_to_keep?.length ? <article className="card"><h2>📄 Documents recommandés</h2><ul>{analysis.documents_to_keep.map((x: string) => <li key={x}>{x}</li>)}</ul></article> : null}
        {analysis.required_information?.length ? <article className="card"><h2>ℹ️ Informations</h2><ul>{analysis.required_information.map((x: string) => <li key={x}>{x}</li>)}</ul></article> : null}
      </section> : null}
      <section className="card"><h2>Historique</h2>{history?.length ? <ul className="history-list">{history.map(item => <li key={item.id}><strong>{item.event_type.replaceAll('_', ' ')}</strong><span className="muted">{new Date(item.created_at).toLocaleString('fr-CA')}</span></li>)}</ul> : <p className="muted">Aucun événement.</p>}</section>
      <section className="card"><h2>Questions à clarifier</h2>{analysis.questions?.length ? <ul>{analysis.questions.map((x: string) => <li key={x}>{x}</li>)}</ul> : <p className="muted">Aucune question supplémentaire.</p>}</section>
      <p className="muted detail-disclaimer">FixIt fournit de l’information générale et une aide à l’organisation. Pour une situation médicale, juridique ou financière importante, confirme les informations auprès d’un professionnel qualifié.</p>
    </main>
  )
}
