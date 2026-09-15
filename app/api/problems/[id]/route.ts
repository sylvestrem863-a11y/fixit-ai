import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({ status: z.enum(['open', 'in_progress', 'resolved', 'archived']) })

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  try {
    const { status } = schema.parse(await request.json())
    const { data, error } = await supabase.from('problems').update({ status, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select('id,status').single()
    if (error || !data) return NextResponse.json({ error: error?.message || 'Problème introuvable.' }, { status: 404 })
    await supabase.from('problem_history').insert({ problem_id: id, user_id: user.id, event_type: `status_${status}`, metadata: { status } })
    return NextResponse.json({ problem: data })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Requête invalide.' }, { status: 400 }) }
}
