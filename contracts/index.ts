/**
 * Contrats d'interface AccidentDoc
 *
 * Ces types sont la SOURCE DE VÉRITÉ pour tous les échanges :
 * - Front Next.js ↔ n8n
 * - n8n ↔ Supabase
 *
 * Règle d'or : Aucun couplage implicite.
 * Tout échange doit être typé, documenté, testable isolément.
 */

// Types partagés
export type {
  ValidationField,
  CompletionStats,
  ExtractedData,
  BaseResponse,
  JuridicalArgument,
  ReserveScenario,
} from "./common";

// WF1 - Upload OCR
export type { Wf1UploadRequest, Wf1UploadResponse } from "./wf1-upload";
export { WF1_ENDPOINT } from "./wf1-upload";

// WF3 - Analyse Vocale
export type {
  Wf3VocalRequest,
  Wf3VocalResponse,
  Wf3VocalStatus,
} from "./wf3-vocal";
export { WF3_ENDPOINT } from "./wf3-vocal";

// WF4 - Génération Lettre
export type {
  Wf4LetterRequest,
  Wf4LetterResponse,
  Wf4LetterStatus,
  Wf4SubmitRequest,
  Wf4SubmitResponse,
} from "./wf4-letter";
export { WF4_GENERATE_ENDPOINT, WF4_SUBMIT_ENDPOINT } from "./wf4-letter";

// WF5 - Checkout Standard
export type {
  Wf5CheckoutRequest,
  Wf5CheckoutResponse,
} from "./wf5-checkout";
export { WF5_CHECKOUT_ENDPOINT } from "./wf5-checkout";

// ============================================
// Aliases pour rétro-compatibilité
// (à supprimer progressivement)
// ============================================

/** @deprecated Utiliser Wf1UploadResponse */
export type UploadResponse = import("./wf1-upload").Wf1UploadResponse;

/** @deprecated Utiliser Wf3VocalResponse */
export type VocalResponse = import("./wf3-vocal").Wf3VocalResponse;

/** @deprecated Utiliser Wf4LetterResponse */
export type DraftLetterResponse = import("./wf4-letter").Wf4LetterResponse;

/** @deprecated Utiliser Wf4SubmitResponse */
export type LetterResponse = import("./wf4-letter").Wf4SubmitResponse & {
  status: string;
  doc_url?: string;
  validation_url?: string;
  expires_at?: string;
  letter_text?: string;
  scenarios: string[];
  risk_flags: string[];
};
