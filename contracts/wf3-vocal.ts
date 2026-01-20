/**
 * WF3 - Analyse Vocale
 * Webhook: POST /webhook/wf3-vocal
 *
 * Entrée: FormData avec audio (webm/mp3)
 * Sortie: Transcription + analyse juridique + détection cas grave
 */

import type { JuridicalArgument, ReserveScenario } from "./common";

// ============================================
// REQUEST (ce que le front envoie)
// ============================================

/**
 * Le front envoie un FormData avec l'audio
 * Le fichier doit être dans le champ "audio"
 */
export interface Wf3VocalRequest {
  audio: Blob;
}

// ============================================
// RESPONSE (ce que n8n retourne)
// ============================================

export type Wf3VocalStatus =
  | "analyzed"        // Analyse complète réussie
  | "transcribed_only" // Transcription OK mais analyse échouée
  | "grave_case"      // Cas grave détecté → redirection avocat
  | "text_only"       // Mode texte (pas d'audio)
  | "error";          // Erreur

export interface Wf3VocalResponse {
  success: boolean;
  status: Wf3VocalStatus;

  /** Cas grave détecté (décès, IPP élevée, etc.) */
  is_grave: boolean;

  /** Transcription de l'audio */
  transcription?: string;

  /** Arguments juridiques identifiés */
  arguments?: JuridicalArgument[];

  /** Résumé de la situation */
  summary?: string;

  /** Scénarios de réserves applicables */
  scenarios?: ReserveScenario[];

  /** Mots-clés ayant déclenché le flag "grave" */
  grave_keywords?: string[];

  /** ID du RDV Cal.com si cas grave */
  appointment_id?: string;

  /** Montant en centimes si applicable */
  amount_cents?: number;

  /** Message d'erreur ou d'information */
  message?: string;

  /** Prochaine action suggérée */
  next_action?: string;
}

// ============================================
// ENDPOINT
// ============================================

export const WF3_ENDPOINT = "/webhook/wf3-vocal";
