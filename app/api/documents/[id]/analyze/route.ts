import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const documentAnalysisSchema = z.object({
  title: z.string(),
  summary: z.string(),
  document_type: z.string(),
  urgency: z.enum(['low', 'medium', 'high', 'urgent']),
  important_elements: z.array(z.string()).max(12),
  dates_deadlines: z.array(z.object({ date: z.string(), description: z.string(), importance: z.enum(['low', 'medium', 'high']) })).max(12),
  recommended_actions: z.array(z.object({ title: z.string(), description: z.string(), priority: z.enum(['low', 'medium', 'high', 'urgent']) })).max(10),
  checklist: z.array(z.string()).max(15),
  documents_to_keep: z.array(z.string()).max(10),
  missing_information: z.array(z.string()).max(10),
  warnings: z.array(z.string()).max(10),
  confidence: z.number().min(0).max(1),
})

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { data: document, error: documentError } = await supabase
    .from('documents')
    .select('id,problem_id,user_id,file_name,mime_type,size_bytes,storage_path,analysis_status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (documentError || !document) return NextResponse.json({ error: 'Document introuvable.' }, { status: 404 })
  if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(document.mime_type || '')) {
    return NextResponse.json({ error: 'Type de document non pris en charge.' }, { status: 400 })
  }
  if ((document.size_bytes || 0) > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Document trop volumineux.' }, { status: 400 })
  }

  const { data: locked } = await supabase
    .from('documents')
    .update({ analysis_status: 'processing' })
    .eq('id', id)
    .eq('user_id', user.id)
    .in('analysis_status', ['not_analyzed', 'failed'])
    .select('id')
    .maybeSingle()

  if (!locked) return NextResponse.json({ error: 'Analyse déjà en cours ou déjà terminée.' }, { status: 409 })

  const fail = async (message: string, status = 500) => {
    await supabase.from('documents').update({ analysis_status: 'failed' }).eq('id', id).eq('user_id', user.id)
    return NextResponse.json({ error: message }, { status })
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return fail('OPENAI_API_KEY n’est pas configurée.', 503)

    const { data: file, error: downloadError } = await supabase.storage.from('problem-documents').download(document.storage_path)
    if (downloadError || !file) return fail('Impossible de lire le document privé.', 500)

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${document.mime_type};base64,${base64}`
    const isImage = document.mime_type?.startsWith('image/')
    const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna'

    const content = [
      {
        type: 'input_text',
        text: `Analyse ce document pour aider l’utilisateur à comprendre quoi faire ensuite. Nom: ${document.file_name}. Retourne uniquement du JSON. Identifie les dates et échéances explicitement visibles, sans en inventer. Distingue les faits du document des interprétations. Pour les sujets juridiques, médicaux ou financiers, donne uniquement de l’information générale et recommande une vérification professionnelle lorsque nécessaire.`,
      },
      isImage
        ? { type: 'input_image', image_url: dataUrl, detail: 'high' }
        : { type: 'input_file', file_data: dataUrl, filename: document.file_name },
    ]

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        input: [{ role: 'user', content }],
        text: { format: { type: 'json_object' } },
      }),
    })

    if (!response.ok) return fail(`L’analyse IA a échoué (${response.status}).`, 502)
    const data = await response.json()
    let parsed: ReturnType<typeof documentAnalysisSchema.safeParse>
    try {
      parsed = documentAnalysisSchema.safeParse(JSON.parse(data.output_text || '{}'))
    } catch {
      parsed = { success: false, error: { issues: [] } } as any
    }
    if (!parsed.success) return fail('La réponse IA n’a pas le format attendu.', 502)

    const analysis = parsed.data
    const { error: saveError } = await supabase.from('documents').update({
      ai_analysis: analysis,
      analysis_status: 'completed',
      analyzed_at: new Date().toISOString(),
    }).eq('id', id).eq('user_id', user.id)
    if (saveError) return fail(saveError.message, 500)

    if (analysis.recommended_actions.length) {
      const { count } = await supabase.from('action_items').select('id', { count: 'exact', head: true }).eq('problem_id', document.problem_id).eq('user_id', user.id)
      const start = count || 0
      await supabase.from('action_items').insert(analysis.recommended_actions.map((action, index) => ({
        problem_id: document.problem_id,
        user_id: user.id,
        title: action.title,
        description: action.description,
        position: start + index,
        completed: false,
      })))
    }

    await supabase.from('problem_history').insert({
      problem_id: document.problem_id,
      user_id: user.id,
      event_type: 'document_analyzed',
      metadata: { document_id: document.id, file_name: document.file_name, model },
    })

    await supabase.from('ai_generations').insert({
      user_id: user.id,
      problem_id: document.problem_id,
      model,
      prompt_version: 'document-v1',
      result: analysis,
    })

    return NextResponse.json({ analysis, model })
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Erreur inattendue pendant l’analyse.')
  }
}
