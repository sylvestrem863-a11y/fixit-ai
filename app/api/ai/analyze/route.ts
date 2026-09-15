import { NextResponse } from 'next/server'
import { z } from 'zod'

const requestSchema = z.object({
  description: z.string().min(10).max(12000),
  category: z.string().max(80).optional(),
})

const resultSchema = z.object({
  title: z.string(),
  summary: z.string(),
  category: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  problem_type: z.string(),
  confidence: z.number().min(0).max(1),
  recommended_actions: z.array(z.string()).max(10),
  checklist: z.array(z.string()).max(15),
  required_information: z.array(z.string()).max(10),
  documents_to_keep: z.array(z.string()).max(10),
  warnings: z.array(z.string()).max(10),
  questions: z.array(z.string()).max(10),
})

const fallback = (description: string, category = 'Autre') => ({
  title: 'Problème à clarifier',
  summary: description.slice(0, 500),
  category,
  priority: 'medium' as const,
  problem_type: 'situation_du_quotidien',
  confidence: 0.35,
  recommended_actions: ['Rassembler les informations disponibles.', 'Identifier les délais ou échéances.', 'Vérifier les documents liés à la situation.'],
  checklist: ['Noter les faits importants.', 'Conserver les preuves et communications.', 'Définir la prochaine action concrète.'],
  required_information: ['Dates importantes', 'Personnes ou organismes concernés'],
  documents_to_keep: ['Courriels, lettres, factures ou reçus pertinents'],
  warnings: [],
  questions: ['Quelle est l’échéance la plus proche ?', 'Quel résultat souhaites-tu obtenir ?'],
})

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json())
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ analysis: fallback(body.description, body.category), mode: 'fallback' })
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5-mini',
        input: [
          {
            role: 'system',
            content: `Tu es FixIt, un assistant d’organisation. Transforme une situation quotidienne en plan d’action prudent et concret. Ne prétends pas remplacer un avocat, médecin, comptable ou autre professionnel. Pour une urgence dangereuse, indique de contacter immédiatement les services appropriés. Réponds uniquement avec un objet JSON valide contenant exactement: title, summary, category, priority, problem_type, confidence, recommended_actions, checklist, required_information, documents_to_keep, warnings, questions. confidence doit être entre 0 et 1.`,
          },
          { role: 'user', content: `Catégorie: ${body.category || 'non précisée'}\n\nSituation:\n${body.description}` },
        ],
        text: { format: { type: 'json_object' } },
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ analysis: fallback(body.description, body.category), mode: 'fallback' })
    }

    const data = await response.json()
    const text = data.output_text
    const parsed = resultSchema.parse(JSON.parse(text))
    return NextResponse.json({ analysis: parsed, mode: 'ai' })
  } catch {
    return NextResponse.json({ error: 'Impossible d’analyser cette situation.' }, { status: 400 })
  }
}
