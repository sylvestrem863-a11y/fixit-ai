import { NextResponse } from 'next/server'
import { analysisRequestSchema, analyzeProblem } from '@/lib/ai/analyze'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const body = analysisRequestSchema.parse(await request.json())
    const { analysis, mode, model } = await analyzeProblem(body.description, body.category)

    return NextResponse.json({ analysis, mode, model })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Impossible d’analyser cette situation.' }, { status: 400 })
  }
}
