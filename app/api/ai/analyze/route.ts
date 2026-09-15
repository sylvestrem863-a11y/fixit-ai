import { NextResponse } from 'next/server'
import { z } from 'zod'

const requestSchema = z.object({ description: z.string().min(10).max(12000), category: z.string().max(80).optional() })
const actionSchema = z.object({ title: z.string(), description: z.string(), priority: z.string() })
const checklistSchema = z.object({ title: z.string(), description: z.string(), completed: z.boolean() })
const resultSchema = z.object({
  title: z.string(), summary: z.string(), category: z.string(), priority: z.enum(['low','medium','high','urgent']),
  problem_type: z.string(), confidence: z.number().min(0).max(1),
  recommended_actions: z.array(actionSchema).max(10), checklist: z.array(checklistSchema).max(15),
  required_information: z.array(z.string()).max(10), documents_to_keep: z.array(z.string()).max(10),
  warnings: z.array(z.string()).max(10), questions: z.array(z.string()).max(10),
})

const fallback = (description: string, category = 'Autre') => ({
  title: 'Problème à clarifier', summary: description.slice(0, 500), category, priority: 'medium' as const,
  problem_type: 'situation_du_quotidien', confidence: 0.35,
  recommended_actions: [
    { title: 'Rassembler les informations', description: 'Réunis les faits, dates et communications disponibles.', priority: 'medium' },
    { title: 'Identifier les délais', description: 'Note toute échéance ou date limite.', priority: 'high' },
    { title: 'Vérifier les documents', description: 'Conserve les documents liés à la situation.', priority: 'medium' },
  ],
  checklist: [
    { title: 'Noter les faits importants', description: '', completed: false },
    { title: 'Conserver les preuves', description: '', completed: false },
    { title: 'Définir la prochaine action', description: '', completed: false },
  ],
  required_information: ['Dates importantes', 'Personnes ou organismes concernés'],
  documents_to_keep: ['Courriels, lettres, factures ou reçus pertinents'], warnings: [],
  questions: ['Quelle est l’échéance la plus proche ?', 'Quel résultat souhaites-tu obtenir ?'],
})

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json())
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json(fallback(body.description, body.category))

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
        input: [
          { role: 'system', content: 'Tu es FixIt, assistant d’organisation. Transforme une situation quotidienne en plan d’action prudent et concret. Ne remplace jamais un professionnel. En cas d’urgence dangereuse, recommande les services appropriés. Retourne uniquement le JSON demandé.' },
          { role: 'user', content: `Catégorie: ${body.category || 'non précisée'}\nSituation:\n${body.description}` },
        ],
        text: { format: { type: 'json_object' } },
      }),
    })
    if (!response.ok) return NextResponse.json(fallback(body.description, body.category))
    const data = await response.json()
    return NextResponse.json(resultSchema.parse(JSON.parse(data.output_text)))
  } catch {
    return NextResponse.json({ error: 'Impossible d’analyser cette situation.' }, { status: 400 })
  }
}
