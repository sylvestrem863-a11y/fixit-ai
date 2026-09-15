import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const MAX_SIZE = 10 * 1024 * 1024
const allowed = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
const schema = z.object({ problemId: z.string().uuid() })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  try {
    const form = await request.formData()
    const parsed = schema.safeParse({ problemId: form.get('problemId') })
    const file = form.get('file')
    if (!parsed.success || !(file instanceof File)) return NextResponse.json({ error: 'Fichier ou problème invalide.' }, { status: 400 })
    if (file.size <= 0 || file.size > MAX_SIZE) return NextResponse.json({ error: 'Le fichier doit faire au maximum 10 Mo.' }, { status: 400 })
    if (!allowed.has(file.type)) return NextResponse.json({ error: 'Format accepté : PDF, JPG, PNG ou WEBP.' }, { status: 400 })

    const { data: problem } = await supabase.from('problems').select('id').eq('id', parsed.data.problemId).eq('user_id', user.id).single()
    if (!problem) return NextResponse.json({ error: 'Problème introuvable.' }, { status: 404 })

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120)
    const path = `${user.id}/${problem.id}/${crypto.randomUUID()}-${safeName}`
    const { error: uploadError } = await supabase.storage.from('problem-documents').upload(path, file, { contentType: file.type, upsert: false })
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: document, error } = await supabase.from('documents').insert({ problem_id: problem.id, user_id: user.id, file_name: file.name, storage_path: path, mime_type: file.type, size_bytes: file.size }).select('id,file_name,mime_type,size_bytes,created_at').single()
    if (error) {
      await supabase.storage.from('problem-documents').remove([path])
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    await supabase.from('problem_history').insert({ problem_id: problem.id, user_id: user.id, event_type: 'document_added', metadata: { document_id: document.id, file_name: file.name } })
    return NextResponse.json({ document })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload impossible.' }, { status: 400 }) }
}
