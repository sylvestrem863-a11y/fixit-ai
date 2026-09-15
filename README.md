# FixIt AI

FixIt transforme un problème du quotidien en plan d’action clair, priorisé et personnalisable.

## Stack
- Next.js App Router + TypeScript
- Supabase Auth + PostgreSQL + Storage
- Vercel
- OpenAI pour l’analyse IA

## Développement local

```bash
npm install
npm run dev
```

Créer `.env.local` à partir de `.env.example` :

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
```

## Structure
- `/` landing page
- `/login` connexion
- `/register` inscription
- `/dashboard` tableau de bord
- `/problems/new` création d’un problème
- `supabase/migrations/0001_initial.sql` schéma PostgreSQL + RLS

## Sécurité
Les données métier sont liées à `auth.users` et les tables utilisent Row Level Security. Les clés secrètes ne doivent jamais être exposées côté client.

## Déploiement
Le dépôt GitHub est prêt à être connecté à Vercel. Les variables d’environnement doivent être configurées dans Vercel avant l’activation des fonctions Supabase et IA.
