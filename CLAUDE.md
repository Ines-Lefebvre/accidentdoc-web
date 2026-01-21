# AccidentDoc v2 - Contexte

## Objectif
Application de generation de lettres de reserves AT/MP (69 EUR vs 150 EUR avocat)

## Stack
- Frontend : Next.js
- Backend : n8n (https://n8n.srv833062.hstgr.cloud)
- DB : Supabase
- Paiement : Stripe

## Workflows n8n
- WF3 Vocal : /webhook-test/wf3-vocal (audio + texte) - ID: ajl13NLiA9KStJ9eEu9Ex
- WF4 Validation avocat
- WF5 Checkout : ID Q38YOiyVTlhdvxjM7Dssh
- WF6 Stripe webhook
- OCR Mistral + AI Extraction : /webhook/upload - ID: nVssYwN1ZQp0nw97

---

## Etat du projet - 21 janvier 2026

### Flux metier valide

| Workflow | Status | Notes |
|----------|--------|-------|
| WF1 Upload/OCR | OK | Extraction DAT via Mistral |
| WF2 Generation lettre | OK | Claude AI |
| WF3 Vocal | OK | Dicaphone + transcription |
| WF4 Validation avocat | A REVOIR | UI admin fonctionnelle |
| WF5 Checkout | MODIFIE | JSON local pret, a importer |
| WF6 Stripe Webhook | OK | V3 avec dossier_id |

### Architecture persistance Supabase

**Table `dossiers`** - Schema :
```
id (UUID, PK)
request_id (TEXT, UNIQUE)
customer_email (TEXT)
letter_text (TEXT)
status (TEXT) - valeurs: pending_payment, paid, letter_generated, email_sent
document_type (TEXT) - standard ou premium
victime_nom, accident_date (TEXT, nullable)
validated_fields (JSONB)
created_at, updated_at (TIMESTAMP)
```

**Flux de donnees** :
1. WF5 : INSERT dossier avec status='pending_payment' AVANT Stripe
2. Stripe : metadata contient seulement `dossier_id` (UUID)
3. WF6 : UPDATE dossier par `id` avec status='paid' puis 'letter_generated'

### Buckets Storage Supabase

| Bucket | Usage |
|--------|-------|
| uploads | Documents DAT originaux |
| generated-letters | PDF lettres signees |

### Points resolus cette session

- [x] WF5 : Remplacement node Supabase par Postgres (upsert natif)
- [x] WF5 : Simplification metadata Stripe (dossier_id seulement)
- [x] WF6 : Utilisation dossier_id pour UPDATE au lieu de request_id
- [x] Correction valeurs status coherentes (pending_payment, paid, letter_generated, email_sent)

### TODO

- [ ] Importer WF5-Checkout-Standard.json dans n8n production
- [ ] Importer WF6-Stripe-Webhook-Unified-V3-NO-AUTO-EMAIL.json dans n8n
- [ ] Tester flux complet : paiement -> webhook -> generation
- [ ] Verifier affichage admin des nouveaux dossiers

---

## Notes de session historiques

### 21/01/2026 - Matin
- Creation projet v2 avec bonnes pratiques
- WF3 V5 : Support audio + texte (JSON deja dans n8n-workflows/)
- OCR V2 : Ajout validation document apres OCR
  - Detecte documents non-DAT (carte SNCF, factures, etc.)
  - Detecte plusieurs DAT dans un meme PDF
  - Fichier : n8n-workflows/OCR-Mistral-AI-Extraction-V2-WITH-VALIDATION.json
  - A IMPORTER dans n8n puis activer
- Frontend : Messages d'erreur explicites selon error_type
  - contracts/wf1-upload.ts : ajout types error_type + errorDetails
  - app/upload/page.tsx : switch sur error_type avec messages FR
- Fix build Vercel : restauration package.json (Next.js 14, Tailwind v3)
  - Probleme : merge git avait ecrase package.json avec version minimale
  - Correction erreurs TypeScript (verification extractedData optionnel)
  - app/analyse/page.tsx et app/brouillon/page.tsx corriges

### 21/01/2026 - Apres-midi
- Investigation WF5/WF6 via MCP n8n
- Decouverte node Supabase mal configure (operation "upsert" inexistante)
- Reecriture complete WF5 avec node Postgres et SQL INSERT ON CONFLICT
- Simplification metadata Stripe pour respecter limite 500 chars
