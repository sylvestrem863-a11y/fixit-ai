'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type DocumentAnalysis = { title: string; summary: string; document_type: string; urgency: string; important_elements: string[]; dates_deadlines: { date: string; description: string; importance: string }[]; recommended_actions: { title: string; description: string; priority: string }[]; checklist: string[]; documents_to_keep: string[]; missing_information: string[]; warnings: string[]; confidence: number }
type DocumentItem = { id: string; file_name: string; mime_type: string | null; size_bytes: number | null; created_at: string; ai_analysis?: DocumentAnalysis | null; analysis_status?: string; analyzed_at?: string | null }

export function Documents({ problemId, initialDocuments }: { problemId: string; initialDocuments: DocumentItem[] }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [documents, setDocuments] = useState(initialDocuments)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  async function upload(file?: File) {
    if (!file) return
    setLoading(true); setMessage('')
    const form = new FormData(); form.append('problemId', problemId); form.append('file', file)
    try {
      const response = await fetch('/api/documents', { method: 'POST', body: form })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Upload impossible')
      setDocuments(current => [data.document, ...current]); router.refresh()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Upload impossible.') }
    finally { setLoading(false); if (inputRef.current) inputRef.current.value = '' }
  }

  async function analyze(id: string) {
    setAnalyzing(id); setMessage('')
    try {
      const response = await fetch(`/api/documents/${id}/analyze`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Analyse impossible')
      setDocuments(current => current.map(doc => doc.id === id ? { ...doc, ai_analysis: data.analysis, analysis_status: 'completed', analyzed_at: new Date().toISOString() } : doc))
      router.refresh()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Analyse impossible.') }
    finally { setAnalyzing(null) }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce document ?')) return
    const response = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    if (response.ok) setDocuments(current => current.filter(x => x.id !== id))
    else setMessage((await response.json()).error || 'Suppression impossible.')
  }

  const size = (bytes: number | null) => bytes == null ? '' : `${(bytes / 1024 / 1024).toFixed(1)} Mo`
  return <div className="documents-box">
    <input ref={inputRef} hidden type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e => upload(e.target.files?.[0])} />
    <button className="button secondary" disabled={loading} onClick={() => inputRef.current?.click()}>{loading ? 'Téléversement…' : '+ Ajouter un document'}</button>
    <p className="muted">PDF, JPG, PNG ou WEBP · maximum 10 Mo · stockage privé</p>
    {message && <p className="error-text">{message}</p>}
    {documents.length > 0 && <div className="document-list">{documents.map(doc => <div className="document-row" key={doc.id}>
      <div className="document-main"><strong>{doc.file_name}</strong><span className="muted">{size(doc.size_bytes)}</span>
        {doc.ai_analysis && <div className="document-analysis"><h3>{doc.ai_analysis.title}</h3><p>{doc.ai_analysis.summary}</p><div className="problem-meta"><span className={`priority priority-${doc.ai_analysis.urgency}`}>{doc.ai_analysis.urgency}</span><span>{doc.ai_analysis.document_type}</span></div>
          {doc.ai_analysis.dates_deadlines.length > 0 && <><h4>📅 Dates et échéances</h4><ul>{doc.ai_analysis.dates_deadlines.map((x, i) => <li key={`${x.date}-${i}`}><strong>{x.date}</strong> — {x.description}</li>)}</ul></>}
          {doc.ai_analysis.important_elements.length > 0 && <><h4>🔎 Éléments importants</h4><ul>{doc.ai_analysis.important_elements.map(x => <li key={x}>{x}</li>)}</ul></>}
          {doc.ai_analysis.recommended_actions.length > 0 && <><h4>➡️ Actions recommandées</h4><ul>{doc.ai_analysis.recommended_actions.map(x => <li key={x.title}><strong>{x.title}</strong> — {x.description}</li>)}</ul></>}
          {doc.ai_analysis.checklist.length > 0 && <><h4>☑️ Checklist</h4><ul>{doc.ai_analysis.checklist.map(x => <li key={x}>{x}</li>)}</ul></>}
          {doc.ai_analysis.warnings.length > 0 && <><h4>⚠️ À surveiller</h4><ul>{doc.ai_analysis.warnings.map(x => <li key={x}>{x}</li>)}</ul></>}
          {doc.ai_analysis.missing_information.length > 0 && <><h4>ℹ️ Informations manquantes</h4><ul>{doc.ai_analysis.missing_information.map(x => <li key={x}>{x}</li>)}</ul></>}
        </div>}
      </div>
      <div className="document-actions"><a className="text-button" href={`/api/documents/${doc.id}/download`} target="_blank" rel="noreferrer">Ouvrir</a><button className="text-button" disabled={analyzing === doc.id} onClick={() => analyze(doc.id)}>{analyzing === doc.id ? 'Analyse…' : doc.ai_analysis ? 'Réanalyser' : '✨ Analyser avec l’IA'}</button><button className="text-button" onClick={() => remove(doc.id)}>Supprimer</button></div>
    </div>)}</div>}
  </div>
}
