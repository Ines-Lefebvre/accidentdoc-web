/**
 * Types partagés entre workflows
 * Ces types sont la source de vérité pour les échanges front ↔ n8n
 */

/** Champ de validation pour formulaire */
export interface ValidationField {
  label: string;
  value: string | null;
  section: string;
  field: string;
  required: boolean;
  isEmpty: boolean;
  needsValidation: boolean;
}

/** Statistiques de complétion d'un formulaire */
export interface CompletionStats {
  totalFields: number;
  filledFields: number;
  completionRate: number;
  requiredFields: number;
  filledRequiredFields: number;
  requiredCompletionRate: number;
}

/** Données extraites d'un document CERFA */
export interface ExtractedData {
  employeur: Record<string, unknown>;
  victime: Record<string, unknown>;
  accident: Record<string, unknown>;
  temoin?: Record<string, unknown>;
  tiers?: Record<string, unknown>;
  interim?: Record<string, unknown>;
}

/** Réponse de base pour tous les workflows */
export interface BaseResponse {
  success: boolean;
  message?: string;
}

/** Argument juridique identifié */
export interface JuridicalArgument {
  category: string;
  concern: string;
  strength: "fort" | "moyen" | "faible";
}

/** Scénarios de réserves possibles */
export type ReserveScenario =
  | "HORS_HORAIRES"
  | "HORS_LIEU"
  | "TIERS"
  | "PREEXISTANTS"
  | "SANS_TEMOIN"
  | "CIRCONSTANCES_FLOUES"
  | "DELAI_DECLARATION"
  | "ABSENCE_LESION_IMMEDIATE"
  | "NON_IMPUTABLE";
