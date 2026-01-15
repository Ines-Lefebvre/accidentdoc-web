# Accident-Doc

Application web pour la génération de lettres de réserves AT/MP (Accidents du Travail / Maladies Professionnelles).

## Stack Technique

- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **Auth**: Supabase Auth
- **Base de données**: Supabase (PostgreSQL)
- **Paiement**: Stripe
- **Workflows**: n8n (OCR, analyse IA, génération)
- **Déploiement**: Vercel

## Structure du Projet

```
accidentdoc-web/
├── app/
│   ├── page.tsx              # Landing page
│   ├── upload/               # Étape 1: Upload CERFA
│   ├── analyse/              # Étape 2: Résultat + vocal
│   ├── brouillon/            # Étape 3: Preview lettre
│   ├── paiement/             # Étape 4: Stripe
│   ├── confirmation/         # Confirmation
│   └── avocate/              # Back-office avocate
├── components/
│   ├── ui/                   # Composants shadcn/ui
│   ├── app/                  # Composants métier client
│   └── avocate/              # Composants back-office
├── lib/
│   ├── supabase/             # Clients Supabase
│   ├── n8n.ts                # API workflows
│   └── utils.ts              # Utilitaires
├── hooks/                    # React hooks personnalisés
└── types/                    # Types TypeScript
```

## Workflows n8n

| Workflow | Endpoint | Description |
|----------|----------|-------------|
| WF1 - OCR | `POST /webhook/upload` | Upload + extraction CERFA |
| WF3 - Vocal | `POST /webhook/wf3-vocal` | Analyse vocale + détection cas graves |
| WF4a - Lettre | `POST /webhook/generate-letter` | Génération lettre de réserves |
| WF4b - Validation | `GET /webhook/validate-letter` | Validation avocat + envoi |

## Installation

```bash
# Cloner le repo
git clone https://github.com/[username]/accidentdoc-web.git
cd accidentdoc-web

# Installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.example .env.local

# Lancer en développement
npm run dev
```

## Variables d'Environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# n8n
NEXT_PUBLIC_N8N_BASE_URL=https://n8n.srv833062.hstgr.cloud

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=
```

## Tarification

- **Cas standard**: 69€ HT (lettre de réserves)
- **Cas grave**: 150€ HT (RDV avocat)

## Licence

Propriétaire - Tous droits réservés
