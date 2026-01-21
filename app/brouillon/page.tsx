"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Scale,
  FileText,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Copy,
  Download,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StepIndicator, CLIENT_STEPS } from "@/components/app/step-indicator";
import {
  generateLetter,
  type DraftLetterResponse,
  type UploadResponse,
  type VocalResponse,
} from "@/lib/n8n";
import { useToast } from "@/components/ui/toaster";

// Labels français pour les scénarios
const SCENARIO_LABELS: Record<string, string> = {
  HORS_HORAIRES: "Hors horaires de travail",
  HORS_LIEU: "Hors lieu de travail",
  TIERS: "Implication d'un tiers",
  PREEXISTANTS: "État préexistant",
  SANS_TEMOIN: "Absence de témoin",
  CIRCONSTANCES_FLOUES: "Circonstances mal définies",
  DELAI_DECLARATION: "Déclaration tardive",
  ABSENCE_LESION_IMMEDIATE: "Pas de lésion immédiate",
  NON_IMPUTABLE: "Doutes sur l'imputabilité",
};

function BrouillonContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const requestId = searchParams.get("rid");

  const [isLoading, setIsLoading] = useState(true);
  const [draftResponse, setDraftResponse] = useState<DraftLetterResponse | null>(null);
  const [letterText, setLetterText] = useState("");
  const [isEdited, setIsEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAndGenerateLetter = useCallback(async () => {
    const extractionStored = sessionStorage.getItem("accidentdoc_extraction");
    const vocalStored = sessionStorage.getItem("accidentdoc_vocal");

    if (!extractionStored) {
      router.push("/upload");
      return;
    }

    try {
      const extractionData: UploadResponse = JSON.parse(extractionStored);
      const vocalData: VocalResponse | null = vocalStored ? JSON.parse(vocalStored) : null;

      if (!extractionData.payload.extractedData) {
        throw new Error("Données d'extraction manquantes");
      }

      const validatedFields = {
        victime: extractionData.payload.extractedData.victime,
        accident: extractionData.payload.extractedData.accident,
        employeur: extractionData.payload.extractedData.employeur,
        temoin: extractionData.payload.extractedData.temoin,
        tiers: extractionData.payload.extractedData.tiers,
        interim: extractionData.payload.extractedData.interim,
      };

      const response = await generateLetter({
        request_id: requestId || extractionData.requestId || `req_${Date.now()}`,
        customer_email: "",
        validated_fields: validatedFields,
        vocal_data: vocalData || undefined,
        document_type: extractionData.payload.documentType || "AT",
      });

      if (response.success) {
        setDraftResponse(response);
        setLetterText(response.letter_text);
        toast({ title: "Brouillon généré", description: "Vous pouvez maintenant réviser et modifier la lettre." });
      } else {
        throw new Error(response.message || "Erreur lors de la génération");
      }
    } catch (err) {
      console.error("Erreur génération lettre:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la génération de la lettre");
      toast({ title: "Erreur", description: "Impossible de générer la lettre.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [requestId, router, toast]);

  useEffect(() => { loadAndGenerateLetter(); }, [loadAndGenerateLetter]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLetterText(e.target.value);
    setIsEdited(true);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(letterText);
      toast({ title: "Copié !", description: "La lettre a été copiée." });
    } catch {
      toast({ title: "Erreur", description: "Impossible de copier.", variant: "destructive" });
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([letterText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lettre-reserves-${draftResponse?.context.victime_nom || "brouillon"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Téléchargé", description: "Le fichier a été téléchargé." });
  };

  const handleSubmitForReview = async () => {
    setIsSubmitting(true);
    try {
      sessionStorage.setItem("accidentdoc_draft", JSON.stringify({
        letter_text: letterText,
        request_id: draftResponse?.request_id,
        context: draftResponse?.context,
        scenarios: draftResponse?.scenarios,
        risk_flags: draftResponse?.risk_flags,
        quality: draftResponse?.quality,
        is_edited: isEdited,
      }));
      toast({ title: "Brouillon enregistré", description: "Redirection vers le paiement..." });
      const rid = draftResponse?.request_id || requestId || "";
      router.push(`/paiement?rid=${rid}`);
    } catch (err) {
      console.error("Erreur soumission:", err);
      toast({ title: "Erreur", description: "Impossible de soumettre.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-gray-600">Génération de votre lettre en cours...</p>
          <p className="text-sm text-gray-400">Notre IA analyse vos données et rédige une lettre personnalisée</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />Erreur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/analyse")}>
                <ArrowLeft className="h-4 w-4 mr-2" />Retour
              </Button>
              <Button onClick={loadAndGenerateLetter}>Réessayer</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            <span className="font-heading text-xl font-semibold text-primary">Accident Doc</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/analyse"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <StepIndicator steps={CLIENT_STEPS} currentStep={2} className="mb-8" />

        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-primary mb-2">Votre brouillon de lettre</h1>
          <p className="text-gray-600">Relisez et modifiez si nécessaire avant de finaliser</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />Lettre de réserves
                    {isEdited && <Badge variant="outline" className="ml-2">Modifié</Badge>}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
                      <Copy className="h-4 w-4 mr-1" />Copier
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadTxt}>
                      <Download className="h-4 w-4 mr-1" />.txt
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea value={letterText} onChange={handleTextChange} className="min-h-[500px] font-mono text-sm leading-relaxed" placeholder="Contenu de la lettre..." />
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => router.push("/analyse")}>
                <ArrowLeft className="h-4 w-4 mr-2" />Modifier les données
              </Button>
              <Button className="flex-1 bg-amber-600 hover:bg-amber-700" onClick={handleSubmitForReview} disabled={isSubmitting || !letterText.trim()}>
                {isSubmitting ? <>Envoi en cours...</> : <><Send className="h-4 w-4 mr-2" />Finaliser la lettre</>}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {draftResponse?.quality && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />Qualité IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Itérations</span>
                    <Badge variant="secondary">{draftResponse.quality.iterations}</Badge>
                  </div>
                  {draftResponse.quality.scores?.forme && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Forme</span>
                        <span className="font-medium">{draftResponse.quality.scores.forme}/10</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Fond</span>
                        <span className="font-medium">{draftResponse.quality.scores.fond}/10</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Cohérence</span>
                        <span className="font-medium">{draftResponse.quality.scores.coherence}/10</span>
                      </div>
                    </>
                  )}
                  {draftResponse.quality.was_refined && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />Lettre affinée par critique IA
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {draftResponse?.scenarios && draftResponse.scenarios.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Scénarios de réserves</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {draftResponse.scenarios.map((scenario, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{SCENARIO_LABELS[scenario] || scenario}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {draftResponse?.risk_flags && draftResponse.risk_flags.length > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-amber-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />Points d&apos;attention
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm text-amber-800">
                    {draftResponse.risk_flags.map((flag, i) => (
                      <li key={i} className="flex items-start gap-2"><span className="text-amber-500">•</span>{flag}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {draftResponse?.context && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Dossier</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><span className="text-gray-500">Victime:</span> <span className="font-medium">{draftResponse.context.victime_prenom} {draftResponse.context.victime_nom}</span></div>
                  <div><span className="text-gray-500">Date accident:</span> <span className="font-medium">{draftResponse.context.accident_date}</span></div>
                  <div><span className="text-gray-500">Lieu:</span> <span className="font-medium">{draftResponse.context.accident_lieu}</span></div>
                  <div><span className="text-gray-500">Employeur:</span> <span className="font-medium">{draftResponse.context.employeur_nom}</span></div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <p className="text-sm text-blue-800"><strong>Conseil :</strong> Relisez attentivement la lettre et vérifiez que toutes les informations sont correctes.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function BrouillonPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-gray-500">Chargement...</div></div>}>
      <BrouillonContent />
    </Suspense>
  );
}
