import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  description: z.string().min(10).max(12000),
  category: z.string().max(80).optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const body = schema.parse(await request.json())
    const aiResponse = await fetch(new URL('/api/ai/analyze', request.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') || '' },
      body: JSON.stringify(body),
    })
    const aiData = await aiResponse.json()
    if (!aiResponse.ok) return NextResponse.json(aiData, { status: aiResponse.status })

    const analysis = aiData.analysis
    const { data: problem, error } = await supabase.from('problems').insert({
      user_id: user.id,
      title: analysis.title,
      description: body.description,
      category: analysis.category || body.category || 'Autre',
      priority: analysis.priority,
      status: 'open',
      ai_analysis: analysis,
    }).select('id').single()
    if (error || !problem) return NextResponse.json({ error: error?.message || 'Création impossible.' }, { status: 500 })

    const actions = (analysis.recommended_actions || []).map((item: string, index: number) => ({ problem_id: problem.id, user_id: user.id, title: item, position: index, completed: false }))
    const checklist = (analysis.checklist || []).map((item: string, index: number) => ({ problem_id: problem.id, user_id: user.id, title: item, position: index + actions.length, completed: false }))
    if ([...actions, ...checklist].length) await supabase.from('action_items').insert([...actions, ...checklist])
    await supabase.from('problem_history').insert({ problem_id: problem.id, user_id: user.id, event_type: 'created', metadata: { source: aiData.mode || 'ai' } })
    await supabase.from('ai_generations').insert({ user_id: user.id, problem_id: problem.id, model: process.env.OPENAI_MODEL || 'gpt-5-mini', prompt_version: 'v1', result: analysis })

    return NextResponse.json({ id: problem.id })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur inattendue.' }, { status: 400 })
  }
}
