import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  description: z.string().min(10).max(10000),
  category: z.string().max(80).optional().default(''),
})

const analysisSchema = z.object({
  title: z.string(), summary: z.string(), category: z.string(),
  priority: z.enum(['low','medium','high','urgent']), problem_type: z.string(),
  confidence: z.number().min(0).max(1),
  recommended_actions: z.array(z.object({ title: z.string(), description: z.string(), priority: z.string() })),
  checklist: z.array(z.object({ title: z.string(), description: z.string(), completed: z.boolean() })),
  required_information: z.array(z.string()), documents_to_keep: z.array(z.string()),
  warnings: z.array(z.string()), questions: z.array(z.string()),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Description invalide.' }, { status: 400 })

  const { description, category } = parsed.data
  let analysis: z.infer<typeof analysisSchema>

  const aiResponse = await fetch(new URL('/api/ai/analyze', request.url), {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ description, category }),
  })
  const aiJson = await aiResponse.json().catch(() => null)
  if (!aiResponse.ok) return NextResponse.json({ error: aiJson?.error || 'Analyse IA impossible.' }, { status: 502 })
  const checked = analysisSchema.safeParse(aiJson)
  if (!checked.success) return NextResponse.json({ error: 'Réponse IA invalide.' }, { status: 502 })
  analysis = checked.data

  const { data: problem, error } = await supabase.from('problems').insert({
    user_id: user.id, title: analysis.title, description, category: category || analysis.category,
    priority: analysis.priority, ai_analysis: analysis,
  }).select('id').single()
  if (error || !problem) return NextResponse.json({ error: error?.message || 'Création impossible.' }, { status: 500 })

  const actions = [...analysis.recommended_actions.map((a, i) => ({ problem_id: problem.id, user_id: user.id, title: a.title, description: a.description, position: i })), ...analysis.checklist.map((a, i) => ({ problem_id: problem.id, user_id: user.id, title: a.title, description: a.description, position: analysis.recommended_actions.length + i, completed: a.completed }))]
  if (actions.length) await supabase.from('action_items').insert(actions)
  await supabase.from('problem_history').insert({ problem_id: problem.id, user_id: user.id, event_type: 'created', metadata: { source: 'ai_analysis' } })
  await supabase.from('ai_generations').insert({ user_id: user.id, problem_id: problem.id, model: 'gpt-5.6-luna', prompt_version: 'v1', result: analysis })

  return NextResponse.json({ id: problem.id, analysis })
}
