'use client'

import { useState } from 'react'

type Item = { id: string; title: string; description?: string | null; completed: boolean }

export function Checklist({ items }: { items: Item[] }) {
  const [state, setState] = useState(items)
  const [saving, setSaving] = useState<string | null>(null)

  async function toggle(item: Item) {
    const completed = !item.completed
    setSaving(item.id)
    setState(current => current.map(x => x.id === item.id ? { ...x, completed } : x))
    try {
      const response = await fetch(`/api/action-items/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed }) })
      if (!response.ok) throw new Error()
    } catch {
      setState(current => current.map(x => x.id === item.id ? { ...x, completed: item.completed } : x))
    } finally { setSaving(null) }
  }

  const done = state.filter(x => x.completed).length
  return <>
    <p className="muted">{done} / {state.length} actions complétées</p>
    <div className="action-list">{state.map(item => <label className={`action-item ${item.completed ? 'action-completed' : ''}`} key={item.id}>
      <input type="checkbox" checked={item.completed} disabled={saving === item.id} onChange={() => toggle(item)} />
      <div><strong>{item.title}</strong>{item.description && <p className="muted">{item.description}</p>}</div>
    </label>)}</div>
  </>
}
