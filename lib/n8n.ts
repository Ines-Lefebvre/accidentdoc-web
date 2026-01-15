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
      employeur: Record<string, any>;
      victime: Record<string, any>;
      accident: Record<string, any>;
      temoin?: Record<string, any>;
      tiers?: Record<string, any>;
      interim?: Record<string, any>;
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
  status: "analyzed" | "transcribed_only" | "grave_case" | "error";
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

export interface LetterResponse {
  success: boolean;
  status: string;
  doc_url: string;
  validation_url: string;
  expires_at: string;
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
 * Génère la lettre de réserves
 */
export async function generateLetter(data: {
  request_id: string;
  user_id?: string;
  customer_email: string;
  validated_fields: Record<string, any>;
  vocal_data?: VocalResponse;
  document_type: string;
}): Promise<LetterResponse> {
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
