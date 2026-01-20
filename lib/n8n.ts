/**
 * lib/n8n.ts - Client n8n pour AccidentDoc
 *
 * Ce fichier contient UNIQUEMENT :
 * - La configuration de base (URL)
 * - Les helpers typés pour appeler les webhooks
 *
 * Les types sont définis dans /contracts/
 * Ce fichier est isomorphique (utilisable client et server)
 */

import type {
  Wf1UploadResponse,
  Wf3VocalResponse,
  Wf4LetterRequest,
  Wf4LetterResponse,
  Wf4SubmitRequest,
  Wf4SubmitResponse,
} from "@/contracts";

import {
  WF1_ENDPOINT,
  WF3_ENDPOINT,
  WF4_GENERATE_ENDPOINT,
  WF4_SUBMIT_ENDPOINT,
} from "@/contracts";

// ============================================
// CONFIGURATION
// ============================================

/**
 * URL de base n8n - utilise la variable d'environnement ou fallback
 * NEXT_PUBLIC_ pour être accessible côté client
 */
export const N8N_BASE_URL =
  process.env.NEXT_PUBLIC_N8N_BASE_URL || "https://n8n.srv833062.hstgr.cloud";

// ============================================
// HELPER GÉNÉRIQUE
// ============================================

/**
 * Classe d'erreur pour les appels n8n
 */
export class N8nError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string
  ) {
    super(message);
    this.name = "N8nError";
  }
}

/**
 * Appel JSON générique à un webhook n8n
 */
export async function callN8n<TResponse>(
  endpoint: string,
  payload: unknown
): Promise<TResponse> {
  const url = `${N8N_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new N8nError(
      `Erreur n8n: ${response.statusText}`,
      response.status,
      endpoint
    );
  }

  return response.json() as Promise<TResponse>;
}

/**
 * Appel FormData à un webhook n8n (pour fichiers)
 */
export async function callN8nFormData<TResponse>(
  endpoint: string,
  formData: FormData
): Promise<TResponse> {
  const url = `${N8N_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new N8nError(
      `Erreur n8n: ${response.statusText}`,
      response.status,
      endpoint
    );
  }

  return response.json() as Promise<TResponse>;
}

// ============================================
// FONCTIONS SPÉCIFIQUES AUX WORKFLOWS
// ============================================

/**
 * WF1 - Upload un document CERFA pour extraction OCR
 */
export async function uploadDocument(file: File): Promise<Wf1UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return callN8nFormData<Wf1UploadResponse>(WF1_ENDPOINT, formData);
}

/**
 * WF3 - Envoie un enregistrement vocal pour analyse
 */
export async function analyzeVocal(audioBlob: Blob): Promise<Wf3VocalResponse> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  return callN8nFormData<Wf3VocalResponse>(WF3_ENDPOINT, formData);
}

/**
 * WF4a - Génère le brouillon de la lettre de réserves
 */
export async function generateLetter(
  data: Wf4LetterRequest
): Promise<Wf4LetterResponse> {
  return callN8n<Wf4LetterResponse>(WF4_GENERATE_ENDPOINT, data);
}

/**
 * WF4b - Soumet le brouillon final pour validation
 */
export async function submitFinalLetter(
  data: Wf4SubmitRequest
): Promise<Wf4SubmitResponse> {
  return callN8n<Wf4SubmitResponse>(WF4_SUBMIT_ENDPOINT, data);
}

/**
 * Vérifie le statut d'un dossier
 * TODO: Implémenter via Supabase ou endpoint dédié
 */
export async function checkDossierStatus(requestId: string): Promise<{
  status: string;
  payment_status?: string;
  doc_url?: string;
}> {
  // TODO: Implémenter via Supabase
  console.warn("checkDossierStatus not implemented, requestId:", requestId);
  return { status: "pending" };
}

// ============================================
// RÉ-EXPORTS POUR RÉTRO-COMPATIBILITÉ
// (à supprimer progressivement)
// ============================================

export type {
  // Types principaux (aliases)
  UploadResponse,
  VocalResponse,
  DraftLetterResponse,
  LetterResponse,
  // Types détaillés
  ValidationField,
  CompletionStats,
  ExtractedData,
  JuridicalArgument,
  ReserveScenario,
} from "@/contracts";
