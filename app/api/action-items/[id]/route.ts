import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({ completed: z.boolean() })

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  try {
    const { completed } = schema.parse(await request.json())
    const { data, error } = await supabase.from('action_items').update({ completed }).eq('id', id).eq('user_id', user.id).select('id,completed,problem_id').single()
    if (error || !data) return NextResponse.json({ error: error?.message || 'Action introuvable.' }, { status: 404 })
    await supabase.from('problem_history').insert({ problem_id: data.problem_id, user_id: user.id, event_type: completed ? 'action_completed' : 'action_reopened', metadata: { action_id: id } })
    return NextResponse.json({ action: data })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Requête invalide.' }, { status: 400 }) }
}
