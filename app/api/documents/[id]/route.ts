import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { data: document } = await supabase.from('documents').select('id,problem_id,storage_path,file_name').eq('id', id).eq('user_id', user.id).single()
  if (!document) return NextResponse.json({ error: 'Document introuvable.' }, { status: 404 })
  const { error: storageError } = await supabase.storage.from('problem-documents').remove([document.storage_path])
  if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 })
  const { error } = await supabase.from('documents').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabase.from('problem_history').insert({ problem_id: document.problem_id, user_id: user.id, event_type: 'document_deleted', metadata: { document_id: id, file_name: document.file_name } })
  return NextResponse.json({ success: true })
}
