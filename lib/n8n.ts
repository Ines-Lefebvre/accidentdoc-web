const N8N_BASE_URL = process.env.NEXT_PUBLIC_N8N_BASE_URL || "https://n8n.srv833062.hstgr.cloud";

export interface UploadResponse {
  ok: boolean;
  requestId: string;
  next?: string;
  payload: {
    success: boolean;
    fallback_mode: boolean;
    sessionId: string;
    documentType: string;
    extractedData: {
      employeur: Record<string, unknown>;
      victime: Record<string, unknown>;
      accident: Record<string, unknown>;
      temoin?: Record<string, unknown>;
      tiers?: Record<string, unknown>;
      interim?: Record<string, unknown>;
    };
    validationFields: Record<string, ValidationField>;
    completionStats: {
      totalFields: number;
      filledFields: number;
      completionRate: number;
      requiredFields: number;
      filledRequiredFields: number;
      requiredCompletionRate: number;
    };
    nextStep: string;
  };
}

export interface ValidationField {
  label: string;
  value: string | null;
  section: string;
  field: string;
  required: boolean;
  isEmpty: boolean;
  needsValidation: boolean;
}

export interface VocalResponse {
  success: boolean;
  status: "analyzed" | "transcribed_only" | "grave_case" | "error" | "text_only";
  is_grave: boolean;
  transcription?: string;
  arguments?: Array<{
    category: string;
    concern: string;
    strength: "fort" | "moyen" | "faible";
  }>;
  summary?: string;
  scenarios?: string[];
  grave_keywords?: string[];
  appointment_id?: string;
  amount_cents?: number;
  message?: string;
  next_action?: string;
}

// Nouvelle interface pour la réponse brouillon
export interface DraftLetterResponse {
  success: boolean;
  status: "draft_ready" | "error";
  letter_text: string;
  scenarios: string[];
  risk_flags: string[];
  citations: string[];
  quality: {
    iterations: number;
    was_refined: boolean;
    scores: {
      forme?: number;
      fond?: number;
      coherence?: number;
    };
  };
  request_id: string;
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
  message: string;
}

// Ancienne interface conservée pour compatibilité
export interface LetterResponse {
  success: boolean;
  status: string;
  doc_url?: string;
  validation_url?: string;
  expires_at?: string;
  letter_text?: string;
  scenarios: string[];
  risk_flags: string[];
  message: string;
}

/**
 * Upload un document CERFA pour extraction OCR
 */
export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${N8N_BASE_URL}/webhook/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Erreur upload: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Envoie un enregistrement vocal pour analyse
 */
export async function analyzeVocal(audioBlob: Blob): Promise<VocalResponse> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  const response = await fetch(`${N8N_BASE_URL}/webhook/wf3-vocal`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Erreur vocal: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Génère le brouillon de la lettre de réserves
 */
export async function generateLetter(data: {
  request_id: string;
  user_id?: string;
  customer_email: string;
  validated_fields: Record<string, unknown>;
  vocal_data?: VocalResponse;
  document_type: string;
}): Promise<DraftLetterResponse> {
  const response = await fetch(`${N8N_BASE_URL}/webhook/generate-letter`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Erreur génération: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Soumet le brouillon final pour validation avocat
 * (À implémenter dans un futur workflow)
 */
export async function submitFinalLetter(data: {
  request_id: string;
  letter_text: string;
  customer_email: string;
}): Promise<{ success: boolean; message: string; doc_url?: string }> {
  // TODO: Implémenter WF4b modifié pour créer le doc final
  const response = await fetch(`${N8N_BASE_URL}/webhook/submit-letter`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Erreur soumission: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Vérifie le statut d'un dossier
 */
export async function checkDossierStatus(requestId: string): Promise<{
  status: string;
  payment_status?: string;
  doc_url?: string;
}> {
  // TODO: Implémenter via Supabase ou un endpoint dédié
  return { status: "pending" };
}
