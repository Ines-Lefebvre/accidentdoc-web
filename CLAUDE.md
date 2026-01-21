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
- WF5 Checkout
- WF6 Stripe webhook
- OCR Mistral + AI Extraction : /webhook/upload - ID: nVssYwN1ZQp0nw97

## En cours
- [x] Modifier WF3 pour accepter texte ET audio (FAIT - V5 prêt)
- [x] Ajouter validation document OCR (FAIT - V2 prêt à importer)
- [x] Messages d'erreur explicites sur page upload (FAIT)

## Notes de session
### 21/01/2026
- Creation projet v2 avec bonnes pratiques
- WF3 V5 : Support audio + texte (JSON déjà dans n8n-workflows/)
- OCR V2 : Ajout validation document après OCR
  - Détecte documents non-DAT (carte SNCF, factures, etc.)
  - Détecte plusieurs DAT dans un même PDF
  - Fichier : n8n-workflows/OCR-Mistral-AI-Extraction-V2-WITH-VALIDATION.json
  - À IMPORTER dans n8n puis activer
- Frontend : Messages d'erreur explicites selon error_type
  - contracts/wf1-upload.ts : ajout types error_type + errorDetails
  - app/upload/page.tsx : switch sur error_type avec messages FR
- Fix build Vercel : restauration package.json (Next.js 14, Tailwind v3)
  - Problème : merge git avait écrasé package.json avec version minimale
  - Correction erreurs TypeScript (vérification extractedData optionnel)
  - app/analyse/page.tsx et app/brouillon/page.tsx corrigés
