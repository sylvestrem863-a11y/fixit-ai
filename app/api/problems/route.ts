import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { analyzeProblem } from '@/lib/ai/analyze'

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
    const { analysis, mode, model } = await analyzeProblem(body.description, body.category)

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

    const actions = analysis.recommended_actions.map((item, index) => ({
      problem_id: problem.id, user_id: user.id, title: item.title,
      description: item.description, position: index, completed: false,
    }))
    const checklist = analysis.checklist.map((item, index) => ({
      problem_id: problem.id, user_id: user.id, title: item.title,
      description: item.description, position: index + actions.length, completed: item.completed,
    }))
    const allItems = [...actions, ...checklist]
    if (allItems.length) {
      const { error: actionError } = await supabase.from('action_items').insert(allItems)
      if (actionError) return NextResponse.json({ error: actionError.message }, { status: 500 })
    }

    await supabase.from('problem_history').insert({
      problem_id: problem.id, user_id: user.id, event_type: 'created', metadata: { source: mode },
    })
    await supabase.from('ai_generations').insert({
      user_id: user.id, problem_id: problem.id, model, prompt_version: 'v2', result: analysis,
    })

    return NextResponse.json({ id: problem.id, mode })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur inattendue.' }, { status: 400 })
  }
}
