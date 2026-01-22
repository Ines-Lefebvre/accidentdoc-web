"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Scale, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StepIndicator, CLIENT_STEPS } from "@/components/app/step-indicator";
import { ExtractedDataDisplay } from "@/components/app/extracted-data-display";
import { VoiceRecorder } from "@/components/app/voice-recorder";
import { analyzeVocal, type UploadResponse, type VocalResponse } from "@/lib/n8n";
import { useToast } from "@/components/ui/toaster";
import type { ExtractedData } from "@/types";

function AnalyseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const requestId = searchParams.get("rid");

  const [extractionData, setExtractionData] = useState<UploadResponse | null>(null);
  const [textInput, setTextInput] = useState("");
  const [vocalResponse, setVocalResponse] = useState<VocalResponse | null>(null);
  const [isProcessingVocal, setIsProcessingVocal] = useState(false);
  const [isGraveCase, setIsGraveCase] = useState(false);

  // Charger les données d'extraction depuis sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("accidentdoc_extraction");
    if (stored) {
      try {
        const data = JSON.parse(stored) as UploadResponse;
        setExtractionData(data);
      } catch (e) {
        console.error("Erreur parsing données:", e);
        router.push("/upload");
      }
    } else {
      // Pas de données, retour à l'upload
      router.push("/upload");
    }
  }, [router]);

  const handleVocalComplete = async (blob: Blob) => {
    setIsProcessingVocal(true);
    try {
      const response = await analyzeVocal(blob);
      setVocalResponse(response);

      if (response.is_grave) {
        setIsGraveCase(true);
        toast({
          title: "Cas particulier détecté",
          description:
            "Votre situation nécessite une consultation avec un avocat.",
          variant: "destructive",
        });
      } else if (response.transcription) {
        toast({
          title: "Enregistrement analysé",
          description: "Vos préoccupations ont été prises en compte.",
        });
      }
    } catch (err) {
      console.error("Erreur analyse vocale:", err);
      toast({
        title: "Erreur",
        description: "Impossible d'analyser l'enregistrement.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingVocal(false);
    }
  };

  const handleContinue = () => {
    if (isGraveCase) {
      // Redirection vers paiement cas grave (150€)
      sessionStorage.setItem(
        "accidentdoc_vocal",
        JSON.stringify(vocalResponse)
      );
      router.push("/paiement?type=grave");
    } else {
      // Stocker les données vocales si disponibles
      if (vocalResponse) {
        sessionStorage.setItem("accidentdoc_vocal", JSON.stringify(vocalResponse));
      }

      // Stocker les notes textuelles séparément (IMPORTANT pour WF4A)
      if (textInput.trim()) {
        sessionStorage.setItem("accidentdoc_user_notes", textInput.trim());
      }

      router.push(`/brouillon?rid=${requestId}`);
    }
  };

  if (!extractionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!extractionData.payload.extractedData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-destructive">Erreur: données d&apos;extraction manquantes</div>
      </div>
    );
  }

  const extractedData: ExtractedData = {
    type: extractionData.payload.documentType as ExtractedData["type"],
    employeur: extractionData.payload.extractedData.employeur,
    victime: extractionData.payload.extractedData.victime,
    accident: extractionData.payload.extractedData.accident,
    temoin: extractionData.payload.extractedData.temoin,
    tiers: extractionData.payload.extractedData.tiers,
    interim: extractionData.payload.extractedData.interim,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            <span className="font-heading text-xl font-semibold text-primary">
              Accident Doc
            </span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/upload">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
        </div>
      </header>

      {/* Contenu */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <StepIndicator steps={CLIENT_STEPS} currentStep={1} className="mb-12" />

        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-primary mb-2">
            Vérifiez les informations
          </h1>
          <p className="text-gray-600">
            Voici les données extraites de votre document. Exprimez vos doutes
            ci-dessous.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Colonne gauche: Données extraites */}
          <div>
            <h2 className="font-heading text-xl font-semibold mb-4">
              Informations extraites
            </h2>
            <ExtractedDataDisplay
              data={extractedData}
              validationFields={extractionData.payload.validationFields}
            />
          </div>

          {/* Colonne droite: Expression des doutes */}
          <div className="space-y-6">
            <h2 className="font-heading text-xl font-semibold">
              Exprimez vos réserves
            </h2>

            {/* Alerte cas grave */}
            {isGraveCase && (
              <Card className="border-red-500 bg-red-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-red-600 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Situation particulière détectée
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    Les éléments que vous avez mentionnés nécessitent une
                    consultation directe avec notre avocate partenaire. Un
                    rendez-vous vous sera proposé après paiement (150€).
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Transcription vocale */}
            {vocalResponse?.transcription && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Votre témoignage</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm italic text-gray-600">
                    &quot;{vocalResponse.transcription}&quot;
                  </p>
                  {vocalResponse.arguments && vocalResponse.arguments.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                        Points identifiés
                      </p>
                      <ul className="space-y-1">
                        {vocalResponse.arguments.map((arg, i) => (
                          <li
                            key={i}
                            className="text-sm flex items-center gap-2"
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                arg.strength === "fort"
                                  ? "bg-green-500"
                                  : arg.strength === "moyen"
                                  ? "bg-yellow-500"
                                  : "bg-gray-400"
                              }`}
                            />
                            {arg.concern}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Enregistreur vocal */}
            {!isGraveCase && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Dictez vos préoccupations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VoiceRecorder
                    onRecordingComplete={handleVocalComplete}
                    isProcessing={isProcessingVocal}
                    disabled={!!vocalResponse?.transcription}
                  />
                </CardContent>
              </Card>
            )}

            {/* Zone de texte alternative */}
            {!isGraveCase && !vocalResponse?.transcription && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Ou écrivez vos réserves
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="reserves">Vos doutes et observations</Label>
                    <Textarea
                      id="reserves"
                      placeholder="Décrivez ce qui vous semble suspect dans cet accident : circonstances, horaires, absence de témoin, état préexistant..."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      rows={5}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bouton continuer */}
            <Button
              size="lg"
              className="w-full bg-amber-600 hover:bg-amber-700"
              onClick={handleContinue}
              disabled={
                isProcessingVocal ||
                (!vocalResponse?.transcription && !textInput.trim() && !isGraveCase)
              }
            >
              {isGraveCase ? (
                <>Prendre rendez-vous (150€)</>
              ) : (
                <>
                  Continuer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AnalysePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Chargement...</div>
      </div>
    }>
      <AnalyseContent />
    </Suspense>
  );
}
