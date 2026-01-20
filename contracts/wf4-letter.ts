/**
 * WF4 - Génération de Lettre de Réserves
 * Webhook: POST /webhook/generate-letter
 *
 * Entrée: JSON avec données validées + vocal (optionnel)
 * Sortie: Brouillon de lettre avec métadonnées qualité
 */

import type { ReserveScenario } from "./common";
import type { Wf3VocalResponse } from "./wf3-vocal";

// ============================================
// REQUEST (ce que le front envoie)
// ============================================

export interface Wf4LetterRequest {
  /** ID du dossier (obtenu de WF1) */
  request_id: string;

  /** ID utilisateur Supabase (optionnel) */
  user_id?: string;

  /** Email du client */
  customer_email: string;

  /** Champs validés par l'utilisateur */
  validated_fields: {
    victime?: Record<string, unknown>;
    accident?: Record<string, unknown>;
    employeur?: Record<string, unknown>;
    temoin?: Record<string, unknown>;
    tiers?: Record<string, unknown>;
    interim?: Record<string, unknown>;
  };

  /** Données vocales (si analyse effectuée) */
  vocal_data?: Wf3VocalResponse;

  /** Type de document source */
  document_type: string;
}

// ============================================
// RESPONSE (ce que n8n retourne)
// ============================================

export type Wf4LetterStatus = "draft_ready" | "error";

export interface Wf4LetterResponse {
  success: boolean;
  status: Wf4LetterStatus;

  /** Texte complet de la lettre générée */
  letter_text: string;

  /** Scénarios de réserves utilisés */
  scenarios: ReserveScenario[];

  /** Alertes et points d'attention */
  risk_flags: string[];

  /** Citations juridiques utilisées */
  citations: string[];

  /** Métriques de qualité IA */
  quality: {
    /** Nombre d'itérations de génération */
    iterations: number;
    /** La lettre a-t-elle été affinée par critique IA */
    was_refined: boolean;
    /** Scores de qualité (sur 10) */
    scores: {
      forme?: number;
      fond?: number;
      coherence?: number;
    };
  };

  /** ID du dossier */
  request_id: string;

  /** Contexte extrait pour affichage */
  context: {
    victime_nom: string;
    victime_prenom: string;
    accident_date: string;
    accident_heure?: string;
    accident_lieu: string;
    employeur_nom: string;
    employeur_siret?: string;
    temoin_present?: boolean;
    temoin_nom?: string;
  };

  /** Message informatif */
  message: string;
}

// ============================================
// WF4b - Soumission finale (TODO)
// ============================================

export interface Wf4SubmitRequest {
  request_id: string;
  letter_text: string;
  customer_email: string;
}

export interface Wf4SubmitResponse {
  success: boolean;
  message: string;
  doc_url?: string;
}

// ============================================
// ENDPOINTS
// ============================================

export const WF4_GENERATE_ENDPOINT = "/webhook/generate-letter";
export const WF4_SUBMIT_ENDPOINT = "/webhook/submit-letter";
