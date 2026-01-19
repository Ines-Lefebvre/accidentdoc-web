"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { ArrowLeft, AlertTriangle, CreditCard, Calendar, Mail, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const N8N_BASE_URL = process.env.NEXT_PUBLIC_N8N_BASE_URL || "https://n8n.srv833062.hstgr.cloud";

interface SelectedSlot {
  start: string;
  end: string;
  timeZone: string;
}

interface VocalData {
  transcription?: string;
  grave_keywords?: string[];
  appointmentId?: string;
}

function PaiementContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const cancelled = searchParams.get("cancelled");

  const [step, setStep] = useState<"select" | "form" | "processing">("select");
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vocalData, setVocalData] = useState<VocalData | null>(null);

  // Charger les données vocales depuis sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("accidentdoc_vocal");
    if (stored) {
      try {
        setVocalData(JSON.parse(stored));
      } catch (e) {
        console.error("Erreur parsing vocal data:", e);
      }
    }
  }, []);

  // Configuration Cal.com
  useEffect(() => {
    (async function () {
      const cal = await getCalApi();
      cal("ui", {
        theme: "light",
        styles: { branding: { brandColor: "#1e3a5f" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      });

      // Écouter la sélection de créneau
      cal("on", {
        action: "bookingSuccessful",
        callback: (e: any) => {
          // Note: On intercepte AVANT la confirmation Cal.com
          // Cette approche nécessite une config Cal.com spécifique
          console.log("Cal.com event:", e);
        },
      });
    })();
  }, []);

  // Gérer la sélection manuelle du créneau via Cal.com
  const handleSlotSelected = (slot: SelectedSlot) => {
    setSelectedSlot(slot);
    setStep("form");
  };

  // Soumettre pour paiement
  const handleSubmitPayment = async () => {
    if (!selectedSlot || !email || !name) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${N8N_BASE_URL}/webhook/wf5-checkout-grave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name,
          phone,
          slot_start: selectedSlot.start,
          slot_end: selectedSlot.end,
          time_zone: selectedSlot.timeZone,
          appointment_id: vocalData?.appointmentId,
          transcription: vocalData?.transcription,
          grave_keywords: vocalData?.grave_keywords,
        }),
      });

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        // Sauvegarder les données avant redirection
        sessionStorage.setItem("accidentdoc_checkout", JSON.stringify({
          appointmentId: data.appointmentId,
          sessionId: data.sessionId,
          slot: selectedSlot,
          email,
          name,
        }));

        // Rediriger vers Stripe
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error || "Erreur lors de la création du paiement");
      }
    } catch (err) {
      console.error("Erreur paiement:", err);
      setError("Impossible de contacter le serveur de paiement");
    } finally {
      setIsLoading(false);
    }
  };

  // Si ce n'est pas un cas grave, afficher le paiement standard
  if (type !== "grave") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Paiement - Lettre de réserves
          </h1>
          <p className="text-gray-600 mb-6">
            Montant : <span className="font-semibold">69€ HT</span> (82,80€ TTC)
          </p>
          <button
            className="w-full bg-blue-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-800 transition"
            onClick={() => {
              alert("Paiement standard à implémenter");
            }}
          >
            Procéder au paiement
          </button>
        </div>
      </div>
    );
  }

  // Cas grave : flux créneau → formulaire → paiement
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Prise de rendez-vous avocat
              </h1>
              <p className="text-gray-600 mt-1">
                Cas grave détecté - Consultation avec avocat spécialisé
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/analyse">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Message d'annulation */}
        {cancelled && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800">
              Votre paiement a été annulé. Vous pouvez sélectionner un nouveau créneau ci-dessous.
            </p>
          </div>
        )}

        {/* Alerte cas grave */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">
                Votre dossier nécessite une attention particulière
              </h3>
              <p className="text-red-700 text-sm mt-1">
                Suite à l'analyse de votre témoignage, nous avons détecté des
                éléments graves. Un rendez-vous avec un avocat spécialisé est recommandé.
              </p>
              {vocalData?.grave_keywords && vocalData.grave_keywords.length > 0 && (
                <p className="text-red-600 text-xs mt-2">
                  Éléments détectés : {vocalData.grave_keywords.join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Étapes */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center ${step === "select" ? "text-blue-600" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "select" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
              <Calendar className="w-4 h-4" />
            </div>
            <span className="ml-2 font-medium">1. Choisir créneau</span>
          </div>
          <div className="w-16 h-0.5 bg-gray-200 mx-4" />
          <div className={`flex items-center ${step === "form" ? "text-blue-600" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "form" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
              <Mail className="w-4 h-4" />
            </div>
            <span className="ml-2 font-medium">2. Vos coordonnées</span>
          </div>
          <div className="w-16 h-0.5 bg-gray-200 mx-4" />
          <div className={`flex items-center ${step === "processing" ? "text-blue-600" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "processing" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="ml-2 font-medium">3. Paiement</span>
          </div>
        </div>

        {/* Prix */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Consultation téléphonique - 30 minutes
                </h2>
                <p className="text-gray-600 text-sm">
                  Avec un avocat spécialisé en droit du travail
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">150€ HT</p>
                <p className="text-sm text-gray-500">180€ TTC</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Étape 1: Sélection créneau */}
        {step === "select" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Choisissez votre créneau
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-6">
                Sélectionnez une date et un horaire qui vous conviennent.
                <strong className="block mt-1">Le rendez-vous ne sera confirmé qu'après le paiement.</strong>
              </p>

              {/* Cal.com embed - version simplifiée pour sélection */}
              <div className="border rounded-lg overflow-hidden">
                <Cal
                  calLink="franck-lapuyade-ydsgrz/rdv-avocat-accident-grave"
                  style={{ width: "100%", height: "500px", overflow: "scroll" }}
                  config={{
                    layout: "month_view",
                    theme: "light",
                  }}
                />
              </div>

              {/* Bouton manuel pour passer à l'étape suivante */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 mb-3">
                  <strong>Important :</strong> Après avoir vu les disponibilités ci-dessus, 
                  entrez manuellement le créneau souhaité :
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="slotDate">Date et heure</Label>
                    <Input
                      id="slotDate"
                      type="datetime-local"
                      onChange={(e) => {
                        const start = new Date(e.target.value).toISOString();
                        const end = new Date(new Date(e.target.value).getTime() + 30 * 60000).toISOString();
                        setSelectedSlot({
                          start,
                          end,
                          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        });
                      }}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => selectedSlot && setStep("form")}
                      disabled={!selectedSlot}
                      className="w-full"
                    >
                      Continuer
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 2: Formulaire coordonnées */}
        {step === "form" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Vos coordonnées
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Récap créneau */}
              {selectedSlot && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600">Créneau sélectionné :</p>
                  <p className="font-semibold">
                    {new Date(selectedSlot.start).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    à{" "}
                    {new Date(selectedSlot.start).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <button
                    onClick={() => setStep("select")}
                    className="text-blue-600 text-sm mt-2 hover:underline"
                  >
                    Modifier le créneau
                  </button>
                </div>
              )}

              {/* Formulaire */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jean Dupont"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jean.dupont@email.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone (pour le RDV)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>

              {/* Erreur */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setStep("select")}
                  disabled={isLoading}
                >
                  Retour
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleSubmitPayment}
                  disabled={isLoading || !email || !name}
                >
                  {isLoading ? (
                    <>Chargement...</>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Payer 150€ et confirmer le RDV
                    </>
                  )}
                </Button>
              </div>

              <p className="text-center text-gray-500 text-xs mt-4">
                Paiement sécurisé par Stripe. Le rendez-vous sera confirmé immédiatement après le paiement.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function PaiementPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      }
    >
      <PaiementContent />
    </Suspense>
  );
}
