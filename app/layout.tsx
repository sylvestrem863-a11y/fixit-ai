import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FixIt — Sache quoi faire maintenant',
  description: 'Transforme un problème du quotidien en plan d’action clair et personnalisé.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
