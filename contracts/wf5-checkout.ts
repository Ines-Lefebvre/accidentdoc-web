/**
 * WF5 - Stripe Checkout Standard (69€ HT)
 * Webhook: POST /webhook/checkout-standard
 *
 * Entrée: JSON avec email, lettre, context
 * Sortie: URL de checkout Stripe
 */

// ============================================
// REQUEST (ce que le front envoie)
// ============================================

export interface Wf5CheckoutRequest {
  /** ID du dossier */
  request_id: string;

  /** Email du client */
  customer_email: string;

  /** Texte complet de la lettre */
  letter_text: string;

  /** Contexte du dossier pour metadata */
  context?: {
    victime_nom?: string;
    victime_prenom?: string;
    accident_date?: string;
    accident_lieu?: string;
    employeur_nom?: string;
  };
}

// ============================================
// RESPONSE (ce que n8n retourne)
// ============================================

export interface Wf5CheckoutResponse {
  success: boolean;

  /** URL de redirection vers Stripe Checkout */
  checkout_url?: string;

  /** ID de la session Stripe */
  session_id?: string;

  /** Message d'erreur si success=false */
  error?: string;
}

// ============================================
// ENDPOINTS
// ============================================

export const WF5_CHECKOUT_ENDPOINT = "/webhook/checkout-standard";
