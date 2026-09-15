import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { data: document, error } = await supabase
    .from('documents')
    .select('id,file_name,storage_path,mime_type')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !document) return NextResponse.json({ error: 'Document introuvable.' }, { status: 404 })

  const { data, error: signError } = await supabase.storage
    .from('problem-documents')
    .createSignedUrl(document.storage_path, 60, { download: document.file_name })

  if (signError || !data?.signedUrl) {
    return NextResponse.json({ error: signError?.message || 'Impossible de créer le lien.' }, { status: 500 })
  }

  return NextResponse.redirect(data.signedUrl)
}
