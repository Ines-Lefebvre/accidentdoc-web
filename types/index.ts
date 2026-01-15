// Types pour les données extraites du CERFA
export interface Employeur {
  nom_raison_sociale?: string;
  adresse?: string;
  code_postal?: string;
  siret?: string;
  telephone?: string;
  code_risque?: string;
}

export interface Victime {
  nom?: string;
  prenom?: string;
  numero_secu?: string;
  date_naissance?: string;
  adresse?: string;
  nationalite?: string;
  profession?: string;
  qualification?: string;
  date_embauche?: string;
  anciennete_poste?: string;
  type_contrat?: string;
}

export interface Accident {
  date?: string;
  heure?: string;
  lieu?: string;
  siret_lieu?: string;
  activite_victime?: string;
  nature_accident?: string;
  objet_contact?: string;
  siege_lesions?: string;
  nature_lesions?: string;
  horaire_travail?: string;
  consequences?: string;
  arret_travail?: boolean;
  deces?: boolean;
  autres_victimes?: boolean;
  transport_victime?: string;
}

export interface Temoin {
  nom?: string;
  prenom?: string;
  adresse?: string;
}

export interface Tiers {
  implique?: boolean;
  nom?: string;
  adresse?: string;
  assurance?: string;
}

export interface Interim {
  entreprise_travail_temporaire?: string;
  adresse_agence?: string;
  siret_agence?: string;
  contrat_numero?: string;
  date_contrat?: string;
}

// Type de déclaration
export type DocumentType = "AT_normale" | "AT_interim" | "maladie_professionnelle";

// Données extraites complètes
export interface ExtractedData {
  type: DocumentType;
  employeur: Employeur;
  victime: Victime;
  accident: Accident;
  temoin?: Temoin;
  tiers?: Tiers;
  interim?: Interim;
}

// État du dossier
export type DossierStatus =
  | "uploaded"
  | "extracted"
  | "analyzed"
  | "draft_created"
  | "payment_pending"
  | "paid"
  | "review"
  | "validated"
  | "sent"
  | "grave_case";

// Dossier complet
export interface Dossier {
  id: string;
  request_id: string;
  status: DossierStatus;
  document_type: DocumentType;
  extracted_data: ExtractedData;
  vocal_transcription?: string;
  vocal_analysis?: {
    arguments: Array<{
      category: string;
      concern: string;
      strength: "fort" | "moyen" | "faible";
    }>;
    summary: string;
    scenarios: string[];
  };
  is_grave: boolean;
  customer_email?: string;
  doc_url?: string;
  payment_id?: string;
  amount_cents: number;
  created_at: string;
  updated_at: string;
}

// Catégories de réserves
export type ReserveCategory =
  | "HORS_HORAIRES"
  | "HORS_LIEU"
  | "TIERS"
  | "PREEXISTANTS"
  | "SANS_TEMOIN"
  | "CIRCONSTANCES_FLOUES"
  | "DELAI_DECLARATION"
  | "NON_IMPUTABLE"
  | "ABSENCE_LESION_IMMEDIATE";

export const RESERVE_CATEGORIES: Record<ReserveCategory, string> = {
  HORS_HORAIRES: "Accident hors temps de travail",
  HORS_LIEU: "Accident hors lieu de travail/mission",
  TIERS: "Tiers impliqué",
  PREEXISTANTS: "État pathologique préexistant",
  SANS_TEMOIN: "Absence de témoin",
  CIRCONSTANCES_FLOUES: "Circonstances mal définies",
  DELAI_DECLARATION: "Délai anormal de déclaration",
  NON_IMPUTABLE: "Doutes sur l'imputabilité",
  ABSENCE_LESION_IMMEDIATE: "Absence de lésion immédiate",
};

// Mots-clés graves
export const GRAVE_KEYWORDS = [
  "décès",
  "mort",
  "décédé",
  "suicide",
  "harcèlement",
  "viol",
  "meurtre",
  "violence",
  "agression",
];
