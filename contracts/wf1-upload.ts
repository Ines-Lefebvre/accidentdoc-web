/**
 * WF1 - Upload Document OCR
 * Webhook: POST /webhook/upload
 *
 * Entrée: FormData avec fichier (PDF/image CERFA)
 * Sortie: Données extraites + statistiques de complétion
 */

import type {
  ValidationField,
  CompletionStats,
  ExtractedData,
} from "./common";

// ============================================
// REQUEST (ce que le front envoie)
// ============================================

/**
 * Le front envoie un FormData, pas du JSON
 * Le fichier doit être dans le champ "file"
 */
export interface Wf1UploadRequest {
  file: File;
}

// ============================================
// RESPONSE (ce que n8n retourne)
// ============================================

export interface Wf1UploadResponse {
  /** Indicateur de succès global */
  ok: boolean;

  /** Identifiant unique du dossier (à conserver pour tout le parcours) */
  requestId: string;

  /** Prochaine étape suggérée */
  next?: string;

  /** Payload principal avec les données extraites ou l'erreur */
  payload: {
    success: boolean;

    /** Type d'erreur si success=false */
    error_type?: "INVALID_DOCUMENT" | "MULTIPLE_DAT_DETECTED" | "INVALID_DOCUMENT_TYPE";

    /** Détails de l'erreur */
    errorDetails?: {
      code: string;
      message: string;
      suggestion?: string;
      detected_keywords?: string[];
      detected_count?: number;
    };

    /** Mode dégradé (extraction partielle) */
    fallback_mode?: boolean;

    /** ID de session n8n */
    sessionId?: string;

    /** Type de document détecté: "AT" (accident travail), "MP" (maladie pro), etc. */
    documentType?: string;

    /** Données extraites par section */
    extractedData?: ExtractedData;

    /** Champs à valider par l'utilisateur */
    validationFields?: Record<string, ValidationField>;

    /** Statistiques de complétion */
    completionStats?: CompletionStats;

    /** Prochaine étape dans le parcours */
    nextStep?: string;
  };
}

// ============================================
// ENDPOINT
// ============================================

export const WF1_ENDPOINT = "/webhook/upload";
