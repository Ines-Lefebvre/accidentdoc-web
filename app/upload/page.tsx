"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/app/file-upload";
import { StepIndicator, CLIENT_STEPS } from "@/components/app/step-indicator";
import { uploadDocument } from "@/lib/n8n";
import { useToast } from "@/components/ui/toaster";

export default function UploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (file: File) => {
    setError(null);
    setSuccess(false);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(10);

    try {
      // Simuler la progression
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const response = await uploadDocument(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        setSuccess(true);
        toast({
          title: "Document analysé",
          description: "Redirection vers l'analyse...",
          variant: "success",
        });

        // Stocker les données en sessionStorage pour la page suivante
        sessionStorage.setItem(
          "accidentdoc_extraction",
          JSON.stringify(response)
        );

        // Redirection après un court délai
        setTimeout(() => {
          router.push(`/analyse?rid=${response.requestId}`);
        }, 1500);
      } else {
        throw new Error("Échec de l'analyse du document");
      }
    } catch (err) {
      console.error("Erreur upload:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l'analyse"
      );
      toast({
        title: "Erreur",
        description: "Impossible d'analyser le document. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header simplifié */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            <span className="font-heading text-xl font-semibold text-primary">
              Accident Doc
            </span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="container-app">
        {/* Indicateur d'étapes */}
        <StepIndicator
          steps={CLIENT_STEPS}
          currentStep={0}
          className="mb-12"
        />

        {/* Titre */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-primary mb-2">
            Uploadez votre déclaration
          </h1>
          <p className="text-muted-foreground">
            Téléversez le CERFA de déclaration d'accident du travail ou de
            maladie professionnelle
          </p>
        </div>

        {/* Zone d'upload */}
        <div className="max-w-xl mx-auto">
          <div className="card-elevated">
            <FileUpload
              onFileSelect={handleFileSelect}
              onUpload={handleUpload}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              error={error || undefined}
              success={success}
              maxSize={40 * 1024 * 1024} // 40 Mo
            />
          </div>
        </div>

        {/* Informations complémentaires */}
        <div className="max-w-xl mx-auto mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Vos données sont traitées de manière sécurisée et ne sont pas
            conservées après la génération de votre lettre (sauf en cas de
            paiement).
          </p>
        </div>
      </main>
    </div>
  );
}
