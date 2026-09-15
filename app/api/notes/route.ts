import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({ problemId: z.string().uuid(), content: z.string().trim().min(1).max(5000) })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  try {
    const body = schema.parse(await request.json())
    const { data: problem } = await supabase.from('problems').select('id').eq('id', body.problemId).eq('user_id', user.id).single()
    if (!problem) return NextResponse.json({ error: 'Problème introuvable.' }, { status: 404 })
    const { data: note, error } = await supabase.from('notes').insert({ problem_id: body.problemId, user_id: user.id, content: body.content }).select('id,content,created_at').single()
    if (error || !note) return NextResponse.json({ error: error?.message || 'Impossible d’ajouter la note.' }, { status: 500 })
    await supabase.from('problem_history').insert({ problem_id: body.problemId, user_id: user.id, event_type: 'note_added', metadata: { note_id: note.id } })
    return NextResponse.json({ note })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Requête invalide.' }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  const id = new URL(request.url).searchParams.get('id')
  if (!id || !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'Note invalide.' }, { status: 400 })
  const { data: note } = await supabase.from('notes').select('id,problem_id').eq('id', id).eq('user_id', user.id).single()
  if (!note) return NextResponse.json({ error: 'Note introuvable.' }, { status: 404 })
  const { error } = await supabase.from('notes').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabase.from('problem_history').insert({ problem_id: note.problem_id, user_id: user.id, event_type: 'note_deleted', metadata: { note_id: id } })
  return NextResponse.json({ ok: true })
}
