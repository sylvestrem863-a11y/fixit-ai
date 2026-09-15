import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({ full_name: z.string().trim().max(120) })

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const { full_name } = schema.parse(await request.json())
    const { data, error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name,
      updated_at: new Date().toISOString(),
    }).select('id,full_name,avatar_url').single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ profile: data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Mise à jour impossible.' }, { status: 400 })
  }
}
