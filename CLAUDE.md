# AccidentDoc v2 - Contexte

## Objectif
Application de generation de lettres de reserves AT/MP (69 EUR vs 150 EUR avocat)

## Stack
- Frontend : Next.js
- Backend : n8n (https://n8n.srv833062.hstgr.cloud)
- DB : Supabase
- Paiement : Stripe

## Workflows n8n
- WF1 OCR : /webhook/upload - ID: 4INMnhzzJ30oxo_NNLzR3
- WF3 Vocal : /webhook-test/wf3-vocal - ID: ajl13NLiA9KStJ9eEu9Ex
- WF4A Generation Lettre : /webhook/generate-letter - ID: NjHy13dXIRLpBkKvKI4Lv
- WF5 Checkout : /webhook/checkout-standard - ID: IjZAUrEhKwUHlJNS3F02Q
- WF6 Stripe Webhook : /webhook/stripe-events - ID: polLyDtI5hFtCa9hg1rQV

---

## Etat du projet - 22 janvier 2026

### Flux metier valide

| Workflow | Status | Notes |
|----------|--------|-------|
| WF1 Upload/OCR | OK | Extraction DAT via Mistral |
| WF2 Generation lettre | OK | Claude AI |
| WF3 Vocal | OK | Dicaphone + transcription |
| WF4 Validation avocat | OK | API Next.js + Resend (Sprint 5) |
| WF5 Checkout | OK | UPDATE status='pending_payment' (Sprint 4) |
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
1. WF4A : UPSERT dossier avec status='draft' lors de la génération de lettre
2. WF5 : UPDATE dossier avec status='pending_payment' avant Stripe
3. Stripe : metadata contient `dossier_id`, `request_id`, `customer_email`, `type`
4. WF6 : UPDATE dossier par `request_id` avec status='letter_generated'

### Buckets Storage Supabase

| Bucket | Usage |
|--------|-------|
| cerfa-documents | Documents DAT originaux (chemin: `pending/{uuid}.{ext}`) |
| generated-letters | PDF lettres signees |

---

## Architecture Données - SPRINT 2 (22 janvier 2026)

### Flux d'Ingestion OCR (Tables réelles)

Le flux d'entrée utilise un modèle en **deux temps** avant `dossiers` :

**Table `uploads`** (Tracking initial - WF1)
```
request_id (TEXT) - Clé de liaison unique
original_filename (TEXT)
file_size (INTEGER)
mime_type (TEXT)
upload_status (TEXT) - 'pending' → Point clé pour purge
created_at (TIMESTAMP)
```

**Table `ocr_results`** (Données extraites - WF1)
```
id (UUID, PK)
upload_id (UUID, FK)
user_id (UUID)
request_id (TEXT) - Lien vers uploads
document_type (TEXT) - AT_INTERIM, AT_normale, MALADIE_PROFESSIONNELLE
extracted_fields (JSONB) - Données OCR structurées
extraction_model (TEXT) - gemini-2.0-flash
extraction_status (TEXT) - success/failed
ocr_confidence (NUMERIC)
created_at (TIMESTAMP)
```

### Structure JSON `extracted_fields` (ocr_results)

```json
{
  "employeur": {
    "nom_raison_sociale": "...",
    "siret": "...",
    "adresse": "..."
  },
  "victime": {
    "nom": "...",
    "prenom": "...",
    "numero_secu": "...",
    "date_naissance": "...",
    "adresse": "...",
    "profession": "..."
  },
  "accident": {
    "date": "...",
    "heure": "...",
    "lieu": "...",
    "activite_victime": "...",
    "nature_accident": "...",
    "siege_lesions": "...",
    "nature_lesions": "..."
  },
  "temoin": { "nom": "..." },
  "tiers": { ... },
  "interim": { ... }  // Si AT intérim
}
```

### Propagation du `request_id`

```
[Upload Webhook]
    ↓ Init Tracking: génère `req_{timestamp}_{random}`
    ↓
[Save to Uploads] → INSERT dans `uploads`
    ↓
[OCR + IA Extraction]
    ↓
[Save OCR Results] → INSERT dans `ocr_results` avec même request_id
    ↓
[Build Front Response] → Retourne JSON au front avec `requestId`
    ↓
[sessionStorage] → Front stocke données pour page suivante
```

### Point de Liaison WF4A (Génération Lettre)

**CRITIQUE : WF4A ne lit PAS depuis `ocr_results`**

Le front-end (`/brouillon`) :
1. Récupère les données depuis `sessionStorage` (stockées par WF1)
2. Appelle WF4A via POST `/webhook/generate-letter` avec `validated_fields`
3. WF4A génère la lettre et cherche dans table `validations` (pas ocr_results)
4. WF4A écrit dans `letters` et met à jour `dossiers`

**Tables WF4A :**
- `validations` - SELECT par request_id pour récupérer validation_id
- `letters` - INSERT lettre générée
- `dossiers` - UPDATE avec letter_text et status='letter_generated'

### GAP IDENTIFIÉ

Le pont `ocr_results` → `dossiers` se fait via :
1. Front-end : données passent par sessionStorage (volatile)
2. WF5 Checkout : crée l'entrée dans `dossiers` avec `validated_fields`
3. WF4A : utilise table `validations` (non `ocr_results`)

**Risque** : Si l'utilisateur ferme le navigateur après OCR, les données sont perdues.

---

## État des Sprints

- [x] Sprint 1 : Validation Infra (bucket `cerfa-documents`, accès Postgres OK)
- [x] Sprint 2 : Pipeline Ingestion (JSON validé, request_id tracé, GAP identifié)
- [x] Sprint 3 : Logique Métier (UPSERT WF4A + Détection Cas Graves)
- [x] Sprint 4 : Ajustement WF5 (UPDATE au lieu d'INSERT) ✅
- [x] Sprint 5 : Finalisation Admin (Filtrage + Envoi Email) ✅
- [x] Sprint 6 : Inputs Page 2 + Cas Graves (user_notes envoyé, redirection Cal.com) ✅

---

## Corrections Sprint 3 (22 janvier 2026)

### 1. WF4A - UPSERT au lieu d'UPDATE ✅

**Problème résolu** : Le nœud "Update Dossier" faisait un UPDATE sur `dossiers` qui échouait car le dossier n'existait pas encore.

**Solution appliquée** : Transformation en UPSERT (INSERT ON CONFLICT)

```sql
INSERT INTO dossiers (request_id, letter_text, status, scenarios, validated_fields,
                      customer_email, victime_nom, accident_date, document_type, created_at, updated_at)
VALUES ($1, $2, 'draft', $3::jsonb, $4::jsonb, $5, $6, $7, $8, NOW(), NOW())
ON CONFLICT (request_id) DO UPDATE SET
  letter_text = EXCLUDED.letter_text,
  status = 'letter_generated',
  scenarios = EXCLUDED.scenarios,
  validated_fields = COALESCE(dossiers.validated_fields, EXCLUDED.validated_fields),
  updated_at = NOW()
RETURNING id, request_id, status
```

**Impact** : Le dossier est maintenant créé dès la génération de lettre (Page 3), pas au moment du paiement.

### 2. Détection Cas Graves ✅

**Nouveau nœud ajouté** : `Detect Cas Graves` + `Route Cas Graves`

**Mots-clés détectés** :
- meurtre, homicide, assassinat
- suicide, tentative de suicide, autolyse
- décès, mort, décédé, mortelle, fatal
- agression sexuelle, viol, harcèlement sexuel

**Comportement** : Si cas grave détecté → Arrêt immédiat + Réponse JSON :
```json
{
  "success": false,
  "status": "grave_case_detected",
  "action": "redirect_calcom",
  "reason": "grave_case",
  "detected_keywords": ["..."],
  "message": "Ce dossier nécessite un accompagnement personnalisé avec un avocat.",
  "calcom_url": "https://cal.com/accidentdoc/consultation"
}
```

### 3. Nouveau Flux WF4A

```
[Webhook Lettre]
    ↓
[Extract & Format]
    ↓
[Detect Cas Graves] ← NOUVEAU
    ↓
[Route Cas Graves] ← NOUVEAU
    ├─ CAS GRAVE → [Respond Cas Grave] → FIN (redirect Cal.com)
    └─ NORMAL → [Classifier IA] → [Writer IA] → [Parse Lettre]
                                                      ↓
                                              [Get Validation ID]
                                                      ↓
                                              [Save to Letters]
                                                      ↓
                                              [Update Dossier] ← UPSERT maintenant
                                                      ↓
                                              [Format Response] → [Réponse]
```

### 4. IMPORTANT - Impact sur WF5 (Sprint 4)

**Inversion de logique requise** :

| Avant Sprint 3 | Après Sprint 3 |
|----------------|----------------|
| WF4A : UPDATE (échouait) | WF4A : UPSERT (crée le dossier) |
| WF5 : INSERT (créait le dossier) | WF5 : **UPDATE** (doit mettre à jour) |

**Action requise Sprint 4** : Modifier WF5 pour faire UPDATE au lieu d'INSERT :
```sql
UPDATE dossiers SET
  status = 'pending_payment',
  customer_email = $2,
  -- autres champs paiement
WHERE request_id = $1
```

### Points resolus cette session

- [x] WF5 : Remplacement node Supabase par Postgres (upsert natif)
- [x] WF5 : Simplification metadata Stripe (dossier_id seulement)
- [x] WF6 : Utilisation dossier_id pour UPDATE au lieu de request_id
- [x] Correction valeurs status coherentes (pending_payment, paid, letter_generated, email_sent)

---

## Corrections Sprint 4 (22 janvier 2026)

### 1. WF5 - INSERT → UPDATE ✅

**Problème résolu** : WF5 faisait un INSERT ON CONFLICT alors que le dossier est maintenant créé par WF4A.

**Solution appliquée** : Transformation en UPDATE pur

**Node renommé** : `Insert Draft to Postgres` → `Update Dossier Status`

**Nouvelle requête SQL** :
```sql
UPDATE dossiers SET
  status = 'pending_payment',
  customer_email = '{{ $json.customer_email }}',
  updated_at = NOW()
WHERE request_id = '{{ $json.request_id }}'
RETURNING id, request_id, status
```

### 2. Metadata Stripe - État final ✅

Le metadata Stripe dans WF5 contient :
- `type` = 'standard'
- `dossier_id` = UUID du dossier (vient du RETURNING)
- `request_id` = ID de tracking
- `customer_email` = Email client

### 3. WF6 - Cohérence validée ✅

WF6 reçoit le webhook Stripe et :
1. Parse `metadata.request_id` et `metadata.type`
2. Pour type='standard' : UPDATE dossiers SET status='letter_generated'
3. WHERE clause utilise `request_id`

### 4. Flux de données complet - État final

```
[Front /brouillon]
    ↓ POST /webhook/generate-letter
[WF4A]
    ↓ UPSERT dossiers (status='draft')
    ↓
[Front /paiement]
    ↓ POST /webhook/checkout-standard
[WF5]
    ↓ UPDATE dossiers SET status='pending_payment'
    ↓ Crée session Stripe avec metadata={dossier_id, request_id, type}
    ↓
[Stripe Checkout]
    ↓ Client paie
    ↓
[Webhook Stripe]
    ↓ POST /webhook/stripe-events
[WF6]
    ↓ UPDATE dossiers SET status='letter_generated'
    ↓
[Admin /admin/dossiers]
    ↓ Avocate valide
[WF-Email] (futur)
    ↓ Envoi PDF au client
```

### 5. Valeurs de status - Cohérence

| Status | Créé par | Description |
|--------|----------|-------------|
| `draft` | WF4A | Lettre générée, pas encore payée |
| `pending_payment` | WF5 | Session Stripe créée |
| `letter_generated` | WF6 | Paiement reçu |
| `email_sent` | WF-Email | PDF envoyé au client |

### TODO

- [x] Tester flux complet : paiement -> webhook -> statut letter_generated
- [x] Verifier affichage admin des nouveaux dossiers
- [x] Implémenter WF-Email (envoi PDF après validation avocate)

---

## Corrections Sprint 5 (22 janvier 2026)

### 1. Filtrage Dashboard Admin ✅

**Problème résolu** : Le dashboard affichait TOUS les dossiers (y compris brouillons non payés).

**Solution appliquée** : Filtre SQL sur les status payés uniquement.

**Fichier modifié** : `app/admin/page.tsx`

```typescript
// AVANT : tous les dossiers
.select("*")

// APRÈS : uniquement les dossiers payés
.select("*")
.in("status", ["letter_generated", "lawyer_validated", "email_sent", "rdv_booked"])
```

### 2. Envoi Email - Architecture ✅

**Découverte importante** : L'envoi d'email ne passe PAS par n8n mais par l'API Next.js.

**Route** : `/api/admin/validate`

**Stack email** :
- **Resend** (SDK) pour l'envoi
- **pdf-lib** pour la génération du PDF avec signature
- Variable d'environnement : `RESEND_API_KEY`

**Flux validation avocat** :
```
[Admin clique "Valider et envoyer"]
    ↓
[POST /api/admin/validate]
    ↓
[Génération PDF avec pdf-lib]
    ↓
[Envoi email via Resend]
    ↓
[UPDATE dossiers SET status='email_sent']
```

### 3. Variables d'environnement ajoutées

**Fichier** : `.env.example`

```
# Email (Resend)
RESEND_API_KEY=re_xxx

# PDF Signature (optionnel)
SIGNATURE_URL=https://your-storage.com/signature-avocat.png
```

### 4. Flux complet - État final

```
[Client]
Upload DAT → OCR/IA → Validation données → Génération lettre
    ↓                                            ↓
                                         WF4A UPSERT (status='draft')
    ↓
Paiement Stripe → WF5 UPDATE (status='pending_payment')
    ↓
Webhook Stripe → WF6 UPDATE (status='letter_generated')
    ↓
[Avocat /admin]
Dashboard (filtre status payés) → Détail dossier → Modifier si besoin
    ↓
Bouton "Valider et envoyer" → /api/admin/validate
    ↓
Génération PDF + Envoi email Resend → UPDATE (status='email_sent')
    ↓
[Client reçoit l'email avec PDF]
```

### 5. Statuts complets

| Status | Créé par | Description |
|--------|----------|-------------|
| `draft` | WF4A | Lettre générée, pas encore payée |
| `pending_payment` | WF5 | Session Stripe créée |
| `letter_generated` | WF6 | Paiement reçu, visible dans admin |
| `lawyer_validated` | (réservé) | Validé mais pas encore envoyé |
| `email_sent` | API validate | PDF envoyé au client |
| `rdv_booked` | WF6 cas grave | RDV Cal.com confirmé |

---

## Corrections Sprint 6 (22 janvier 2026)

### 1. Inputs Page 2 non envoyés à WF4A ✅

**Problème résolu** : Les notes textuelles (Textarea) et les données vocales de la Page 2 (/analyse) n'étaient pas transmises au webhook WF4A (/webhook/generate-letter).

**Conséquences du bug** :
- Détection des cas graves impossible (mots-clés jamais reçus)
- Lettre non enrichie avec les préoccupations utilisateur

### 2. Solution appliquée

**Fichier `contracts/wf4-letter.ts`** :
- Ajout du champ `user_notes?: string` dans `Wf4LetterRequest`
- Ajout du type `Wf4GraveCaseResponse` pour la réponse cas grave

**Fichier `contracts/index.ts`** :
- Export de `Wf4GraveCaseResponse`

**Fichier `app/analyse/page.tsx` (Page 2)** :
- Stockage séparé de `user_notes` dans sessionStorage
```typescript
// Stocker les notes textuelles séparément (IMPORTANT pour WF4A)
if (textInput.trim()) {
  sessionStorage.setItem("accidentdoc_user_notes", textInput.trim());
}
```

**Fichier `app/brouillon/page.tsx` (Page 3)** :
- Récupération de `user_notes` depuis sessionStorage
- Envoi dans le payload WF4A
- Gestion de la réponse cas grave avec redirection Cal.com

### 3. Flux de données corrigé

```
[Page 2 - /analyse]
    ↓ textInput → sessionStorage.setItem("accidentdoc_user_notes")
    ↓ vocalResponse → sessionStorage.setItem("accidentdoc_vocal")
    ↓
[Page 3 - /brouillon]
    ↓ Récupère user_notes + vocal_data depuis sessionStorage
    ↓ POST /webhook/generate-letter avec user_notes
    ↓
[WF4A]
    ├─ CAS GRAVE détecté dans user_notes
    │   → Réponse { action: "redirect_calcom" }
    │   → Front redirige vers Cal.com
    │
    └─ CAS NORMAL
        → Génération lettre enrichie avec user_notes
        → UPSERT dossiers
```

### 4. Réponse cas grave - Format

```json
{
  "success": false,
  "status": "grave_case_detected",
  "action": "redirect_calcom",
  "reason": "grave_case",
  "detected_keywords": ["suicide", "décès"],
  "message": "Ce dossier nécessite un accompagnement personnalisé.",
  "calcom_url": "https://cal.com/accidentdoc/consultation"
}
```

### 5. Debug n8n (WF4A) - Architecture V6 (Simplified) ✅

**Date :** 22 Janvier 2026 (Midi)

**Problème Critique** : Le workflow plantait au nœud "Get Validation ID" (SELECT vide) car le flux ne passait pas par la création d'une entrée dans la table `validations`.

**Solution Appliquée (Bypass)** :
- Suppression définitive des nœuds "Get Validation ID" et "Save to Letters".
- Connexion directe : `Parse Lettre` → `Update Dossier` (UPSERT).
- **Conséquence** : La table `dossiers` devient l'unique source de vérité. Les tables `validations` et `letters` sont désormais obsolètes pour ce flux.

**Architecture V6** :
```
Webhook → Extract & Format → Detect Cas Graves → Route
                                                   ├─ CAS GRAVE → Respond (redirect Cal.com)
                                                   └─ NORMAL → Classifier IA → Parse Scénarios
                                                             → Writer IA → Parse Lettre
                                                             → Update Dossier → Format Response → Réponse
```

**Statut** : Workflow opérationnel (Status 200).

### 6. Robustesse Paiement (WF5 - Stripe Checkout) ✅

**Date :** 22 Janvier 2026 (12:40)

**Problème** : Le workflow plantait ("No output data") si le dossier n'existait pas encore en base au moment du clic "Payer" (ex: latence WF4A ou régénération ID front).

**Solution (Blindage)** :
- Remplacement du nœud SQL `UPDATE` par un `INSERT ... ON CONFLICT (request_id) DO UPDATE`.
- **Gain** : Garantit qu'un `dossier_id` (UUID) est toujours retourné et envoyé dans les métadonnées Stripe.
- **Résultat** : Le lien entre le Paiement (WF5) et la Validation (WF6) est incassable.

**SQL UPSERT appliqué** :
```sql
INSERT INTO dossiers (request_id, customer_email, status, letter_text, document_type, validated_fields, created_at, updated_at)
VALUES (...)
ON CONFLICT (request_id)
DO UPDATE SET
  status = 'pending_payment',
  customer_email = EXCLUDED.customer_email,
  letter_text = EXCLUDED.letter_text,
  updated_at = NOW()
RETURNING id, request_id, status;
```

### 7. Robustesse Webhook Stripe (WF6 - Stripe Webhook) ✅

**Date :** 22 Janvier 2026 (12:50)

**Problème** : Si le dossier n'existait pas en base lors de la réception du webhook Stripe (ex: échec WF5, timeout, ou concurrence), le paiement était "perdu" et le client ne recevait jamais sa lettre.

**Solution (Blindage)** :
- Remplacement du nœud SQL `UPDATE` par un `INSERT ... ON CONFLICT (request_id) DO UPDATE`.
- **Gain** : Le paiement est TOUJOURS enregistré, même si les étapes précédentes ont échoué.
- **Résultat** : Aucun paiement ne peut être perdu, le dossier est créé ou mis à jour de façon atomique.

**SQL UPSERT appliqué (nœud "Update Dossier (Standard)")** :
```sql
INSERT INTO dossiers (
  request_id,
  customer_email,
  customer_name,
  payment_id,
  amount_paid,
  status,
  created_at,
  updated_at
)
VALUES (
  '{{ $json.requestId }}',
  '{{ $json.customerEmail }}',
  '{{ $json.customerName }}',
  '{{ $json.paymentIntent }}',
  {{ $json.amountPaid }},
  'letter_generated',
  NOW(),
  NOW()
)
ON CONFLICT (request_id)
DO UPDATE SET
  status = 'letter_generated',
  customer_name = EXCLUDED.customer_name,
  payment_id = EXCLUDED.payment_id,
  amount_paid = EXCLUDED.amount_paid,
  updated_at = NOW()
RETURNING id, letter_text IS NOT NULL as has_letter;
```

### 8. État des Sprints mis à jour

- [x] Sprint 6 : Inputs Page 2 + Cas Graves + WF4A V6 + WF5 UPSERT + WF6 UPSERT ✅

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
